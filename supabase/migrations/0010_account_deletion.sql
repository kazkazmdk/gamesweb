-- Account deletion for signed-in players. Service-role only.
-- Does not rewrite 0001–0009. Historical challenge/party rows are anonymized.

create or replace function public.delete_player_account(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_anon text;
begin
  if p_user_id is null then
    raise exception 'user required';
  end if;

  select anonymous_id into v_anon from public.profiles where user_id = p_user_id;

  update public.scores
    set user_id = null, anonymous_id = null
    where user_id = p_user_id;
  update public.game_sessions
    set user_id = null, anonymous_id = null
    where user_id = p_user_id;
  update public.challenges set challenger_id = null where challenger_id = p_user_id;
  update public.challenges set target_id = null where target_id = p_user_id;
  update public.challenge_attempts set player_id = null where player_id = p_user_id;
  update public.ghost_runs set user_id = null where user_id = p_user_id;
  update public.party_members set user_id = null where user_id = p_user_id;

  delete from public.notifications where user_id = p_user_id;
  delete from public.recent_players where user_id = p_user_id or other_id = p_user_id;
  delete from public.daily_entries where user_id = p_user_id;
  delete from public.crew_members where user_id = p_user_id;
  delete from public.league_members where user_id = p_user_id;
  delete from public.rivals where player_a = p_user_id or player_b = p_user_id;
  delete from public.idempotency_keys where user_id = p_user_id;
  if v_anon is not null then
    delete from public.guest_progress where anonymous_id = v_anon;
  end if;

  delete from public.profiles where user_id = p_user_id;
end;
$$;

revoke all on function public.delete_player_account(uuid) from public, anon, authenticated;
grant execute on function public.delete_player_account(uuid) to service_role;

comment on function public.delete_player_account(uuid) is
  'Deletes a signed-in player profile and personal rows. Public scores/sessions are anonymized. Auth user is removed by the Next service role.';
