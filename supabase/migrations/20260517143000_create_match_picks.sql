create table if not exists public.match_picks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id text not null,
  match_number integer null,
  stage text null,
  home_team text null,
  away_team text null,
  selected_winner text not null,
  home_score integer not null,
  away_score integer not null,
  kickoff_at timestamptz not null,
  status text not null default 'locked',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint match_picks_status_check check (status in ('locked', 'settled')),
  constraint match_picks_user_match_unique unique (user_id, match_id)
);

alter table public.match_picks enable row level security;

create index if not exists match_picks_user_id_idx on public.match_picks(user_id);
create index if not exists match_picks_match_id_idx on public.match_picks(match_id);

drop policy if exists "Users can read own match picks" on public.match_picks;
create policy "Users can read own match picks"
  on public.match_picks
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own match picks" on public.match_picks;
create policy "Users can insert own match picks"
  on public.match_picks
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own picks before kickoff" on public.match_picks;
create policy "Users can update own picks before kickoff"
  on public.match_picks
  for update
  to authenticated
  using (auth.uid() = user_id and now() < kickoff_at)
  with check (auth.uid() = user_id and now() < kickoff_at);

drop trigger if exists set_match_picks_updated_at on public.match_picks;
create trigger set_match_picks_updated_at
  before update on public.match_picks
  for each row
  execute function public.set_updated_at();
