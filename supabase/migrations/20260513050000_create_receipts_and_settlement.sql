create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists reputation_score integer not null default 0,
  add column if not exists hits_count integer not null default 0,
  add column if not exists misses_count integer not null default 0,
  add column if not exists receipts_count integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_reputation_score_non_negative'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_reputation_score_non_negative
      check (reputation_score >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_summary_counts_non_negative'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_summary_counts_non_negative
      check (
        hits_count >= 0 and
        misses_count >= 0 and
        receipts_count >= 0
      );
  end if;
end $$;

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  take_id uuid not null references public.takes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null references public.games(id),
  result text not null,
  take_text text not null,
  game_label text null,
  final_score text null,
  ride_count integer not null default 0,
  fade_count integer not null default 0,
  reply_count integer not null default 0,
  heat integer not null default 0,
  reputation_delta integer not null default 0,
  created_at timestamptz not null default now(),
  unique (take_id)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'receipts_result_check'
      and conrelid = 'public.receipts'::regclass
  ) then
    alter table public.receipts
      add constraint receipts_result_check
      check (result in ('hit', 'miss'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'receipts_counts_non_negative'
      and conrelid = 'public.receipts'::regclass
  ) then
    alter table public.receipts
      add constraint receipts_counts_non_negative
      check (
        ride_count >= 0 and
        fade_count >= 0 and
        reply_count >= 0 and
        heat >= 0
      );
  end if;
end $$;

alter table public.receipts enable row level security;

drop policy if exists "Authenticated users can read receipts" on public.receipts;
create policy "Authenticated users can read receipts"
  on public.receipts
  for select
  to authenticated
  using (true);

create or replace function public.calculate_receipt_reputation_delta(
  receipt_result text,
  receipt_heat integer
)
returns integer
as $$
begin
  return case
    when receipt_result = 'hit' and receipt_heat >= 25 then 35
    when receipt_result = 'hit' and receipt_heat >= 10 then 30
    when receipt_result = 'hit' then 25
    when receipt_result = 'miss' then -10
    else 0
  end;
end;
$$ language plpgsql immutable;

create or replace function public.create_receipt_for_take(target_take_id uuid)
returns void
as $$
begin
  with inserted as (
    insert into public.receipts (
      take_id,
      user_id,
      game_id,
      result,
      take_text,
      game_label,
      final_score,
      ride_count,
      fade_count,
      reply_count,
      heat,
      reputation_delta
    )
    select
      t.id,
      t.user_id,
      t.game_id,
      t.result,
      t.take_text,
      concat(g.away_team, ' vs ', g.home_team),
      concat(g.away_team, ' ', g.away_score, ' - ', g.home_score, ' ', g.home_team),
      t.ride_count,
      t.fade_count,
      t.reply_count,
      t.heat,
      public.calculate_receipt_reputation_delta(t.result, t.heat)
    from public.takes t
    join public.games g on g.id = t.game_id
    where t.id = target_take_id
      and t.status = 'settled'
      and t.result in ('hit', 'miss')
    on conflict (take_id) do nothing
    returning user_id, result, reputation_delta
  )
  update public.profiles p
  set
    reputation_score = greatest(p.reputation_score + i.reputation_delta, 0),
    reputation = greatest(p.reputation + i.reputation_delta, 0),
    receipts_count = p.receipts_count + 1,
    hits_count = p.hits_count + case when i.result = 'hit' then 1 else 0 end,
    misses_count = p.misses_count + case when i.result = 'miss' then 1 else 0 end,
    updated_at = now()
  from inserted i
  where p.id = i.user_id;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.create_receipt_after_take_settled()
returns trigger
as $$
begin
  if new.status = 'settled' and new.result in ('hit', 'miss') then
    perform public.create_receipt_for_take(new.id);
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists takes_after_settlement_receipt on public.takes;
create trigger takes_after_settlement_receipt
  after update of status, result on public.takes
  for each row
  when (
    new.status = 'settled' and
    new.result in ('hit', 'miss') and
    (old.status is distinct from new.status or old.result is distinct from new.result)
  )
  execute function public.create_receipt_after_take_settled();

drop function if exists public.dev_settle_game(text, text);

create function public.dev_settle_game(
  target_game_id text default 'lal-gsw-live',
  settle_result text default 'hit'
)
returns table (
  settled_take_id uuid,
  receipt_id uuid,
  settled_result text
)
as $$
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

  update public.takes as locked_take
  set
    status = 'settled',
    result = settle_result,
    settled_at = coalesce(locked_take.settled_at, now()),
    updated_at = now()
  where locked_take.game_id = target_game_id
    and locked_take.status = 'locked'
    and locked_take.result = 'pending';

  return query
  select
    settled_take.id as settled_take_id,
    receipt.id as receipt_id,
    settled_take.result::text as settled_result
  from public.takes as settled_take
  left join public.receipts as receipt on receipt.take_id = settled_take.id
  where settled_take.game_id = target_game_id
    and settled_take.status = 'settled'
  order by settled_take.created_at desc;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.dev_settle_game(text, text) to authenticated;
