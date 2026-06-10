-- Lightweight live-viewers presence for Game Rooms.
-- One row per (game_id, room_code scope, viewer_key); heartbeats bump last_seen_at.
-- Active = last_seen_at within the last 2 minutes. Stale rows expire naturally.

create table if not exists public.game_room_presence (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,
  room_code text,
  viewer_key text not null,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Treat NULL room_code (public room) as a single scope so each viewer maps to one row.
create unique index if not exists game_room_presence_unique_viewer_scope
  on public.game_room_presence (game_id, coalesce(room_code, ''), viewer_key);

-- Supports the scoped active-count query (game + room scope + recency).
create index if not exists game_room_presence_scope_seen_idx
  on public.game_room_presence (game_id, room_code, last_seen_at);

alter table public.game_room_presence enable row level security;
