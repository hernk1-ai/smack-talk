-- LOCKT blank-slate reset script
-- Purpose: clear social/test activity and reset counters without changing schema/mechanics.
-- Safe to run in Supabase SQL editor for a clean product walkthrough.

begin;

-- 1) Clear social activity in FK-safe order
delete from public.take_replies;
delete from public.take_reactions;
delete from public.receipts;
delete from public.quick_picks;
delete from public.game_picks;
delete from public.takes;

-- 2) Reset profile counters/scores
update public.profiles
set
  reputation = 0,
  reputation_score = 0,
  created_takes_count = 0,
  hits_count = 0,
  misses_count = 0,
  receipts_count = 0;

-- 3) Reset game-facing counters (keep required game rows intact)
update public.games
set
  watching_count = 0,
  ride_count = 0,
  fade_count = 0,
  heat = 0,
  home_score = 0,
  away_score = 0,
  period = null,
  clock = null;

commit;

-- Notes:
-- - This script intentionally does NOT delete auth users, profiles, games, or static schedule/team data.
-- - After running, Early Call Feed and Receipts should start blank until new activity is created.
