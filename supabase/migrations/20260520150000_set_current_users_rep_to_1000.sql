-- Launch adjustment: set all existing users to 1,000 REP baseline.
-- Applies to current profile rows only.
update public.profiles
set
  reputation_score = 1000,
  reputation = 1000,
  updated_at = now();
