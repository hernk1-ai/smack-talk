-- Seed all 104 official FIFA World Cup 2026 matches into public.games.
--
-- SOURCE OF TRUTH: data/worldCupSchedule.ts (FIFA official match numbers, kickoffs,
-- pairings, venues). This file is generated from that dataset; regenerate it if the
-- canonical schedule changes.
--
-- IDEMPOTENT + DATA-SAFE:
--   * Safe to re-run. New rows are inserted; existing rows keep all live data.
--   * On conflict we PRESERVE the synced/manual fields: status, home_score,
--     away_score, clock, period, ended_at, and all engagement counters.
--   * We only backfill immutable metadata (home_team, away_team, starts_at, league,
--     sport, event_name, event_slug) when it is missing/placeholder, so resolved
--     knockout team names and corrected kickoffs are never clobbered.
--
-- New rows start as status='scheduled' with 0-0; the ESPN sync / admin panel will
-- set live status and scores. (All matches not already present are in the future,
-- so 'scheduled' is correct at seed time.)
--
-- NOTE: games has no stadium/city/group columns; group/stage is stored in "period"
-- (existing convention) and immutable venue/city remain in the static FIFA reference
-- joined by id.

insert into public.games
  (id, league, sport, home_team, away_team, home_score, away_score, period, clock, status, starts_at, ended_at, event_slug, event_name)
values
  ('wc-2026-1', 'World Cup', 'Soccer', 'Mexico', 'South Africa', 0, 0, 'Group A', null, 'scheduled', '2026-06-11T15:00:00-04:00', null, 'wc-2026-match-1', 'World Cup · Match 1'),
  ('wc-2026-2', 'World Cup', 'Soccer', 'Korea Republic', 'Czechia', 0, 0, 'Group A', null, 'scheduled', '2026-06-11T22:00:00-04:00', null, 'wc-2026-match-2', 'World Cup · Match 2'),
  ('wc-2026-3', 'World Cup', 'Soccer', 'Canada', 'Bosnia and Herzegovina', 0, 0, 'Group B', null, 'scheduled', '2026-06-12T15:00:00-04:00', null, 'wc-2026-match-3', 'World Cup · Match 3'),
  ('wc-2026-4', 'World Cup', 'Soccer', 'United States', 'Paraguay', 0, 0, 'Group D', null, 'scheduled', '2026-06-12T21:00:00-04:00', null, 'wc-2026-match-4', 'World Cup · Match 4'),
  ('wc-2026-5', 'World Cup', 'Soccer', 'Haiti', 'Scotland', 0, 0, 'Group C', null, 'scheduled', '2026-06-13T21:00:00-04:00', null, 'wc-2026-match-5', 'World Cup · Match 5'),
  ('wc-2026-6', 'World Cup', 'Soccer', 'Australia', 'Türkiye', 0, 0, 'Group D', null, 'scheduled', '2026-06-13T00:00:00-04:00', null, 'wc-2026-match-6', 'World Cup · Match 6'),
  ('wc-2026-7', 'World Cup', 'Soccer', 'Brazil', 'Morocco', 0, 0, 'Group C', null, 'scheduled', '2026-06-13T18:00:00-04:00', null, 'wc-2026-match-7', 'World Cup · Match 7'),
  ('wc-2026-8', 'World Cup', 'Soccer', 'Qatar', 'Switzerland', 0, 0, 'Group B', null, 'scheduled', '2026-06-13T15:00:00-04:00', null, 'wc-2026-match-8', 'World Cup · Match 8'),
  ('wc-2026-9', 'World Cup', 'Soccer', 'Côte d''Ivoire', 'Ecuador', 0, 0, 'Group E', null, 'scheduled', '2026-06-14T19:00:00-04:00', null, 'wc-2026-match-9', 'World Cup · Match 9'),
  ('wc-2026-10', 'World Cup', 'Soccer', 'Germany', 'Curaçao', 0, 0, 'Group E', null, 'scheduled', '2026-06-14T13:00:00-04:00', null, 'wc-2026-match-10', 'World Cup · Match 10'),
  ('wc-2026-11', 'World Cup', 'Soccer', 'Netherlands', 'Japan', 0, 0, 'Group F', null, 'scheduled', '2026-06-14T16:00:00-04:00', null, 'wc-2026-match-11', 'World Cup · Match 11'),
  ('wc-2026-12', 'World Cup', 'Soccer', 'Sweden', 'Tunisia', 0, 0, 'Group F', null, 'scheduled', '2026-06-14T22:00:00-04:00', null, 'wc-2026-match-12', 'World Cup · Match 12'),
  ('wc-2026-13', 'World Cup', 'Soccer', 'Saudi Arabia', 'Uruguay', 0, 0, 'Group H', null, 'scheduled', '2026-06-15T18:00:00-04:00', null, 'wc-2026-match-13', 'World Cup · Match 13'),
  ('wc-2026-14', 'World Cup', 'Soccer', 'Spain', 'Cabo Verde', 0, 0, 'Group H', null, 'scheduled', '2026-06-15T12:00:00-04:00', null, 'wc-2026-match-14', 'World Cup · Match 14'),
  ('wc-2026-15', 'World Cup', 'Soccer', 'IR Iran', 'New Zealand', 0, 0, 'Group G', null, 'scheduled', '2026-06-15T21:00:00-04:00', null, 'wc-2026-match-15', 'World Cup · Match 15'),
  ('wc-2026-16', 'World Cup', 'Soccer', 'Belgium', 'Egypt', 0, 0, 'Group G', null, 'scheduled', '2026-06-15T15:00:00-04:00', null, 'wc-2026-match-16', 'World Cup · Match 16'),
  ('wc-2026-17', 'World Cup', 'Soccer', 'France', 'Senegal', 0, 0, 'Group I', null, 'scheduled', '2026-06-16T15:00:00-04:00', null, 'wc-2026-match-17', 'World Cup · Match 17'),
  ('wc-2026-18', 'World Cup', 'Soccer', 'Iraq', 'Norway', 0, 0, 'Group I', null, 'scheduled', '2026-06-16T18:00:00-04:00', null, 'wc-2026-match-18', 'World Cup · Match 18'),
  ('wc-2026-19', 'World Cup', 'Soccer', 'Argentina', 'Algeria', 0, 0, 'Group J', null, 'scheduled', '2026-06-16T21:00:00-04:00', null, 'wc-2026-match-19', 'World Cup · Match 19'),
  ('wc-2026-20', 'World Cup', 'Soccer', 'Austria', 'Jordan', 0, 0, 'Group J', null, 'scheduled', '2026-06-16T00:00:00-04:00', null, 'wc-2026-match-20', 'World Cup · Match 20'),
  ('wc-2026-21', 'World Cup', 'Soccer', 'Ghana', 'Panama', 0, 0, 'Group L', null, 'scheduled', '2026-06-17T19:00:00-04:00', null, 'wc-2026-match-21', 'World Cup · Match 21'),
  ('wc-2026-22', 'World Cup', 'Soccer', 'England', 'Croatia', 0, 0, 'Group L', null, 'scheduled', '2026-06-17T16:00:00-04:00', null, 'wc-2026-match-22', 'World Cup · Match 22'),
  ('wc-2026-23', 'World Cup', 'Soccer', 'Portugal', 'DR Congo', 0, 0, 'Group K', null, 'scheduled', '2026-06-17T13:00:00-04:00', null, 'wc-2026-match-23', 'World Cup · Match 23'),
  ('wc-2026-24', 'World Cup', 'Soccer', 'Uzbekistan', 'Colombia', 0, 0, 'Group K', null, 'scheduled', '2026-06-17T22:00:00-04:00', null, 'wc-2026-match-24', 'World Cup · Match 24'),
  ('wc-2026-25', 'World Cup', 'Soccer', 'Czechia', 'South Africa', 0, 0, 'Group A', null, 'scheduled', '2026-06-18T12:00:00-04:00', null, 'wc-2026-match-25', 'World Cup · Match 25'),
  ('wc-2026-26', 'World Cup', 'Soccer', 'Switzerland', 'Bosnia and Herzegovina', 0, 0, 'Group B', null, 'scheduled', '2026-06-18T15:00:00-04:00', null, 'wc-2026-match-26', 'World Cup · Match 26'),
  ('wc-2026-27', 'World Cup', 'Soccer', 'Canada', 'Qatar', 0, 0, 'Group B', null, 'scheduled', '2026-06-18T18:00:00-04:00', null, 'wc-2026-match-27', 'World Cup · Match 27'),
  ('wc-2026-28', 'World Cup', 'Soccer', 'Mexico', 'Korea Republic', 0, 0, 'Group A', null, 'scheduled', '2026-06-18T21:00:00-04:00', null, 'wc-2026-match-28', 'World Cup · Match 28'),
  ('wc-2026-29', 'World Cup', 'Soccer', 'Brazil', 'Haiti', 0, 0, 'Group C', null, 'scheduled', '2026-06-19T20:30:00-04:00', null, 'wc-2026-match-29', 'World Cup · Match 29'),
  ('wc-2026-30', 'World Cup', 'Soccer', 'Scotland', 'Morocco', 0, 0, 'Group C', null, 'scheduled', '2026-06-19T18:00:00-04:00', null, 'wc-2026-match-30', 'World Cup · Match 30'),
  ('wc-2026-31', 'World Cup', 'Soccer', 'Czechia', 'Mexico', 0, 0, 'Group D', null, 'scheduled', '2026-06-19T23:00:00-04:00', null, 'wc-2026-match-31', 'World Cup · Match 31'),
  ('wc-2026-32', 'World Cup', 'Soccer', 'United States', 'Australia', 0, 0, 'Group D', null, 'scheduled', '2026-06-19T15:00:00-04:00', null, 'wc-2026-match-32', 'World Cup · Match 32'),
  ('wc-2026-33', 'World Cup', 'Soccer', 'Germany', 'Côte d''Ivoire', 0, 0, 'Group E', null, 'scheduled', '2026-06-20T16:00:00-04:00', null, 'wc-2026-match-33', 'World Cup · Match 33'),
  ('wc-2026-34', 'World Cup', 'Soccer', 'Ecuador', 'Curaçao', 0, 0, 'Group E', null, 'scheduled', '2026-06-20T20:00:00-04:00', null, 'wc-2026-match-34', 'World Cup · Match 34'),
  ('wc-2026-35', 'World Cup', 'Soccer', 'Netherlands', 'Sweden', 0, 0, 'Group F', null, 'scheduled', '2026-06-20T13:00:00-04:00', null, 'wc-2026-match-35', 'World Cup · Match 35'),
  ('wc-2026-36', 'World Cup', 'Soccer', 'Tunisia', 'Japan', 0, 0, 'Group F', null, 'scheduled', '2026-06-20T00:00:00-04:00', null, 'wc-2026-match-36', 'World Cup · Match 36'),
  ('wc-2026-37', 'World Cup', 'Soccer', 'Uruguay', 'Cabo Verde', 0, 0, 'Group H', null, 'scheduled', '2026-06-21T18:00:00-04:00', null, 'wc-2026-match-37', 'World Cup · Match 37'),
  ('wc-2026-38', 'World Cup', 'Soccer', 'Spain', 'Saudi Arabia', 0, 0, 'Group H', null, 'scheduled', '2026-06-21T12:00:00-04:00', null, 'wc-2026-match-38', 'World Cup · Match 38'),
  ('wc-2026-39', 'World Cup', 'Soccer', 'Belgium', 'IR Iran', 0, 0, 'Group G', null, 'scheduled', '2026-06-21T15:00:00-04:00', null, 'wc-2026-match-39', 'World Cup · Match 39'),
  ('wc-2026-40', 'World Cup', 'Soccer', 'New Zealand', 'Egypt', 0, 0, 'Group G', null, 'scheduled', '2026-06-21T21:00:00-04:00', null, 'wc-2026-match-40', 'World Cup · Match 40'),
  ('wc-2026-41', 'World Cup', 'Soccer', 'Norway', 'Senegal', 0, 0, 'Group I', null, 'scheduled', '2026-06-22T20:00:00-04:00', null, 'wc-2026-match-41', 'World Cup · Match 41'),
  ('wc-2026-42', 'World Cup', 'Soccer', 'France', 'Iraq', 0, 0, 'Group I', null, 'scheduled', '2026-06-22T17:00:00-04:00', null, 'wc-2026-match-42', 'World Cup · Match 42'),
  ('wc-2026-43', 'World Cup', 'Soccer', 'Argentina', 'Austria', 0, 0, 'Group J', null, 'scheduled', '2026-06-22T13:00:00-04:00', null, 'wc-2026-match-43', 'World Cup · Match 43'),
  ('wc-2026-44', 'World Cup', 'Soccer', 'Jordan', 'Algeria', 0, 0, 'Group J', null, 'scheduled', '2026-06-22T23:00:00-04:00', null, 'wc-2026-match-44', 'World Cup · Match 44'),
  ('wc-2026-45', 'World Cup', 'Soccer', 'England', 'Ghana', 0, 0, 'Group L', null, 'scheduled', '2026-06-23T16:00:00-04:00', null, 'wc-2026-match-45', 'World Cup · Match 45'),
  ('wc-2026-46', 'World Cup', 'Soccer', 'Panama', 'Croatia', 0, 0, 'Group L', null, 'scheduled', '2026-06-23T19:00:00-04:00', null, 'wc-2026-match-46', 'World Cup · Match 46'),
  ('wc-2026-47', 'World Cup', 'Soccer', 'Portugal', 'Uzbekistan', 0, 0, 'Group K', null, 'scheduled', '2026-06-23T13:00:00-04:00', null, 'wc-2026-match-47', 'World Cup · Match 47'),
  ('wc-2026-48', 'World Cup', 'Soccer', 'Colombia', 'DR Congo', 0, 0, 'Group K', null, 'scheduled', '2026-06-23T22:00:00-04:00', null, 'wc-2026-match-48', 'World Cup · Match 48'),
  ('wc-2026-49', 'World Cup', 'Soccer', 'Scotland', 'Brazil', 0, 0, 'Group C', null, 'scheduled', '2026-06-24T18:00:00-04:00', null, 'wc-2026-match-49', 'World Cup · Match 49'),
  ('wc-2026-50', 'World Cup', 'Soccer', 'Morocco', 'Haiti', 0, 0, 'Group C', null, 'scheduled', '2026-06-24T18:00:00-04:00', null, 'wc-2026-match-50', 'World Cup · Match 50'),
  ('wc-2026-51', 'World Cup', 'Soccer', 'Switzerland', 'Canada', 0, 0, 'Group B', null, 'scheduled', '2026-06-24T15:00:00-04:00', null, 'wc-2026-match-51', 'World Cup · Match 51'),
  ('wc-2026-52', 'World Cup', 'Soccer', 'Bosnia and Herzegovina', 'Qatar', 0, 0, 'Group B', null, 'scheduled', '2026-06-24T15:00:00-04:00', null, 'wc-2026-match-52', 'World Cup · Match 52'),
  ('wc-2026-53', 'World Cup', 'Soccer', 'Czechia', 'Mexico', 0, 0, 'Group A', null, 'scheduled', '2026-06-24T21:00:00-04:00', null, 'wc-2026-match-53', 'World Cup · Match 53'),
  ('wc-2026-54', 'World Cup', 'Soccer', 'South Africa', 'Korea Republic', 0, 0, 'Group A', null, 'scheduled', '2026-06-24T21:00:00-04:00', null, 'wc-2026-match-54', 'World Cup · Match 54'),
  ('wc-2026-55', 'World Cup', 'Soccer', 'Curaçao', 'Côte d''Ivoire', 0, 0, 'Group E', null, 'scheduled', '2026-06-25T16:00:00-04:00', null, 'wc-2026-match-55', 'World Cup · Match 55'),
  ('wc-2026-56', 'World Cup', 'Soccer', 'Ecuador', 'Germany', 0, 0, 'Group E', null, 'scheduled', '2026-06-25T16:00:00-04:00', null, 'wc-2026-match-56', 'World Cup · Match 56'),
  ('wc-2026-57', 'World Cup', 'Soccer', 'Japan', 'Sweden', 0, 0, 'Group F', null, 'scheduled', '2026-06-25T19:00:00-04:00', null, 'wc-2026-match-57', 'World Cup · Match 57'),
  ('wc-2026-58', 'World Cup', 'Soccer', 'Tunisia', 'Netherlands', 0, 0, 'Group F', null, 'scheduled', '2026-06-25T19:00:00-04:00', null, 'wc-2026-match-58', 'World Cup · Match 58'),
  ('wc-2026-59', 'World Cup', 'Soccer', 'Türkiye', 'United States', 0, 0, 'Group D', null, 'scheduled', '2026-06-25T22:00:00-04:00', null, 'wc-2026-match-59', 'World Cup · Match 59'),
  ('wc-2026-60', 'World Cup', 'Soccer', 'Paraguay', 'Australia', 0, 0, 'Group D', null, 'scheduled', '2026-06-25T22:00:00-04:00', null, 'wc-2026-match-60', 'World Cup · Match 60'),
  ('wc-2026-61', 'World Cup', 'Soccer', 'Norway', 'France', 0, 0, 'Group I', null, 'scheduled', '2026-06-26T15:00:00-04:00', null, 'wc-2026-match-61', 'World Cup · Match 61'),
  ('wc-2026-62', 'World Cup', 'Soccer', 'Senegal', 'Iraq', 0, 0, 'Group I', null, 'scheduled', '2026-06-26T15:00:00-04:00', null, 'wc-2026-match-62', 'World Cup · Match 62'),
  ('wc-2026-63', 'World Cup', 'Soccer', 'Egypt', 'IR Iran', 0, 0, 'Group G', null, 'scheduled', '2026-06-26T23:00:00-04:00', null, 'wc-2026-match-63', 'World Cup · Match 63'),
  ('wc-2026-64', 'World Cup', 'Soccer', 'New Zealand', 'Belgium', 0, 0, 'Group G', null, 'scheduled', '2026-06-26T23:00:00-04:00', null, 'wc-2026-match-64', 'World Cup · Match 64'),
  ('wc-2026-65', 'World Cup', 'Soccer', 'Cabo Verde', 'Saudi Arabia', 0, 0, 'Group H', null, 'scheduled', '2026-06-26T20:00:00-04:00', null, 'wc-2026-match-65', 'World Cup · Match 65'),
  ('wc-2026-66', 'World Cup', 'Soccer', 'Uruguay', 'Spain', 0, 0, 'Group H', null, 'scheduled', '2026-06-26T20:00:00-04:00', null, 'wc-2026-match-66', 'World Cup · Match 66'),
  ('wc-2026-67', 'World Cup', 'Soccer', 'Panama', 'England', 0, 0, 'Group L', null, 'scheduled', '2026-06-27T17:00:00-04:00', null, 'wc-2026-match-67', 'World Cup · Match 67'),
  ('wc-2026-68', 'World Cup', 'Soccer', 'Croatia', 'Ghana', 0, 0, 'Group L', null, 'scheduled', '2026-06-27T17:00:00-04:00', null, 'wc-2026-match-68', 'World Cup · Match 68'),
  ('wc-2026-69', 'World Cup', 'Soccer', 'Algeria', 'Austria', 0, 0, 'Group J', null, 'scheduled', '2026-06-27T22:00:00-04:00', null, 'wc-2026-match-69', 'World Cup · Match 69'),
  ('wc-2026-70', 'World Cup', 'Soccer', 'Jordan', 'Argentina', 0, 0, 'Group J', null, 'scheduled', '2026-06-27T22:00:00-04:00', null, 'wc-2026-match-70', 'World Cup · Match 70'),
  ('wc-2026-71', 'World Cup', 'Soccer', 'Colombia', 'Portugal', 0, 0, 'Group K', null, 'scheduled', '2026-06-27T19:30:00-04:00', null, 'wc-2026-match-71', 'World Cup · Match 71'),
  ('wc-2026-72', 'World Cup', 'Soccer', 'DR Congo', 'Uzbekistan', 0, 0, 'Group K', null, 'scheduled', '2026-06-27T19:30:00-04:00', null, 'wc-2026-match-72', 'World Cup · Match 72'),
  ('wc-2026-73', 'World Cup', 'Soccer', '2A', '2B', 0, 0, 'Round of 32', null, 'scheduled', '2026-06-28T15:00:00-04:00', null, 'wc-2026-match-73', 'World Cup · Match 73'),
  ('wc-2026-74', 'World Cup', 'Soccer', '1E', '3ABCDF', 0, 0, 'Round of 32', null, 'scheduled', '2026-06-29T16:30:00-04:00', null, 'wc-2026-match-74', 'World Cup · Match 74'),
  ('wc-2026-75', 'World Cup', 'Soccer', '1F', '2C', 0, 0, 'Round of 32', null, 'scheduled', '2026-06-29T21:00:00-04:00', null, 'wc-2026-match-75', 'World Cup · Match 75'),
  ('wc-2026-76', 'World Cup', 'Soccer', '1C', '2F', 0, 0, 'Round of 32', null, 'scheduled', '2026-06-29T13:00:00-04:00', null, 'wc-2026-match-76', 'World Cup · Match 76'),
  ('wc-2026-77', 'World Cup', 'Soccer', '1I', '3CDFGH', 0, 0, 'Round of 32', null, 'scheduled', '2026-06-30T17:00:00-04:00', null, 'wc-2026-match-77', 'World Cup · Match 77'),
  ('wc-2026-78', 'World Cup', 'Soccer', '2E', '2I', 0, 0, 'Round of 32', null, 'scheduled', '2026-06-30T13:00:00-04:00', null, 'wc-2026-match-78', 'World Cup · Match 78'),
  ('wc-2026-79', 'World Cup', 'Soccer', '1A', '3CEFHI', 0, 0, 'Round of 32', null, 'scheduled', '2026-06-30T21:00:00-04:00', null, 'wc-2026-match-79', 'World Cup · Match 79'),
  ('wc-2026-80', 'World Cup', 'Soccer', '1L', '3EHIJK', 0, 0, 'Round of 32', null, 'scheduled', '2026-07-01T12:00:00-04:00', null, 'wc-2026-match-80', 'World Cup · Match 80'),
  ('wc-2026-81', 'World Cup', 'Soccer', '1D', '3BEFIJ', 0, 0, 'Round of 32', null, 'scheduled', '2026-07-01T20:00:00-04:00', null, 'wc-2026-match-81', 'World Cup · Match 81'),
  ('wc-2026-82', 'World Cup', 'Soccer', '1G', '3AEHIJ', 0, 0, 'Round of 32', null, 'scheduled', '2026-07-01T16:00:00-04:00', null, 'wc-2026-match-82', 'World Cup · Match 82'),
  ('wc-2026-83', 'World Cup', 'Soccer', '2K', '2L', 0, 0, 'Round of 32', null, 'scheduled', '2026-07-02T19:00:00-04:00', null, 'wc-2026-match-83', 'World Cup · Match 83'),
  ('wc-2026-84', 'World Cup', 'Soccer', '1H', '2J', 0, 0, 'Round of 32', null, 'scheduled', '2026-07-02T15:00:00-04:00', null, 'wc-2026-match-84', 'World Cup · Match 84'),
  ('wc-2026-85', 'World Cup', 'Soccer', '1B', '3EFGIJ', 0, 0, 'Round of 32', null, 'scheduled', '2026-07-02T23:00:00-04:00', null, 'wc-2026-match-85', 'World Cup · Match 85'),
  ('wc-2026-86', 'World Cup', 'Soccer', '1J', '2H', 0, 0, 'Round of 32', null, 'scheduled', '2026-07-03T18:00:00-04:00', null, 'wc-2026-match-86', 'World Cup · Match 86'),
  ('wc-2026-87', 'World Cup', 'Soccer', '1K', '3DEIJL', 0, 0, 'Round of 32', null, 'scheduled', '2026-07-03T21:30:00-04:00', null, 'wc-2026-match-87', 'World Cup · Match 87'),
  ('wc-2026-88', 'World Cup', 'Soccer', '2D', '2G', 0, 0, 'Round of 32', null, 'scheduled', '2026-07-03T14:00:00-04:00', null, 'wc-2026-match-88', 'World Cup · Match 88'),
  ('wc-2026-89', 'World Cup', 'Soccer', 'W74', 'W77', 0, 0, 'Round of 16', null, 'scheduled', '2026-07-04T17:00:00-04:00', null, 'wc-2026-match-89', 'World Cup · Match 89'),
  ('wc-2026-90', 'World Cup', 'Soccer', 'W73', 'W75', 0, 0, 'Round of 16', null, 'scheduled', '2026-07-04T13:00:00-04:00', null, 'wc-2026-match-90', 'World Cup · Match 90'),
  ('wc-2026-91', 'World Cup', 'Soccer', 'W76', 'W78', 0, 0, 'Round of 16', null, 'scheduled', '2026-07-05T16:00:00-04:00', null, 'wc-2026-match-91', 'World Cup · Match 91'),
  ('wc-2026-92', 'World Cup', 'Soccer', 'W79', 'W80', 0, 0, 'Round of 16', null, 'scheduled', '2026-07-05T20:00:00-04:00', null, 'wc-2026-match-92', 'World Cup · Match 92'),
  ('wc-2026-93', 'World Cup', 'Soccer', 'W83', 'W84', 0, 0, 'Round of 16', null, 'scheduled', '2026-07-06T15:00:00-04:00', null, 'wc-2026-match-93', 'World Cup · Match 93'),
  ('wc-2026-94', 'World Cup', 'Soccer', 'W81', 'W82', 0, 0, 'Round of 16', null, 'scheduled', '2026-07-06T20:00:00-04:00', null, 'wc-2026-match-94', 'World Cup · Match 94'),
  ('wc-2026-95', 'World Cup', 'Soccer', 'W86', 'W88', 0, 0, 'Round of 16', null, 'scheduled', '2026-07-07T12:00:00-04:00', null, 'wc-2026-match-95', 'World Cup · Match 95'),
  ('wc-2026-96', 'World Cup', 'Soccer', 'W85', 'W87', 0, 0, 'Round of 16', null, 'scheduled', '2026-07-07T16:00:00-04:00', null, 'wc-2026-match-96', 'World Cup · Match 96'),
  ('wc-2026-97', 'World Cup', 'Soccer', 'W89', 'W90', 0, 0, 'Quarterfinal', null, 'scheduled', '2026-07-09T16:00:00-04:00', null, 'wc-2026-match-97', 'World Cup · Match 97'),
  ('wc-2026-98', 'World Cup', 'Soccer', 'W93', 'W94', 0, 0, 'Quarterfinal', null, 'scheduled', '2026-07-10T15:00:00-04:00', null, 'wc-2026-match-98', 'World Cup · Match 98'),
  ('wc-2026-99', 'World Cup', 'Soccer', 'W91', 'W92', 0, 0, 'Quarterfinal', null, 'scheduled', '2026-07-11T17:00:00-04:00', null, 'wc-2026-match-99', 'World Cup · Match 99'),
  ('wc-2026-100', 'World Cup', 'Soccer', 'W95', 'W96', 0, 0, 'Quarterfinal', null, 'scheduled', '2026-07-11T21:00:00-04:00', null, 'wc-2026-match-100', 'World Cup · Match 100'),
  ('wc-2026-101', 'World Cup', 'Soccer', 'W97', 'W98', 0, 0, 'Semifinal', null, 'scheduled', '2026-07-14T15:00:00-04:00', null, 'wc-2026-match-101', 'World Cup · Match 101'),
  ('wc-2026-102', 'World Cup', 'Soccer', 'W99', 'W100', 0, 0, 'Semifinal', null, 'scheduled', '2026-07-15T15:00:00-04:00', null, 'wc-2026-match-102', 'World Cup · Match 102'),
  ('wc-2026-103', 'World Cup', 'Soccer', 'L101', 'L102', 0, 0, 'Third Place', null, 'scheduled', '2026-07-18T17:00:00-04:00', null, 'wc-2026-match-103', 'World Cup · Match 103'),
  ('wc-2026-104', 'World Cup', 'Soccer', 'W101', 'W102', 0, 0, 'Final', null, 'scheduled', '2026-07-19T15:00:00-04:00', null, 'wc-2026-match-104', 'World Cup · Match 104')
on conflict (id) do update set
  home_team = case
    when public.games.home_team is null or public.games.home_team = '' or public.games.home_team = 'TBD'
      then excluded.home_team else public.games.home_team end,
  away_team = case
    when public.games.away_team is null or public.games.away_team = '' or public.games.away_team = 'TBD'
      then excluded.away_team else public.games.away_team end,
  starts_at = coalesce(public.games.starts_at, excluded.starts_at),
  league = coalesce(nullif(public.games.league, ''), excluded.league),
  sport = coalesce(nullif(public.games.sport, ''), excluded.sport),
  event_slug = coalesce(nullif(public.games.event_slug, ''), excluded.event_slug),
  event_name = coalesce(nullif(public.games.event_name, ''), excluded.event_name);

