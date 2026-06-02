-- Guest Game Room participation (anonymous auth + lightweight profiles)

alter table public.profiles
  add column if not exists is_guest boolean not null default false,
  add column if not exists profile_claimed boolean not null default false,
  add column if not exists display_name text;

alter table public.profiles
  drop constraint if exists username_length;

alter table public.profiles
  add constraint username_length check (
    username is null
    or char_length(username) between 3 and 20
  );

alter table public.profiles
  drop constraint if exists display_name_length;

alter table public.profiles
  add constraint display_name_length check (
    display_name is null
    or char_length(btrim(display_name)) between 2 and 20
  );

create or replace view public.profile_cards as
select
  id,
  coalesce(nullif(btrim(display_name), ''), username) as username,
  avatar_url,
  reputation_score,
  created_takes_count
from public.profiles;

grant select on public.profile_cards to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, is_guest, profile_claimed)
  values (new.id, new.email, coalesce((new.raw_app_meta_data ->> 'provider') = 'anonymous', false), false)
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;
