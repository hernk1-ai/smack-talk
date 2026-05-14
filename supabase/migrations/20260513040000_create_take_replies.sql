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
  add column if not exists reply_count integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'takes_reply_count_non_negative_check'
      and conrelid = 'public.takes'::regclass
  ) then
    alter table public.takes
      add constraint takes_reply_count_non_negative_check
      check (reply_count >= 0);
  end if;
end $$;

create table if not exists public.take_replies (
  id uuid primary key default gen_random_uuid(),
  take_id uuid not null references public.takes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reply_text text not null,
  heat integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'take_replies_reply_text_not_empty'
      and conrelid = 'public.take_replies'::regclass
  ) then
    alter table public.take_replies
      add constraint take_replies_reply_text_not_empty
      check (length(btrim(reply_text)) > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'take_replies_heat_non_negative'
      and conrelid = 'public.take_replies'::regclass
  ) then
    alter table public.take_replies
      add constraint take_replies_heat_non_negative
      check (heat >= 0);
  end if;
end $$;

alter table public.take_replies enable row level security;

drop policy if exists "Authenticated users can read take replies" on public.take_replies;
create policy "Authenticated users can read take replies"
  on public.take_replies
  for select
  to authenticated
  using (true);

drop policy if exists "Users can insert their own take replies" on public.take_replies;
create policy "Users can insert their own take replies"
  on public.take_replies
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop trigger if exists set_take_replies_updated_at on public.take_replies;
create trigger set_take_replies_updated_at
  before update on public.take_replies
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
    heat = ride_count + fade_count + (reply_count * 2),
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
    set ride_count = ride_count + 1,
        updated_at = now()
    where id = new.take_id;
  elsif new.reaction = 'fade' then
    update public.takes
    set fade_count = fade_count + 1,
        updated_at = now()
    where id = new.take_id;
  end if;

  perform public.recalculate_take_heat(new.take_id);

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
    set ride_count = greatest(ride_count - 1, 0),
        fade_count = fade_count + 1,
        updated_at = now()
    where id = new.take_id;
  elsif old.reaction = 'fade' and new.reaction = 'ride' then
    update public.takes
    set fade_count = greatest(fade_count - 1, 0),
        ride_count = ride_count + 1,
        updated_at = now()
    where id = new.take_id;
  end if;

  perform public.recalculate_take_heat(new.take_id);

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
    set ride_count = greatest(ride_count - 1, 0),
        updated_at = now()
    where id = old.take_id;
  elsif old.reaction = 'fade' then
    update public.takes
    set fade_count = greatest(fade_count - 1, 0),
        updated_at = now()
    where id = old.take_id;
  end if;

  perform public.recalculate_take_heat(old.take_id);

  return old;
end;
$$;

create or replace function public.apply_take_reply_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.takes
  set reply_count = reply_count + 1,
      updated_at = now()
  where id = new.take_id;

  perform public.recalculate_take_heat(new.take_id);

  return new;
end;
$$;

create or replace function public.apply_take_reply_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.takes
  set reply_count = greatest(reply_count - 1, 0),
      updated_at = now()
  where id = old.take_id;

  perform public.recalculate_take_heat(old.take_id);

  return old;
end;
$$;

drop trigger if exists take_replies_after_insert on public.take_replies;
create trigger take_replies_after_insert
  after insert on public.take_replies
  for each row
  execute function public.apply_take_reply_insert();

drop trigger if exists take_replies_after_delete on public.take_replies;
create trigger take_replies_after_delete
  after delete on public.take_replies
  for each row
  execute function public.apply_take_reply_delete();
