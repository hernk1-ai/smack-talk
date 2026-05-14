create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.takes
  add column if not exists ride_count integer not null default 0,
  add column if not exists fade_count integer not null default 0,
  add column if not exists heat integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'takes_non_negative_counts_check'
      and conrelid = 'public.takes'::regclass
  ) then
    alter table public.takes
      add constraint takes_non_negative_counts_check
      check (
        ride_count >= 0 and
        fade_count >= 0 and
        coalesce(reply_count, 0) >= 0 and
        heat >= 0
      );
  end if;
end $$;

create table if not exists public.take_reactions (
  id uuid primary key default gen_random_uuid(),
  take_id uuid not null references public.takes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (take_id, user_id)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'take_reactions_reaction_check'
      and conrelid = 'public.take_reactions'::regclass
  ) then
    alter table public.take_reactions
      add constraint take_reactions_reaction_check
      check (reaction in ('ride', 'fade'));
  end if;
end $$;

alter table public.take_reactions enable row level security;

drop policy if exists "Authenticated users can read take reactions" on public.take_reactions;
create policy "Authenticated users can read take reactions"
  on public.take_reactions
  for select
  to authenticated
  using (true);

drop policy if exists "Users can insert their own take reactions" on public.take_reactions;
create policy "Users can insert their own take reactions"
  on public.take_reactions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own take reactions" on public.take_reactions;
create policy "Users can update their own take reactions"
  on public.take_reactions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists set_take_reactions_updated_at on public.take_reactions;
create trigger set_take_reactions_updated_at
  before update on public.take_reactions
  for each row
  execute function public.set_updated_at();

create or replace function public.recalculate_take_heat(target_take_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.takes
  set
    heat = ride_count + fade_count,
    updated_at = now()
  where id = target_take_id;
end;
$$;

create or replace function public.apply_take_reaction_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.reaction = 'ride' then
    update public.takes
    set
      ride_count = ride_count + 1,
      heat = ride_count + 1 + fade_count,
      updated_at = now()
    where id = new.take_id;
  elsif new.reaction = 'fade' then
    update public.takes
    set
      fade_count = fade_count + 1,
      heat = ride_count + fade_count + 1,
      updated_at = now()
    where id = new.take_id;
  end if;

  return new;
end;
$$;

create or replace function public.apply_take_reaction_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.reaction = new.reaction then
    return new;
  end if;

  if old.reaction = 'ride' and new.reaction = 'fade' then
    update public.takes
    set
      ride_count = greatest(ride_count - 1, 0),
      fade_count = fade_count + 1,
      heat = greatest(ride_count - 1, 0) + fade_count + 1,
      updated_at = now()
    where id = new.take_id;
  elsif old.reaction = 'fade' and new.reaction = 'ride' then
    update public.takes
    set
      fade_count = greatest(fade_count - 1, 0),
      ride_count = ride_count + 1,
      heat = ride_count + 1 + greatest(fade_count - 1, 0),
      updated_at = now()
    where id = new.take_id;
  end if;

  return new;
end;
$$;

create or replace function public.apply_take_reaction_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.reaction = 'ride' then
    update public.takes
    set
      ride_count = greatest(ride_count - 1, 0),
      heat = greatest(ride_count - 1, 0) + fade_count,
      updated_at = now()
    where id = old.take_id;
  elsif old.reaction = 'fade' then
    update public.takes
    set
      fade_count = greatest(fade_count - 1, 0),
      heat = ride_count + greatest(fade_count - 1, 0),
      updated_at = now()
    where id = old.take_id;
  end if;

  return old;
end;
$$;

drop trigger if exists take_reactions_after_insert on public.take_reactions;
create trigger take_reactions_after_insert
  after insert on public.take_reactions
  for each row
  execute function public.apply_take_reaction_insert();

drop trigger if exists take_reactions_after_update on public.take_reactions;
create trigger take_reactions_after_update
  after update of reaction on public.take_reactions
  for each row
  execute function public.apply_take_reaction_update();

drop trigger if exists take_reactions_after_delete on public.take_reactions;
create trigger take_reactions_after_delete
  after delete on public.take_reactions
  for each row
  execute function public.apply_take_reaction_delete();
