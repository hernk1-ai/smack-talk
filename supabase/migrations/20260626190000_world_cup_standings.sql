-- FIFA World Cup 2026 group standings cache (synced from api.fifa.com).

create table if not exists public.world_cup_standings (
  id uuid primary key default gen_random_uuid(),
  group_name text not null,
  rank integer not null,
  team_name text not null,
  team_code text not null,
  flag_url text,
  played integer not null default 0,
  wins integer not null default 0,
  draws integer not null default 0,
  losses integer not null default 0,
  goals_for integer not null default 0,
  goals_against integer not null default 0,
  goal_difference integer not null default 0,
  points integer not null default 0,
  form jsonb,
  status text,
  source text not null default 'fifa',
  source_updated_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint world_cup_standings_group_team_unique unique (group_name, team_code)
);

create index if not exists world_cup_standings_group_rank_idx
  on public.world_cup_standings (group_name, rank);

alter table public.world_cup_standings enable row level security;

drop policy if exists "Public can read world cup standings" on public.world_cup_standings;
create policy "Public can read world cup standings"
  on public.world_cup_standings
  for select
  to anon, authenticated
  using (true);

drop trigger if exists world_cup_standings_set_updated_at on public.world_cup_standings;
create trigger world_cup_standings_set_updated_at
  before update on public.world_cup_standings
  for each row
  execute function public.set_updated_at();

-- Cached knockout bracket payload (synced from FIFA calendar knockout stages).
create table if not exists public.world_cup_standings_meta (
  key text primary key,
  payload jsonb not null default '{}'::jsonb,
  source_updated_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.world_cup_standings_meta enable row level security;

drop policy if exists "Public can read world cup standings meta" on public.world_cup_standings_meta;
create policy "Public can read world cup standings meta"
  on public.world_cup_standings_meta
  for select
  to anon, authenticated
  using (true);

drop trigger if exists world_cup_standings_meta_set_updated_at on public.world_cup_standings_meta;
create trigger world_cup_standings_meta_set_updated_at
  before update on public.world_cup_standings_meta
  for each row
  execute function public.set_updated_at();
