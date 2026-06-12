-- Maps Lockt World Cup games to ESPN scoreboard events for automatic score sync.
-- One row per Lockt game (lockt_game_id), one ESPN event per row (espn_event_id unique).
-- Manual SQL inserts are an acceptable way to populate this table.

create table if not exists public.espn_match_map (
  lockt_game_id text primary key,
  espn_event_id text not null unique,
  espn_event_name text,
  starts_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Lookup by ESPN event id when reconciling a scoreboard payload.
create index if not exists espn_match_map_espn_event_id_idx
  on public.espn_match_map (espn_event_id);

-- Keep updated_at fresh on edits (reuses the shared helper used by other tables).
drop trigger if exists set_espn_match_map_updated_at on public.espn_match_map;
create trigger set_espn_match_map_updated_at
  before update on public.espn_match_map
  for each row
  execute function public.set_updated_at();

-- Server-only table: the sync runs with the service-role key. Enable RLS with no
-- public policies so the anon/auth clients cannot read or write the mapping.
alter table public.espn_match_map enable row level security;
