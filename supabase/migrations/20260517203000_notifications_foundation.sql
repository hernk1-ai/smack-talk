create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid null references auth.users(id) on delete set null,
  type text not null,
  title text not null,
  body text null,
  entity_type text null,
  entity_id text null,
  read_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint notifications_type_check check (type in ('follow_request', 'follow_accepted', 'take_replied', 'take_rode', 'take_faded', 'pick_locked', 'receipt_ready'))
);

create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_user_unread_idx on public.notifications(user_id, read_at);

alter table public.notifications enable row level security;

drop policy if exists "Users can read their own notifications" on public.notifications;
create policy "Users can read their own notifications"
on public.notifications
for select
using (auth.uid() = user_id);

drop policy if exists "Users can mark their own notifications read" on public.notifications;
create policy "Users can mark their own notifications read"
on public.notifications
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can create notifications as actor" on public.notifications;
create policy "Users can create notifications as actor"
on public.notifications
for insert
with check (
  auth.uid() = actor_id
  and user_id <> actor_id
);
