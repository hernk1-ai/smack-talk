-- Private match rooms and scoped fan rooting votes

create table if not exists public.private_match_rooms (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,
  room_code text not null,
  created_at timestamptz not null default now(),
  constraint private_match_rooms_room_code_key unique (room_code)
);

create index if not exists private_match_rooms_game_id_idx on public.private_match_rooms (game_id);

create table if not exists public.match_rooting_votes (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,
  room_code text,
  voter_key text not null,
  team_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint match_rooting_votes_team_key_check check (team_key in ('home', 'away'))
);

create unique index if not exists match_rooting_votes_unique_voter_scope
  on public.match_rooting_votes (game_id, coalesce(room_code, ''), voter_key);

create index if not exists match_rooting_votes_game_room_idx
  on public.match_rooting_votes (game_id, room_code);

create or replace function public.set_match_rooting_votes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists match_rooting_votes_updated_at on public.match_rooting_votes;
create trigger match_rooting_votes_updated_at
  before update on public.match_rooting_votes
  for each row execute function public.set_match_rooting_votes_updated_at();

alter table public.private_match_rooms enable row level security;
alter table public.match_rooting_votes enable row level security;
