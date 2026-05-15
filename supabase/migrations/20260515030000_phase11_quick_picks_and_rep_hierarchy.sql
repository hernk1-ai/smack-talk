create table if not exists public.quick_picks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null references public.games(id) on delete cascade,
  question_text text not null,
  selected_side text not null,
  result text not null default 'pending',
  rep_delta integer not null default 0,
  created_at timestamptz not null default now(),
  settled_at timestamptz null,
  constraint quick_picks_question_text_check check (btrim(question_text) <> ''),
  constraint quick_picks_selected_side_check check (btrim(selected_side) <> ''),
  constraint quick_picks_result_check check (result in ('pending', 'hit', 'miss')),
  constraint quick_picks_user_game_question_unique unique (user_id, game_id, question_text)
);

create index if not exists quick_picks_game_id_idx on public.quick_picks(game_id);
create index if not exists quick_picks_user_id_idx on public.quick_picks(user_id);

alter table public.quick_picks enable row level security;

drop policy if exists "Authenticated users can read quick picks" on public.quick_picks;
create policy "Authenticated users can read quick picks"
on public.quick_picks
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own quick picks" on public.quick_picks;
create policy "Users can insert their own quick picks"
on public.quick_picks
for insert
to authenticated
with check (auth.uid() = user_id);

alter table public.take_reactions
  add column if not exists result text not null default 'pending',
  add column if not exists rep_delta integer not null default 0,
  add column if not exists settled_at timestamptz null;

alter table public.take_reactions
  drop constraint if exists take_reactions_result_check;

alter table public.take_reactions
  add constraint take_reactions_result_check check (result in ('pending', 'hit', 'miss'));

create or replace function public.calculate_receipt_reputation_delta(
  receipt_result text,
  receipt_heat integer
)
returns integer
as $$
  select case
    when receipt_result = 'hit' then 100
    when receipt_result = 'miss' then -75
    else 0
  end
$$
language sql
stable;

drop function if exists public.dev_settle_game(text, text);

create or replace function public.dev_settle_game(
  target_game_id text default 'lal-gsw-live',
  settle_result text default 'hit'
)
returns table (
  settled_take_id uuid,
  receipt_id uuid,
  settled_result text
)
language plpgsql
security definer
set search_path = public
as $dev_settle_game$
declare
  take_record record;
  quick_pick_record record;
  game_pick_record record;
  take_reaction_record record;
  generated_receipt_id uuid;
begin
  if settle_result not in ('hit', 'miss') then
    raise exception 'settle_result must be hit or miss';
  end if;

  update public.games as game
  set
    status = 'final',
    ended_at = coalesce(game.ended_at, now()),
    updated_at = now()
  where game.id = target_game_id;

  for take_record in
    update public.takes as locked_take
    set
      status = 'settled',
      result = settle_result,
      settled_at = coalesce(locked_take.settled_at, now()),
      updated_at = now()
    where locked_take.game_id = target_game_id
      and locked_take.status = 'locked'
      and locked_take.result = 'pending'
    returning locked_take.id, locked_take.result
  loop
    generated_receipt_id := public.create_receipt_for_take(take_record.id);

    if generated_receipt_id is null then
      select receipt.id
      into generated_receipt_id
      from public.receipts as receipt
      where receipt.take_id = take_record.id
      limit 1;
    end if;

    settled_take_id := take_record.id;
    receipt_id := generated_receipt_id;
    settled_result := take_record.result::text;
    return next;
  end loop;

  for quick_pick_record in
    update public.quick_picks as quick_pick
    set
      result = settle_result,
      rep_delta = case when settle_result = 'hit' then 3 else -1 end,
      settled_at = coalesce(quick_pick.settled_at, now())
    where quick_pick.game_id = target_game_id
      and quick_pick.result = 'pending'
    returning quick_pick.user_id, quick_pick.rep_delta
  loop
    update public.profiles as profile
    set
      reputation_score = greatest(profile.reputation_score + quick_pick_record.rep_delta, 0),
      reputation = greatest(profile.reputation + quick_pick_record.rep_delta, 0),
      updated_at = now()
    where profile.id = quick_pick_record.user_id;
  end loop;

  for take_reaction_record in
    update public.take_reactions as take_reaction
    set
      result = case
        when (take_reaction.reaction = 'ride' and locked_take.result = 'hit')
          or (take_reaction.reaction = 'fade' and locked_take.result = 'miss')
          then 'hit'
        else 'miss'
      end,
      rep_delta = case
        when (take_reaction.reaction = 'ride' and locked_take.result = 'hit')
          or (take_reaction.reaction = 'fade' and locked_take.result = 'miss')
          then 12
        else -6
      end,
      settled_at = coalesce(take_reaction.settled_at, now()),
      updated_at = now()
    from public.takes as locked_take
    where take_reaction.take_id = locked_take.id
      and locked_take.game_id = target_game_id
      and locked_take.status = 'settled'
      and take_reaction.result = 'pending'
    returning take_reaction.user_id, take_reaction.rep_delta
  loop
    update public.profiles as profile
    set
      reputation_score = greatest(profile.reputation_score + take_reaction_record.rep_delta, 0),
      reputation = greatest(profile.reputation + take_reaction_record.rep_delta, 0),
      updated_at = now()
    where profile.id = take_reaction_record.user_id;
  end loop;

  for game_pick_record in
    update public.game_picks as game_pick
    set
      status = 'settled',
      result = settle_result,
      reputation_delta = case when settle_result = 'hit' then 3 else -1 end,
      settled_at = coalesce(game_pick.settled_at, now())
    where game_pick.game_id = target_game_id
      and game_pick.is_locked = true
      and game_pick.status = 'locked'
      and game_pick.result = 'pending'
    returning game_pick.user_id, game_pick.reputation_delta
  loop
    update public.profiles as profile
    set
      reputation_score = greatest(profile.reputation_score + game_pick_record.reputation_delta, 0),
      reputation = greatest(profile.reputation + game_pick_record.reputation_delta, 0),
      updated_at = now()
    where profile.id = game_pick_record.user_id;
  end loop;
end;
$dev_settle_game$;

grant execute on function public.dev_settle_game(text, text) to authenticated;
