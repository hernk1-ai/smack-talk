create or replace function public.calculate_receipt_reputation_delta(
  receipt_result text,
  receipt_heat integer
)
returns integer
language plpgsql
stable
as $$
begin
  return case
    when receipt_result = 'hit' and coalesce(receipt_heat, 0) >= 25 then 35
    when receipt_result = 'hit' and coalesce(receipt_heat, 0) >= 10 then 30
    when receipt_result = 'hit' then 25
    when receipt_result = 'miss' then -10
    else 0
  end;
end;
$$;

create or replace function public.create_receipt_for_take(target_take_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_receipt_id uuid;
begin
  with inserted_receipt as (
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
      locked_take.id,
      locked_take.user_id,
      locked_take.game_id,
      locked_take.result,
      locked_take.take_text,
      concat(game.away_team, ' vs ', game.home_team),
      concat(game.away_team, ' ', game.away_score, ' - ', game.home_score, ' ', game.home_team),
      locked_take.ride_count,
      locked_take.fade_count,
      locked_take.reply_count,
      locked_take.heat,
      public.calculate_receipt_reputation_delta(locked_take.result, locked_take.heat)
    from public.takes as locked_take
    join public.games as game on game.id = locked_take.game_id
    where locked_take.id = target_take_id
      and locked_take.status = 'settled'
      and locked_take.result in ('hit', 'miss')
    on conflict (take_id) do nothing
    returning
      public.receipts.id,
      public.receipts.user_id,
      public.receipts.result,
      public.receipts.reputation_delta
  ),
  profile_update as (
    update public.profiles as profile
    set
      reputation_score = greatest(profile.reputation_score + inserted_receipt.reputation_delta, 0),
      reputation = greatest(profile.reputation + inserted_receipt.reputation_delta, 0),
      receipts_count = profile.receipts_count + 1,
      hits_count = profile.hits_count + case when inserted_receipt.result = 'hit' then 1 else 0 end,
      misses_count = profile.misses_count + case when inserted_receipt.result = 'miss' then 1 else 0 end,
      updated_at = now()
    from inserted_receipt
    where profile.id = inserted_receipt.user_id
    returning inserted_receipt.id
  )
  select profile_update.id
  into inserted_receipt_id
  from profile_update
  limit 1;

  return inserted_receipt_id;
end;
$$;

create or replace function public.create_receipt_after_take_settled()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'settled' and new.result in ('hit', 'miss') then
    perform public.create_receipt_for_take(new.id);
  end if;

  return new;
end;
$$;

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
language plpgsql
security definer
set search_path = public
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

  return query
  with newly_settled as (
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
  ),
  generated_receipts as (
    select
      newly_settled.id as take_id,
      public.create_receipt_for_take(newly_settled.id) as receipt_id,
      newly_settled.result as take_result
    from newly_settled
  )
  select
    generated_receipts.take_id as settled_take_id,
    coalesce(generated_receipts.receipt_id, receipt.id) as receipt_id,
    generated_receipts.take_result::text as settled_result
  from generated_receipts
  left join public.receipts as receipt on receipt.take_id = generated_receipts.take_id
  order by generated_receipts.take_id;
end;
$$;

grant execute on function public.dev_settle_game(text, text) to authenticated;
