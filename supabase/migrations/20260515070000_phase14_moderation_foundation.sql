create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null,
  target_id text not null,
  reason text not null,
  details text null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  reviewed_by uuid null references auth.users(id) on delete set null,
  constraint reports_target_type_check check (target_type in ('take', 'reply', 'user')),
  constraint reports_status_check check (status in ('open', 'reviewed', 'dismissed', 'actioned')),
  constraint reports_reason_not_empty check (length(btrim(reason)) > 0)
);

create index if not exists reports_reporter_user_id_idx on public.reports(reporter_user_id);
create index if not exists reports_target_lookup_idx on public.reports(target_type, target_id);
create index if not exists reports_status_created_idx on public.reports(status, created_at desc);

alter table public.reports enable row level security;

drop policy if exists "Users can insert reports" on public.reports;
create policy "Users can insert reports"
on public.reports
for insert
to authenticated
with check (auth.uid() = reporter_user_id);

drop policy if exists "Users can view their own reports" on public.reports;
create policy "Users can view their own reports"
on public.reports
for select
to authenticated
using (auth.uid() = reporter_user_id);

create table if not exists public.user_mutes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  muted_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, muted_user_id),
  constraint user_mutes_not_self check (user_id <> muted_user_id)
);

create index if not exists user_mutes_user_id_idx on public.user_mutes(user_id);
create index if not exists user_mutes_muted_user_id_idx on public.user_mutes(muted_user_id);

alter table public.user_mutes enable row level security;

drop policy if exists "Users can manage their mutes" on public.user_mutes;
create policy "Users can manage their mutes"
on public.user_mutes
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, blocked_user_id),
  constraint user_blocks_not_self check (user_id <> blocked_user_id)
);

create index if not exists user_blocks_user_id_idx on public.user_blocks(user_id);
create index if not exists user_blocks_blocked_user_id_idx on public.user_blocks(blocked_user_id);

alter table public.user_blocks enable row level security;

drop policy if exists "Users can manage their blocks" on public.user_blocks;
create policy "Users can manage their blocks"
on public.user_blocks
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter table public.takes
  add column if not exists is_hidden boolean not null default false,
  add column if not exists moderation_status text not null default 'clear';

alter table public.takes
  drop constraint if exists takes_moderation_status_check;

alter table public.takes
  add constraint takes_moderation_status_check
  check (moderation_status in ('clear', 'under_review', 'removed'));

alter table public.take_replies
  add column if not exists is_hidden boolean not null default false,
  add column if not exists moderation_status text not null default 'clear';

alter table public.take_replies
  drop constraint if exists take_replies_moderation_status_check;

alter table public.take_replies
  add constraint take_replies_moderation_status_check
  check (moderation_status in ('clear', 'under_review', 'removed'));

create index if not exists takes_visibility_idx on public.takes(is_hidden, moderation_status);
create index if not exists take_replies_visibility_idx on public.take_replies(is_hidden, moderation_status);
