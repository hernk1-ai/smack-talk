-- Phase 9: sport/event groundwork plus mini-lock support for game picks.
-- Safe to run more than once.

alter table public.games
  add column if not exists event_slug text null,
  add column if not exists event_name text null;

alter table public.game_picks
  add column if not exists is_locked boolean not null default false,
  add column if not exists locked_at timestamptz null;

update public.game_picks
set
  is_locked = true,
  locked_at = coalesce(locked_at, created_at)
where is_locked = false
  and status in ('locked', 'settled');

drop policy if exists "Users can update their own game picks" on public.game_picks;

insert into public.games (
  id,
  league,
  away_team,
  home_team,
  away_score,
  home_score,
  period,
  clock,
  status,
  watching_count,
  ride_count,
  fade_count,
  heat,
  event_slug,
  event_name
)
values
  ('lal-gsw-live', 'NBA', 'LAL', 'GSW', 108, 103, '4TH QTR', '2:47', 'live', 12800, 620, 380, 3600, 'playoff-push', 'Playoff Push'),
  ('bos-nyk-live', 'NBA', 'BOS', 'NYK', 89, 92, 'Q3', '6:12', 'live', 7300, 410, 590, 1900, 'east-chaos', 'East Chaos'),
  ('kc-phi-live', 'NFL', 'KC', 'PHI', 24, 20, '4TH', '8:41', 'live', 18400, 540, 460, 2400, 'sunday-night-smoke', 'Sunday Night Smoke'),
  ('nyy-bos-live', 'MLB', 'NYY', 'BOS', 4, 5, '8TH', null, 'live', 9200, 470, 530, 1400, 'rivalry-week', 'Rivalry Week'),
  ('edm-dal-live', 'NHL', 'EDM', 'DAL', 2, 2, '3RD', '11:08', 'live', 6800, 510, 490, 1200, 'cup-pressure', 'Cup Pressure'),
  ('ars-mci-live', 'Soccer', 'ARS', 'MCI', 1, 1, '76''', null, 'live', 15100, 480, 520, 2200, 'title-race', 'Title Race')
on conflict (id) do update
set
  league = excluded.league,
  away_team = excluded.away_team,
  home_team = excluded.home_team,
  away_score = excluded.away_score,
  home_score = excluded.home_score,
  period = excluded.period,
  clock = excluded.clock,
  status = excluded.status,
  watching_count = excluded.watching_count,
  ride_count = excluded.ride_count,
  fade_count = excluded.fade_count,
  heat = excluded.heat,
  event_slug = excluded.event_slug,
  event_name = excluded.event_name,
  updated_at = now();

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
as $dev_settle_game$
declare
  take_record record;
  mini_lock_record record;
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

  for mini_lock_record in
    update public.game_picks as game_pick
    set
      status = 'settled',
      result = settle_result,
      reputation_delta = case
        when settle_result = 'hit' then 3
        else -1
      end,
      settled_at = coalesce(game_pick.settled_at, now())
    where game_pick.game_id = target_game_id
      and game_pick.is_locked = true
      and game_pick.status = 'locked'
      and game_pick.result = 'pending'
    returning game_pick.user_id, game_pick.reputation_delta
  loop
    update public.profiles as profile
    set
      reputation_score = profile.reputation_score + mini_lock_record.reputation_delta,
      reputation = profile.reputation + mini_lock_record.reputation_delta,
      updated_at = now()
    where profile.id = mini_lock_record.user_id;
  end loop;
end;
$dev_settle_game$;

grant execute on function public.dev_settle_game(text, text) to authenticated;
