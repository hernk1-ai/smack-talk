-- Game Room MVP security baseline: content length limits + ownership RLS

-- Content length constraints (match server validation)
alter table public.takes
  drop constraint if exists takes_take_text_max_length;

alter table public.takes
  add constraint takes_take_text_max_length
  check (char_length(take_text) <= 160);

alter table public.take_replies
  drop constraint if exists take_replies_reply_text_max_length;

alter table public.take_replies
  add constraint take_replies_reply_text_max_length
  check (char_length(reply_text) <= 280);

alter table public.profiles
  drop constraint if exists profiles_display_name_max_length;

alter table public.profiles
  add constraint profiles_display_name_max_length
  check (display_name is null or char_length(btrim(display_name)) <= 20);

-- Takes: users manage only their own rows
drop policy if exists "Users can delete their own takes" on public.takes;
create policy "Users can delete their own takes"
  on public.takes
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can update their own takes" on public.takes;
create policy "Users can update their own takes"
  on public.takes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Comments: users manage only their own rows
drop policy if exists "Users can delete their own take replies" on public.take_replies;
create policy "Users can delete their own take replies"
  on public.take_replies
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can update their own take replies" on public.take_replies;
create policy "Users can update their own take replies"
  on public.take_replies
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Reactions: users can remove their own reactions
drop policy if exists "Users can delete their own take reactions" on public.take_reactions;
create policy "Users can delete their own take reactions"
  on public.take_reactions
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Profiles: prevent impersonation via user_id changes on update
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Match picks (calls): no cross-user writes; delete own before kickoff only
drop policy if exists "Users can delete own match picks before kickoff" on public.match_picks;
create policy "Users can delete own match picks before kickoff"
  on public.match_picks
  for delete
  to authenticated
  using (auth.uid() = user_id and now() < kickoff_at);
