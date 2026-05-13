create extension if not exists pgcrypto with schema extensions;

alter table public.profiles
  add column if not exists reputation_score integer not null default 0,
  add column if not exists created_takes_count integer not null default 0;

create table if not exists public.takes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null,
  take_text text not null,
  status text not null default 'locked',
  result text not null default 'pending',
  ride_count integer not null default 0,
  fade_count integer not null default 0,
  heat integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  settled_at timestamptz null
);

alter table public.takes
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'takes_status_check'
      and conrelid = 'public.takes'::regclass
  ) then
    alter table public.takes
      add constraint takes_status_check check (status in ('locked', 'settled'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'takes_result_check'
      and conrelid = 'public.takes'::regclass
  ) then
    alter table public.takes
      add constraint takes_result_check check (result in ('pending', 'hit', 'miss'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'takes_take_text_not_empty'
      and conrelid = 'public.takes'::regclass
  ) then
    alter table public.takes
      add constraint takes_take_text_not_empty check (length(btrim(take_text)) > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'takes_non_negative_counts'
      and conrelid = 'public.takes'::regclass
  ) then
    alter table public.takes
      add constraint takes_non_negative_counts check (ride_count >= 0 and fade_count >= 0 and heat >= 0);
  end if;
end;
$$;

alter table public.takes enable row level security;

drop policy if exists "Authenticated users can read takes" on public.takes;
create policy "Authenticated users can read takes"
  on public.takes
  for select
  to authenticated
  using (true);

drop policy if exists "Users can insert their own takes" on public.takes;
create policy "Users can insert their own takes"
  on public.takes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_takes_updated_at on public.takes;
create trigger set_takes_updated_at
  before update on public.takes
  for each row
  execute function public.set_updated_at();

create or replace function public.increment_created_takes_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    created_takes_count = created_takes_count + 1,
    updated_at = now()
  where id = new.user_id;

  return new;
end;
$$;

drop trigger if exists increment_profile_created_takes_count on public.takes;
create trigger increment_profile_created_takes_count
  after insert on public.takes
  for each row
  execute function public.increment_created_takes_count();
