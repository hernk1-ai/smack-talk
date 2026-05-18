alter table public.match_picks
  add column if not exists first_call_protected boolean not null default false;

create or replace function public.apply_match_pick_settlement(
  target_pick_id uuid,
  winner_result_input text,
  exact_score_result_input text
)
returns public.match_picks
language plpgsql
security definer
set search_path = public
as $$
declare
  current_pick public.match_picks%rowtype;
  winner_delta integer := 0;
  exact_delta integer := 0;
  total_delta integer := 0;
begin
  if winner_result_input not in ('pending', 'hit', 'miss') then
    raise exception 'winner_result_input must be pending, hit, or miss';
  end if;

  if exact_score_result_input not in ('pending', 'hit', 'miss') then
    raise exception 'exact_score_result_input must be pending, hit, or miss';
  end if;

  select *
  into current_pick
  from public.match_picks
  where id = target_pick_id
  for update;

  if not found then
    raise exception 'match pick not found';
  end if;

  if winner_result_input = 'hit' then
    winner_delta := 50;
  elsif winner_result_input = 'miss' then
    winner_delta := case when current_pick.first_call_protected then 0 else -25 end;
  end if;

  if exact_score_result_input = 'hit' then
    exact_delta := 100;
  elsif exact_score_result_input = 'miss' then
    exact_delta := case when current_pick.first_call_protected then 0 else -50 end;
  end if;

  total_delta := winner_delta + exact_delta;

  update public.match_picks
  set
    winner_result = winner_result_input,
    exact_score_result = exact_score_result_input,
    winner_rep_delta = winner_delta,
    exact_score_rep_delta = exact_delta,
    status = case
      when winner_result_input = 'pending' and exact_score_result_input = 'pending' then 'locked'
      else 'settled'
    end,
    updated_at = now()
  where id = target_pick_id;

  update public.profiles as profile
  set reputation_score = greatest(profile.reputation_score + total_delta, 0)
  where profile.id = current_pick.user_id;

  return (
    select updated_pick
    from public.match_picks as updated_pick
    where updated_pick.id = target_pick_id
  );
end;
$$;

grant execute on function public.apply_match_pick_settlement(uuid, text, text) to authenticated;
