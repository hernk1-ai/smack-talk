-- Scoped match room chat messages (room_code null = public game room chat)

create table if not exists public.match_room_messages (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,
  room_code text,
  sender_key text not null,
  display_name text,
  message_text text not null,
  created_at timestamptz not null default now(),
  constraint match_room_messages_message_text_not_empty check (length(btrim(message_text)) > 0)
);

create index if not exists match_room_messages_game_room_created_idx
  on public.match_room_messages (game_id, room_code, created_at desc);

alter table public.match_room_messages enable row level security;
