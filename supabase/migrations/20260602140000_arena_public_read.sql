-- Allow browsing Match Calls in Game Rooms before guest sign-in (read-only).

drop policy if exists "Anon users can read visible takes" on public.takes;
create policy "Anon users can read visible takes"
  on public.takes
  for select
  to anon
  using (is_hidden = false);

drop policy if exists "Anon users can read games" on public.games;
create policy "Anon users can read games"
  on public.games
  for select
  to anon
  using (true);
