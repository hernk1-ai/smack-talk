-- Target World Cup TV videos to match phases (pre/live/post).

alter table public.world_cup_videos
  add column if not exists match_phase text not null default 'any';

alter table public.world_cup_videos
  drop constraint if exists world_cup_videos_match_phase_check;

alter table public.world_cup_videos
  add constraint world_cup_videos_match_phase_check
  check (match_phase in ('any', 'pre_match', 'live', 'post_match'));

create index if not exists world_cup_videos_match_phase_idx
  on public.world_cup_videos (match_phase, is_active, priority desc);
