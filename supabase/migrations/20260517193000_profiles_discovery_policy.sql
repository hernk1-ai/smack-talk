-- Allow authenticated users to discover profiles by safe public fields.
-- Client queries must still select only non-sensitive columns.
drop policy if exists "Authenticated users can discover profiles" on public.profiles;
create policy "Authenticated users can discover profiles"
  on public.profiles
  for select
  using (auth.role() = 'authenticated');
