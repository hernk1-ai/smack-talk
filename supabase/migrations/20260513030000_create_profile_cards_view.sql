create or replace view public.profile_cards as
select
  id,
  username,
  avatar_url,
  reputation_score,
  created_takes_count
from public.profiles;

grant select on public.profile_cards to authenticated;
