create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.profiles
  add column if not exists reputation_score integer not null default 0,
  add column if not exists created_takes_count integer not null default 0;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

create table if not exists public.games (
  id text primary key,
  league text not null,
  home_team text not null,
  away_team text not null,
  home_score integer not null default 0,
  away_score integer not null default 0,
  period text,
  clock text,
  status text not null default 'live',
  starts_at timestamptz,
  ended_at timestamptz,
  watching_count integer not null default 0,
  ride_count integer not null default 0,
  fade_count integer not null default 0,
  heat integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'games_status_check'
      and conrelid = 'public.games'::regclass
  ) then
    alter table public.games
      add constraint games_status_check
      check (status in ('scheduled', 'live', 'final'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'games_non_negative_numbers_check'
      and conrelid = 'public.games'::regclass
  ) then
    alter table public.games
      add constraint games_non_negative_numbers_check
      check (
        home_score >= 0 and
        away_score >= 0 and
        watching_count >= 0 and
        ride_count >= 0 and
        fade_count >= 0 and
        heat >= 0
      );
  end if;
end $$;

alter table public.games enable row level security;

drop policy if exists "Authenticated users can read games" on public.games;
create policy "Authenticated users can read games"
  on public.games
  for select
  to authenticated
  using (true);

drop trigger if exists set_games_updated_at on public.games;
create trigger set_games_updated_at
  before update on public.games
  for each row
  execute function public.set_updated_at();

insert into public.games (
  id,
  league,
  away_team,
  home_team,
  away_score,
  home_score,
  period,
  clock,
  status,
  watching_count,
  ride_count,
  fade_count,
  heat
)
values (
  'lal-gsw-live',
  'NBA',
  'LAL',
  'GSW',
  108,
  103,
  '4TH QTR',
  '2:47',
  'live',
  12800,
  620,
  380,
  3600
)
on conflict (id) do update
set
  league = excluded.league,
  away_team = excluded.away_team,
  home_team = excluded.home_team,
  away_score = excluded.away_score,
  home_score = excluded.home_score,
  period = excluded.period,
  clock = excluded.clock,
  status = excluded.status,
  watching_count = excluded.watching_count,
  ride_count = excluded.ride_count,
  fade_count = excluded.fade_count,
  heat = excluded.heat,
  updated_at = now();

create table if not exists public.takes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null references public.games(id),
  take_text text not null,
  status text not null default 'locked',
  result text not null default 'pending',
  ride_count integer not null default 0,
  fade_count integer not null default 0,
  reply_count integer not null default 0,
  heat integer not null default 0,
  created_at timestamptz not null default now(),
  settled_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.takes
  add column if not exists reply_count integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'takes_game_id_fkey'
      and conrelid = 'public.takes'::regclass
  ) then
    alter table public.takes
      add constraint takes_game_id_fkey
      foreign key (game_id)
      references public.games(id)
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'takes_status_check'
      and conrelid = 'public.takes'::regclass
  ) then
    alter table public.takes
      add constraint takes_status_check
      check (status in ('locked', 'settled'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'takes_result_check'
      and conrelid = 'public.takes'::regclass
  ) then
    alter table public.takes
      add constraint takes_result_check
      check (result in ('pending', 'hit', 'miss'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'takes_take_text_not_empty'
      and conrelid = 'public.takes'::regclass
  ) then
    alter table public.takes
      add constraint takes_take_text_not_empty
      check (length(trim(take_text)) > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'takes_non_negative_counts_check'
      and conrelid = 'public.takes'::regclass
  ) then
    alter table public.takes
      add constraint takes_non_negative_counts_check
      check (
        ride_count >= 0 and
        fade_count >= 0 and
        reply_count >= 0 and
        heat >= 0
      );
  end if;
end $$;

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
