-- Verification queries for the World Cup 2026 games seed.
-- Run after applying 20260612140000_seed_world_cup_games.sql.

-- 1) Exactly 104 World Cup matches exist.
--    EXPECT: world_cup_matches = 104
select count(*) as world_cup_matches
from public.games
where league = 'World Cup';

-- 2) Structural completeness: every FIFA match number 1..104 exists exactly once.
--    EXPECT: 0 rows (no missing numbers)
select n as missing_match_number
from generate_series(1, 104) as n
where not exists (
  select 1 from public.games where id = 'wc-2026-' || n
);

-- 2b) No duplicate / unexpected World Cup ids.
--    EXPECT: 0 rows
select id, count(*)
from public.games
where league = 'World Cup'
group by id
having count(*) > 1;

-- 3) Kickoff order matches FIFA: listing by kickoff should track the FIFA match
--    number, and the tournament opens with Match 1 (Mexico) and ends with the
--    Final (Match 104). Eyeball that match_no increases with starts_at.
select
  split_part(id, '-', 3)::int as fifa_match_number,
  starts_at,
  home_team,
  away_team,
  period,
  status
from public.games
where league = 'World Cup'
order by starts_at asc, fifa_match_number asc;

-- 3b) First and last match sanity check.
--    EXPECT: opener = Match 1, finale = Match 104 (Final)
(select 'opener' as slot, split_part(id, '-', 3)::int as match_no, home_team, away_team, starts_at
   from public.games where league = 'World Cup' order by starts_at asc, match_no asc limit 1)
union all
(select 'finale' as slot, split_part(id, '-', 3)::int as match_no, home_team, away_team, starts_at
   from public.games where league = 'World Cup' order by starts_at desc, match_no desc limit 1);

-- 4) Completed matches retain their synced scores (re-seeding never resets them).
--    Review: these should show real, non-placeholder scores for finished games.
select id, home_team, home_score, away_score, away_team, status, ended_at, updated_at
from public.games
where league = 'World Cup' and status = 'final'
order by starts_at asc;

-- 4b) Flag any final match still 0-0 (likely needs an ESPN sync, not a seed bug).
--    EXPECT: ideally 0 rows once ESPN sync has run for completed matches.
select id, home_team, away_team, starts_at
from public.games
where league = 'World Cup' and status = 'final' and home_score = 0 and away_score = 0
order by starts_at asc;
