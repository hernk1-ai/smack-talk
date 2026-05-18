alter table public.profiles
  add column if not exists account_visibility text not null default 'public',
  add column if not exists followers_count integer not null default 0,
  add column if not exists following_count integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_account_visibility_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_account_visibility_check
      check (account_visibility in ('public', 'private'));
  end if;
end $$;

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (follower_id, following_id),
  constraint follows_status_check check (status in ('active', 'pending', 'blocked')),
  constraint follows_not_self check (follower_id <> following_id)
);

create index if not exists follows_follower_id_idx on public.follows(follower_id);
create index if not exists follows_following_id_idx on public.follows(following_id);

alter table public.follows enable row level security;

drop policy if exists "Users can read relevant follows" on public.follows;
create policy "Users can read relevant follows"
  on public.follows
  for select
  to authenticated
  using (auth.uid() = follower_id or auth.uid() = following_id);

drop policy if exists "Users can create follows as follower" on public.follows;
create policy "Users can create follows as follower"
  on public.follows
  for insert
  to authenticated
  with check (auth.uid() = follower_id);

drop policy if exists "Users can update relevant follows" on public.follows;
create policy "Users can update relevant follows"
  on public.follows
  for update
  to authenticated
  using (auth.uid() = follower_id or auth.uid() = following_id)
  with check (auth.uid() = follower_id or auth.uid() = following_id);

drop policy if exists "Users can delete follows as follower" on public.follows;
create policy "Users can delete follows as follower"
  on public.follows
  for delete
  to authenticated
  using (auth.uid() = follower_id);

drop trigger if exists set_follows_updated_at on public.follows;
create trigger set_follows_updated_at
  before update on public.follows
  for each row
  execute function public.set_updated_at();

create or replace function public.sync_follow_counts(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    followers_count = (
      select count(*)::integer
      from public.follows
      where following_id = target_user_id
        and status = 'active'
    ),
    following_count = (
      select count(*)::integer
      from public.follows
      where follower_id = target_user_id
        and status = 'active'
    ),
    updated_at = now()
  where id = target_user_id;
end;
$$;

create or replace function public.sync_follow_counts_from_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.sync_follow_counts(new.follower_id);
    perform public.sync_follow_counts(new.following_id);
  end if;

  if tg_op in ('DELETE', 'UPDATE') then
    perform public.sync_follow_counts(old.follower_id);
    perform public.sync_follow_counts(old.following_id);
  end if;

  return null;
end;
$$;

drop trigger if exists follows_sync_counts on public.follows;
create trigger follows_sync_counts
  after insert or update or delete on public.follows
  for each row
  execute function public.sync_follow_counts_from_row();

create table if not exists public.receipt_shares (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.receipts(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  message text null,
  created_at timestamptz not null default now(),
  constraint receipt_shares_not_self check (sender_id <> recipient_id)
);

create index if not exists receipt_shares_sender_id_idx on public.receipt_shares(sender_id);
create index if not exists receipt_shares_recipient_id_idx on public.receipt_shares(recipient_id);

alter table public.receipt_shares enable row level security;

drop policy if exists "Users can read own receipt shares" on public.receipt_shares;
create policy "Users can read own receipt shares"
  on public.receipt_shares
  for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "Users can create own receipt shares" on public.receipt_shares;
create policy "Users can create own receipt shares"
  on public.receipt_shares
  for insert
  to authenticated
  with check (auth.uid() = sender_id);

create or replace function public.can_view_profile_receipts(viewer_id uuid, owner_id uuid)
returns boolean
language sql
stable
as $$
  select
    case
      when viewer_id = owner_id then true
      when coalesce((select p.account_visibility from public.profiles p where p.id = owner_id), 'public') = 'public' then true
      else exists (
        select 1
        from public.follows f
        where f.follower_id = viewer_id
          and f.following_id = owner_id
          and f.status = 'active'
      )
    end;
$$;

drop policy if exists "Authenticated users can read receipts" on public.receipts;
drop policy if exists "Users can read visible receipts" on public.receipts;
create policy "Users can read visible receipts"
  on public.receipts
  for select
  to authenticated
  using (public.can_view_profile_receipts(auth.uid(), user_id));
