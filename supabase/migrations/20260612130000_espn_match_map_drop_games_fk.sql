-- Allow espn_match_map rows to be inserted before the matching games row exists.
--
-- The live table has a foreign key from espn_match_map.lockt_game_id -> games(id),
-- which blocks pre-seeding mappings for World Cup games whose rows are created
-- lazily (on first room visit). Drop that constraint.
--
-- This migration is data-safe and idempotent:
--   - It only drops foreign-key constraints; the table, primary key, indexes,
--     RLS, and all existing rows are preserved.
--   - It discovers the constraint by definition so it works regardless of the
--     auto-generated constraint name, and is a no-op if already removed.

do $$
declare
  fk record;
begin
  for fk in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'espn_match_map'
      and con.contype = 'f'
      and pg_get_constraintdef(con.oid) ilike '%foreign key (lockt_game_id)%'
  loop
    execute format('alter table public.espn_match_map drop constraint %I', fk.conname);
  end loop;
end $$;
