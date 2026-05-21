-- One-time admin verification for 20260520150000_set_current_users_rep_to_1000.sql
-- Run after migrations to confirm profile REP baseline updates.

-- 1) Headline counts
select
  count(*) as total_profiles,
  count(*) filter (where reputation_score = 1000 and reputation = 1000) as profiles_at_1000_both_fields,
  count(*) filter (where reputation_score <> 1000 or reputation <> 1000) as profiles_not_at_1000
from public.profiles;

-- 2) Quick integrity check for mismatched fields
select
  count(*) as profiles_with_field_mismatch
from public.profiles
where reputation_score <> reputation;

-- 3) Detail rows for any profile that did not land at 1,000 REP
-- (Should return zero rows if migration applied cleanly.)
select
  id,
  username,
  reputation_score,
  reputation,
  updated_at
from public.profiles
where reputation_score <> 1000
   or reputation <> 1000
order by updated_at desc
limit 200;
