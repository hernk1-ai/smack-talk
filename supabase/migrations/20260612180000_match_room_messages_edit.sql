-- Allow short-window edits on match room chat messages.

alter table public.match_room_messages
  add column if not exists edited_at timestamptz;

alter table public.match_room_messages
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists match_room_messages_user_id_idx
  on public.match_room_messages (user_id)
  where user_id is not null;
