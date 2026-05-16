alter table public.profiles
  add column if not exists last_active_at timestamptz not null default now();

create index if not exists profiles_last_active_at_idx on public.profiles(last_active_at desc);

alter table public.quick_picks
  add column if not exists pick_type text not null default 'momentum',
  add column if not exists prompt_key text not null default 'general';

alter table public.quick_picks
  drop constraint if exists quick_picks_pick_type_check;

alter table public.quick_picks
  add constraint quick_picks_pick_type_check check (pick_type in ('momentum', 'scoring', 'tempo', 'clutch', 'outcome'));

create index if not exists quick_picks_prompt_key_idx on public.quick_picks(prompt_key);
