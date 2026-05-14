alter table public.take_replies
  add column if not exists parent_reply_id uuid null references public.take_replies(id) on delete cascade;

create index if not exists take_replies_parent_reply_id_idx
  on public.take_replies(parent_reply_id);

drop policy if exists "Users can insert their own take replies" on public.take_replies;
create policy "Users can insert their own take replies"
  on public.take_replies
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create or replace function public.apply_take_reply_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.takes as locked_take
  set
    reply_count = (
      select count(*)::integer
      from public.take_replies as reply
      where reply.take_id = new.take_id
    ),
    updated_at = now()
  where locked_take.id = new.take_id;

  perform public.recalculate_take_heat(new.take_id);

  return new;
end;
$$;

create or replace function public.apply_take_reply_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.takes as locked_take
  set
    reply_count = (
      select count(*)::integer
      from public.take_replies as reply
      where reply.take_id = old.take_id
    ),
    updated_at = now()
  where locked_take.id = old.take_id;

  perform public.recalculate_take_heat(old.take_id);

  return old;
end;
$$;

drop trigger if exists take_replies_after_insert on public.take_replies;
create trigger take_replies_after_insert
  after insert on public.take_replies
  for each row
  execute function public.apply_take_reply_insert();

drop trigger if exists take_replies_after_delete on public.take_replies;
create trigger take_replies_after_delete
  after delete on public.take_replies
  for each row
  execute function public.apply_take_reply_delete();

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
