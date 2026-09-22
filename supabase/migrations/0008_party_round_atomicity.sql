-- Atomic party-round submit. Ranking matches rankScores + PARTY_POINTS
-- and LOWER_IS_BETTER_GAMES (velocity-run, knockout-circuit, pocket-striker).
-- Points are applied only when every roster actor has an attempt.

alter table public.challenges
  alter column winner_id type text using winner_id::text;

create unique index if not exists challenges_challenger_run_uidx
  on public.challenges (challenger_run_id)
  where challenger_run_id is not null;

create unique index if not exists challenge_attempts_run_uidx
  on public.challenge_attempts (run_id)
  where run_id is not null;

create unique index if not exists challenge_attempts_player_actor_uidx
  on public.challenge_attempts (challenge_id, player_actor)
  where player_actor is not null;

create unique index if not exists party_round_attempts_run_global_uidx
  on public.party_round_attempts (run_id);

alter table public.party_round_attempts enable row level security;
revoke all on table public.party_round_attempts from public, anon, authenticated;
grant all on table public.party_round_attempts to service_role;

create or replace function public.submit_party_round_attempt(
  p_code text,
  p_actor text,
  p_run_id text,
  p_score bigint,
  p_trust text,
  p_game_id text,
  p_mode text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_party public.parties%rowtype;
  v_roster jsonb;
  v_slot jsonb;
  v_submitted jsonb;
  v_standings jsonb;
  v_attempt_count int;
  v_roster_count int;
  v_lower boolean;
  v_place int := 0;
  v_pts int;
  v_points int[] := array[10, 7, 5, 3, 2, 1];
  v_rec record;
begin
  if p_code is null or p_actor is null or p_run_id is null or p_score is null then
    return jsonb_build_object('error', 'invalid_score');
  end if;

  select * into v_party
  from public.parties
  where code = upper(p_code)
  for update;

  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;
  if v_party.state <> 'playing' then
    return jsonb_build_object('error', 'bad_state');
  end if;
  if not exists (
    select 1 from public.party_members m
    where m.party_id = v_party.id and m.actor_id = p_actor
  ) then
    return jsonb_build_object('error', 'not_member');
  end if;

  v_roster := coalesce(v_party.round_roster, '[]'::jsonb);
  if jsonb_typeof(v_roster) <> 'array' or not (v_roster @> to_jsonb(p_actor)) then
    return jsonb_build_object('error', 'not_in_round');
  end if;
  if exists (
    select 1 from public.party_round_attempts a
    where a.party_id = v_party.id
      and a.round_index = v_party.current_round
      and a.actor_id = p_actor
  ) then
    return jsonb_build_object('error', 'duplicate');
  end if;
  if exists (
    select 1 from public.party_round_attempts a where a.run_id = p_run_id
  ) then
    return jsonb_build_object('error', 'run_reuse');
  end if;

  v_slot := coalesce(v_party.playlist, '[]'::jsonb) -> v_party.current_round;
  if v_slot is null or v_slot->>'gameId' is distinct from p_game_id then
    return jsonb_build_object('error', 'game_mismatch');
  end if;
  if v_slot->>'mode' is distinct from p_mode then
    return jsonb_build_object('error', 'mode_mismatch');
  end if;
  if coalesce(p_trust, '') in ('flagged', 'practice') then
    return jsonb_build_object('error', 'invalid_score');
  end if;

  begin
    insert into public.party_round_attempts (party_id, round_index, actor_id, run_id, score, trust)
    values (v_party.id, v_party.current_round, p_actor, p_run_id, p_score, coalesce(nullif(p_trust, ''), 'unverified'));
  exception
    when unique_violation then
      if exists (
        select 1 from public.party_round_attempts a
        where a.party_id = v_party.id
          and a.round_index = v_party.current_round
          and a.actor_id = p_actor
      ) then
        return jsonb_build_object('error', 'duplicate');
      end if;
      return jsonb_build_object('error', 'run_reuse');
  end;

  select count(*)::int into v_attempt_count
  from public.party_round_attempts a
  where a.party_id = v_party.id and a.round_index = v_party.current_round;

  select coalesce(jsonb_agg(a.actor_id order by a.submitted_at), '[]'::jsonb)
    into v_submitted
  from public.party_round_attempts a
  where a.party_id = v_party.id and a.round_index = v_party.current_round;

  v_roster_count := jsonb_array_length(v_roster);
  if v_attempt_count < v_roster_count then
    update public.parties
      set submitted = v_submitted
      where id = v_party.id;
    return jsonb_build_object('ok', true, 'state', 'playing');
  end if;

  v_lower := p_game_id in ('velocity-run', 'knockout-circuit', 'pocket-striker');
  v_standings := coalesce(v_party.standings, '[]'::jsonb);
  if jsonb_typeof(v_standings) <> 'array' then
    v_standings := '[]'::jsonb;
  end if;

  for v_rec in
    select a.actor_id, a.score, coalesce(m.display_name, 'Player') as name
    from public.party_round_attempts a
    left join public.party_members m
      on m.party_id = a.party_id and m.actor_id = a.actor_id
    where a.party_id = v_party.id and a.round_index = v_party.current_round
    order by
      case when v_lower then a.score end asc,
      case when not v_lower then a.score end desc,
      a.submitted_at asc,
      a.actor_id asc
  loop
    v_place := v_place + 1;
    v_pts := case when v_place <= array_length(v_points, 1) then v_points[v_place] else 0 end;
    if exists (
      select 1 from jsonb_array_elements(v_standings) elem where elem->>'id' = v_rec.actor_id
    ) then
      select coalesce(jsonb_agg(
        case
          when elem->>'id' = v_rec.actor_id then
            jsonb_set(elem, '{points}', to_jsonb(coalesce((elem->>'points')::int, 0) + v_pts))
          else elem
        end
      ), '[]'::jsonb)
        into v_standings
      from jsonb_array_elements(v_standings) elem;
    else
      v_standings := v_standings || jsonb_build_array(
        jsonb_build_object('id', v_rec.actor_id, 'name', v_rec.name, 'points', v_pts)
      );
    end if;
    update public.party_members
      set points = points + v_pts
      where party_id = v_party.id and actor_id = v_rec.actor_id;
  end loop;

  update public.parties
    set standings = v_standings,
        submitted = v_submitted,
        state = 'results'
    where id = v_party.id;

  return jsonb_build_object('ok', true, 'state', 'results');
end;
$$;

revoke all on function public.submit_party_round_attempt(text, text, text, bigint, text, text, text)
  from public, anon, authenticated;
grant execute on function public.submit_party_round_attempt(text, text, text, bigint, text, text, text)
  to service_role;
