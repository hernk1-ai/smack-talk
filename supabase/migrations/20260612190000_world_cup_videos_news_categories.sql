-- Add injury and news categories for Match Hub News Desk.

alter table public.world_cup_videos
  drop constraint if exists world_cup_videos_category_check;

alter table public.world_cup_videos
  add constraint world_cup_videos_category_check
  check (category in (
    'preview',
    'highlight',
    'press_conference',
    'injury',
    'news',
    'fan_video',
    'general'
  ));
