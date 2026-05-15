create table if not exists public.game_picks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null references public.games(id) on delete cascade,
  pick text not null default 'ride',
  status text not null default 'locked',
  result text not null default 'pending',
  reputation_delta integer not null default 0,
  created_at timestamptz not null default now(),
  settled_at timestamptz null,
  constraint game_picks_pick_check check (pick in ('ride', 'fade')),
  constraint game_picks_status_check check (status in ('locked', 'settled')),
  constraint game_picks_result_check check (result in ('pending', 'hit', 'miss')),
  constraint game_picks_user_game_unique unique (user_id, game_id)
);

create index if not exists game_picks_game_id_idx on public.game_picks(game_id);
create index if not exists game_picks_user_id_idx on public.game_picks(user_id);

alter table public.game_picks enable row level security;

drop policy if exists "Authenticated users can read game picks" on public.game_picks;
create policy "Authenticated users can read game picks"
on public.game_picks
for select
to authenticated
using (true);

drop policy if exists "Users can insert their own game picks" on public.game_picks;
create policy "Users can insert their own game picks"
on public.game_picks
for insert
to authenticated
with check (auth.uid() = user_id);
