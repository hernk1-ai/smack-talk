create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users can manage their push subscriptions" on public.push_subscriptions;
create policy "Users can manage their push subscriptions"
on public.push_subscriptions
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  push_enabled boolean not null default true,
  email_enabled boolean not null default false,
  follows_enabled boolean not null default true,
  replies_enabled boolean not null default true,
  reactions_enabled boolean not null default true,
  receipts_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists "Users can read their notification preferences" on public.notification_preferences;
create policy "Users can read their notification preferences"
on public.notification_preferences
for select
using (auth.uid() = user_id);

drop policy if exists "Users can upsert their notification preferences" on public.notification_preferences;
create policy "Users can upsert their notification preferences"
on public.notification_preferences
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop trigger if exists set_notification_preferences_updated_at on public.notification_preferences;
create trigger set_notification_preferences_updated_at
before update on public.notification_preferences
for each row
execute function public.set_updated_at();

create table if not exists public.notification_fanout_queue (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null check (channel in ('push', 'email')),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  attempts integer not null default 0,
  last_error text null,
  provider_message_id text null,
  processed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (notification_id, channel)
);

create index if not exists notification_fanout_queue_status_idx on public.notification_fanout_queue(status, created_at desc);

alter table public.notification_fanout_queue enable row level security;

drop policy if exists "No direct client access to fanout queue" on public.notification_fanout_queue;
create policy "No direct client access to fanout queue"
on public.notification_fanout_queue
for all
using (false)
with check (false);

drop trigger if exists set_notification_fanout_queue_updated_at on public.notification_fanout_queue;
create trigger set_notification_fanout_queue_updated_at
before update on public.notification_fanout_queue
for each row
execute function public.set_updated_at();

create or replace function public.enqueue_notification_fanout(batch_size integer default 200)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer := 0;
begin
  insert into public.notification_fanout_queue (notification_id, user_id, channel, status)
  select n.id,
         n.user_id,
         channel.channel,
         'pending'
  from public.notifications n
  left join public.notification_preferences pref on pref.user_id = n.user_id
  cross join lateral (
    values
      ('push'::text),
      ('email'::text)
  ) as channel(channel)
  where not exists (
    select 1
    from public.notification_fanout_queue q
    where q.notification_id = n.id
      and q.channel = channel.channel
  )
    and (
      (channel.channel = 'push' and coalesce(pref.push_enabled, true))
      or (channel.channel = 'email' and coalesce(pref.email_enabled, false))
    )
    and (
      (n.type in ('follow_request', 'follow_accepted') and coalesce(pref.follows_enabled, true))
      or (n.type = 'take_replied' and coalesce(pref.replies_enabled, true))
      or (n.type in ('take_rode', 'take_faded') and coalesce(pref.reactions_enabled, true))
      or (n.type in ('pick_locked', 'receipt_ready') and coalesce(pref.receipts_enabled, true))
    )
  order by n.created_at desc
  limit batch_size;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;
