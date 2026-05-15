-- Phase 10: Live sports data MVP fields.
-- Safe to run more than once.

alter table public.games
  add column if not exists external_game_id text null,
  add column if not exists sport text null;

update public.games
set sport = coalesce(sport, 'basketball')
where league = 'NBA';

create index if not exists games_external_game_id_idx on public.games(external_game_id);
create index if not exists games_sport_league_status_idx on public.games(sport, league, status);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'games_external_game_id_unique'
  ) then
    alter table public.games
      add constraint games_external_game_id_unique unique (external_game_id);
  end if;
end;
$$;
