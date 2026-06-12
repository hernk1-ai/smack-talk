-- Link authenticated users to rooting votes for profile backing history.

alter table public.match_rooting_votes
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists match_rooting_votes_user_id_idx
  on public.match_rooting_votes (user_id);

drop policy if exists "Users can read own backing votes" on public.match_rooting_votes;
create policy "Users can read own backing votes"
  on public.match_rooting_votes
  for select
  to authenticated
  using (auth.uid() = user_id);
