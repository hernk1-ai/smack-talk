alter table public.match_picks
  alter column selected_winner drop not null,
  alter column home_score drop not null,
  alter column away_score drop not null;

alter table public.match_picks
  add column if not exists winner_locked_at timestamptz null,
  add column if not exists exact_score_locked_at timestamptz null,
  add column if not exists winner_result text not null default 'pending',
  add column if not exists exact_score_result text not null default 'pending',
  add column if not exists winner_rep_delta integer not null default 0,
  add column if not exists exact_score_rep_delta integer not null default 0;

alter table public.match_picks
  drop constraint if exists match_picks_status_check;

alter table public.match_picks
  add constraint match_picks_status_check check (status in ('locked', 'settled')),
  add constraint match_picks_winner_result_check check (winner_result in ('pending', 'hit', 'miss')),
  add constraint match_picks_exact_result_check check (exact_score_result in ('pending', 'hit', 'miss'));
