-- Curated YouTube videos for World Cup Game Room TV module.

create table if not exists public.world_cup_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_label text,
  youtube_id text not null,
  category text not null default 'general',
  related_match_id text,
  related_team text,
  starts_showing_at timestamptz,
  expires_at timestamptz,
  priority integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint world_cup_videos_category_check
    check (category in ('preview', 'highlight', 'press_conference', 'fan_video', 'general'))
);

create index if not exists world_cup_videos_active_priority_idx
  on public.world_cup_videos (is_active, priority desc, created_at desc);

create index if not exists world_cup_videos_related_match_idx
  on public.world_cup_videos (related_match_id)
  where related_match_id is not null;

create index if not exists world_cup_videos_related_team_idx
  on public.world_cup_videos (related_team)
  where related_team is not null;

alter table public.world_cup_videos enable row level security;

-- Game rooms may read active, in-window videos. Writes are service-role only (admin API).
drop policy if exists "Public can read active world cup videos" on public.world_cup_videos;
create policy "Public can read active world cup videos"
  on public.world_cup_videos
  for select
  to anon, authenticated
  using (
    is_active = true
    and (starts_showing_at is null or starts_showing_at <= now())
    and (expires_at is null or expires_at > now())
  );
