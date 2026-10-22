-- Party start/join and challenge attempt state machines.
-- Outcome matches challengeOutcome():
--   survive-longer and survive-seed ignore lower-is-better and use the higher score;
--   equal scores are a draw and leave winner_id null;
--   velocity-run, knockout-circuit, pocket-striker: the smaller score wins;
--   every other type: the larger score wins.
-- "win" means the opponent beat the challenger.
-- A run id stays unique inside party attempts and, separately, inside challenge
-- attempts. One run may still back one party action and one challenge action.

alter table public.challenges add column if not exists target_actor text;
alter table public.challenges add column if not exists target_name text;
alter table public.challenges add column if not exists target_score bigint;

create unique index if not exists challenge_attempts_one_uidx
  on public.challenge_attempts (challenge_id);

create or replace function public.start_party(p_code text, p_actor text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_party public.parties%rowtype;
  v_roster jsonb;
begin
  if p_code is null or p_actor is null then
    return jsonb_build_object('error', 'not_found');
  end if;

  select * into v_party
  from public.parties
  where code = upper(p_code)
  for update;

  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;
  if v_party.host_actor is distinct from p_actor then
    return jsonb_build_object('error', 'host_only');
  end if;
  if v_party.state <> 'lobby' then
    return jsonb_build_object('error', 'bad_state');
  end if;

  select coalesce(jsonb_agg(m.actor_id order by m.joined_at), '[]'::jsonb)
    into v_roster
  from public.party_members m
  where m.party_id = v_party.id and m.ready and m.actor_id is not null;

  if v_roster is null or jsonb_array_length(v_roster) = 0 then
    return jsonb_build_object('error', 'no_ready');
  end if;

  update public.parties
    set state = 'playing',
        round_roster = v_roster,
        submitted = '[]'::jsonb
    where id = v_party.id;

  return jsonb_build_object('ok', true, 'state', 'playing');
end;
$$;

create or replace function public.advance_party(p_code text, p_actor text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_party public.parties%rowtype;
  v_ready jsonb;
  v_all jsonb;
  v_roster jsonb;
  v_next int;
  v_len int;
begin
  if p_code is null or p_actor is null then
    return jsonb_build_object('error', 'not_found');
  end if;

  select * into v_party
  from public.parties
  where code = upper(p_code)
  for update;

  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;
  if v_party.host_actor is distinct from p_actor then
    return jsonb_build_object('error', 'host_only');
  end if;
  if v_party.state <> 'results' then
    return jsonb_build_object('error', 'bad_state');
  end if;

  v_next := v_party.current_round + 1;
  v_len := jsonb_array_length(coalesce(v_party.playlist, '[]'::jsonb));
  if v_next >= v_len then
    update public.parties
      set current_round = v_next,
          state = 'done',
          submitted = '[]'::jsonb
      where id = v_party.id;
    return jsonb_build_object('ok', true, 'state', 'done');
  end if;

  select coalesce(jsonb_agg(m.actor_id order by m.joined_at) filter (where m.ready), '[]'::jsonb),
         coalesce(jsonb_agg(m.actor_id order by m.joined_at), '[]'::jsonb)
    into v_ready, v_all
  from public.party_members m
  where m.party_id = v_party.id and m.actor_id is not null;

  v_roster := case when jsonb_array_length(coalesce(v_ready, '[]'::jsonb)) = 0 then v_all else v_ready end;

  update public.parties
    set current_round = v_next,
        state = 'playing',
        submitted = '[]'::jsonb,
        round_roster = v_roster
    where id = v_party.id;

  return jsonb_build_object('ok', true, 'state', 'playing');
end;
$$;

create or replace function public.join_party(
  p_code text,
  p_actor text,
  p_name text,
  p_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_party public.parties%rowtype;
  v_count int;
begin
  if p_code is null or p_actor is null then
    return jsonb_build_object('error', 'not_found');
  end if;

  select * into v_party
  from public.parties
  where code = upper(p_code)
  for update;

  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;
  if exists (
    select 1 from public.party_members m
    where m.party_id = v_party.id and m.actor_id = p_actor
  ) then
    return jsonb_build_object('ok', true, 'duplicate', true);
  end if;
  if v_party.state <> 'lobby' then
    return jsonb_build_object('error', 'closed');
  end if;

  select count(*)::int into v_count
  from public.party_members m
  where m.party_id = v_party.id;
  if v_count >= 6 then
    return jsonb_build_object('error', 'full');
  end if;

  insert into public.party_members (party_id, user_id, actor_id, display_name, ready, points)
  values (v_party.id, p_user_id, p_actor, coalesce(nullif(p_name, ''), 'Player'), false, 0);

  return jsonb_build_object('ok', true, 'duplicate', false);
end;
$$;

create or replace function public.submit_challenge_attempt(
  p_code text,
  p_actor text,
  p_name text,
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
  v_challenge public.challenges%rowtype;
  v_lower boolean;
  v_survive boolean;
  v_outcome text;
  v_winner text;
begin
  if p_code is null or p_actor is null or p_run_id is null or p_score is null then
    return jsonb_build_object('error', 'invalid_score');
  end if;

  select * into v_challenge
  from public.challenges
  where public_code = upper(p_code)
  for update;

  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;
  if v_challenge.status = 'expired'
     or (v_challenge.status = 'open' and v_challenge.expires_at <= now()) then
    update public.challenges set status = 'expired' where id = v_challenge.id;
    return jsonb_build_object('error', 'expired');
  end if;
  if v_challenge.status <> 'open' then
    return jsonb_build_object('error', 'challenge_closed');
  end if;
  if v_challenge.challenger_actor is not distinct from p_actor then
    return jsonb_build_object('error', 'self_challenge');
  end if;
  if v_challenge.game_id is distinct from p_game_id then
    return jsonb_build_object('error', 'game_mismatch');
  end if;
  if v_challenge.mode is distinct from p_mode then
    return jsonb_build_object('error', 'mode_mismatch');
  end if;
  if coalesce(p_trust, '') in ('flagged', 'practice') then
    return jsonb_build_object('error', 'invalid_score');
  end if;
  if v_challenge.challenger_run_id::text = p_run_id
     or exists (select 1 from public.challenge_attempts a where a.run_id::text = p_run_id) then
    return jsonb_build_object('error', 'run_reuse');
  end if;
  if exists (select 1 from public.challenge_attempts a where a.challenge_id = v_challenge.id) then
    return jsonb_build_object('error', 'challenge_closed');
  end if;

  v_lower := v_challenge.game_id in ('velocity-run', 'knockout-circuit', 'pocket-striker');
  v_survive := v_challenge.type in ('survive-longer', 'survive-seed');
  if p_score = v_challenge.challenger_score then
    v_outcome := 'draw';
  elsif v_survive or not v_lower then
    v_outcome := case when p_score > v_challenge.challenger_score then 'win' else 'loss' end;
  else
    v_outcome := case when p_score < v_challenge.challenger_score then 'win' else 'loss' end;
  end if;
  v_winner := case
    when v_outcome = 'draw' then null
    when v_outcome = 'win' then p_actor
    else v_challenge.challenger_actor
  end;

  begin
    insert into public.challenge_attempts (challenge_id, player_actor, player_name, score, trust, run_id)
    values (
      v_challenge.id,
      p_actor,
      coalesce(nullif(p_name, ''), 'Player'),
      p_score,
      coalesce(nullif(p_trust, ''), 'unverified'),
      p_run_id::uuid
    );
  exception
    when unique_violation then
      if exists (select 1 from public.challenge_attempts a where a.run_id::text = p_run_id) then
        return jsonb_build_object('error', 'run_reuse');
      end if;
      return jsonb_build_object('error', 'challenge_closed');
    when invalid_text_representation then
      return jsonb_build_object('error', 'invalid_score');
  end;

  update public.challenges
    set status = 'completed',
        winner_id = v_winner,
        target_actor = p_actor,
        target_name = coalesce(nullif(p_name, ''), 'Player'),
        target_score = p_score
    where id = v_challenge.id;

  return jsonb_build_object(
    'ok', true,
    'outcome', v_outcome,
    'duplicate', false,
    'status', 'completed',
    'winnerId', v_winner,
    'targetId', p_actor,
    'targetScore', p_score
  );
end;
$$;

revoke all on function public.start_party(text, text) from public, anon, authenticated;
revoke all on function public.advance_party(text, text) from public, anon, authenticated;
revoke all on function public.join_party(text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.submit_challenge_attempt(text, text, text, text, bigint, text, text, text)
  from public, anon, authenticated;
grant execute on function public.start_party(text, text) to service_role;
grant execute on function public.advance_party(text, text) to service_role;
grant execute on function public.join_party(text, text, text, uuid) to service_role;
grant execute on function public.submit_challenge_attempt(text, text, text, text, bigint, text, text, text)
  to service_role;
