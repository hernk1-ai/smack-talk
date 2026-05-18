alter table public.profiles
  add column if not exists starter_rep_awarded boolean not null default false,
  add column if not exists level text not null default 'Rookie';

create table if not exists public.user_trophies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trophy_key text not null,
  trophy_name text not null,
  description text,
  unlocked_at timestamptz not null default now(),
  unique (user_id, trophy_key)
);

alter table public.user_trophies enable row level security;

drop policy if exists "Users can view own trophies" on public.user_trophies;
create policy "Users can view own trophies"
  on public.user_trophies
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own trophies" on public.user_trophies;
create policy "Users can insert own trophies"
  on public.user_trophies
  for insert
  with check (auth.uid() = user_id);
