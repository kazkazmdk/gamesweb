-- Privacy split, transactional one-shot XP, merge local_session_id dedupe,
-- guest achievement timestamps. Additive on 0001–0004.

insert into public.achievements (id, game_id, key, name, description, xp_reward)
values
  ('neon-drift:first-slide', 'neon-drift', 'first-slide', 'First Slide', 'Enter a drift.', 15),
  ('neon-drift:combo-5', 'neon-drift', 'combo-5', 'Heat 5', 'Reach a 5x combo.', 25),
  ('neon-drift:score-25k', 'neon-drift', 'score-25k', 'Pink Line', 'Score 25,000 in one run.', 30),
  ('neon-drift:score-60k', 'neon-drift', 'score-60k', 'Night Apex', 'Score 60,000 in one run.', 50),
  ('neon-drift:two-laps', 'neon-drift', 'two-laps', 'Clean Circuit', 'Finish two laps.', 25),
  ('neon-drift:near-miss', 'neon-drift', 'near-miss', 'Paint Swap', 'Bank a near-miss bonus.', 20),
  ('neon-drift:grass-survive', 'neon-drift', 'grass-survive', 'Dirt Warning', 'Rejoin asphalt after grass.', 15),
  ('neon-drift:boost-gate', 'neon-drift', 'boost-gate', 'Gatekeeper', 'Hit a boost ribbon.', 15),
  ('neon-drift:no-crash-lap', 'neon-drift', 'no-crash-lap', 'Quiet Hands', 'Complete a lap without a wall hit.', 35),
  ('neon-drift:daily-drift', 'neon-drift', 'daily-drift', 'Evening Line', 'Finish the daily drift target.', 30),
  ('velocity-run:first-finish', 'velocity-run', 'first-finish', 'First Finish', 'Finish a course.', 15),
  ('velocity-run:bronze', 'velocity-run', 'bronze', 'Bronze', 'Earn bronze or better.', 15),
  ('velocity-run:gold', 'velocity-run', 'gold', 'Gold', 'Earn gold or better.', 35),
  ('velocity-run:platinum', 'velocity-run', 'platinum', 'Platinum', 'Earn platinum.', 70),
  ('velocity-run:all-courses', 'velocity-run', 'all-courses', 'All Courses', 'Finish every course.', 40),
  ('velocity-run:no-death', 'velocity-run', 'no-death', 'No Death', 'Finish without dying.', 30),
  ('velocity-run:sub-40', 'velocity-run', 'sub-40', 'Sub 40', 'Finish Gate A under 40s.', 25),
  ('velocity-run:fast-fall', 'velocity-run', 'fast-fall', 'Fast Fall', 'Commit a long fall.', 10),
  ('velocity-run:retry-10', 'velocity-run', 'retry-10', 'Retry 10', 'Retry ten times.', 20),
  ('velocity-run:pb-twice', 'velocity-run', 'pb-twice', 'Twice As Fast', 'Beat a Velocity PB twice.', 30),
  ('swarm-protocol:first-blood', 'swarm-protocol', 'first-blood', 'First Blood', 'Get 10 kills.', 10),
  ('swarm-protocol:survive-2', 'swarm-protocol', 'survive-2', 'Survive 2', 'Survive two minutes.', 20),
  ('swarm-protocol:survive-5', 'swarm-protocol', 'survive-5', 'Survive 5', 'Survive five minutes.', 40),
  ('swarm-protocol:level-8', 'swarm-protocol', 'level-8', 'Level 8', 'Reach level 8.', 35),
  ('swarm-protocol:elite', 'swarm-protocol', 'elite', 'Elite', 'Destroy an elite.', 25),
  ('swarm-protocol:splitter', 'swarm-protocol', 'splitter', 'Splitter', 'Destroy a splitter.', 15),
  ('swarm-protocol:dash-kill', 'swarm-protocol', 'dash-kill', 'Dash Kill', 'Kill while dashing.', 20),
  ('swarm-protocol:kills-200', 'swarm-protocol', 'kills-200', 'Kills 200', 'Reach 200 kills.', 40),
  ('swarm-protocol:shield', 'swarm-protocol', 'shield', 'Shield', 'Pick a shield upgrade.', 15),
  ('swarm-protocol:chain', 'swarm-protocol', 'chain', 'Chain', 'Chain a kill streak.', 15)
on conflict (id) do nothing;
--
-- * share_presence / share_public_activity start from share_activity.
-- * finalize_game_run locks the identity row before scoring one-shot bonuses.
-- * scores (anonymous_id|user_id, local_session_id) is unique when the id is set.
-- * guest_progress.achievement_unlocks stores { id: timestamptz } without inventing dates.

-- ---------------------------------------------------------------------------
-- Privacy columns
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists share_presence boolean not null default true;

alter table public.profiles
  add column if not exists share_public_activity boolean not null default true;

update public.profiles
  set share_presence = share_activity,
      share_public_activity = share_activity
  where true;

comment on column public.profiles.share_presence is
  'Friends may see online/playing presence when true.';
comment on column public.profiles.share_public_activity is
  'Verified recent runs may appear on the public profile when true.';

drop policy if exists "presence_select_friends" on public.presence;
create policy "presence_select_friends" on public.presence
  for select using (
    exists (
      select 1
      from public.friendships f
      join public.profiles p on p.user_id = presence.user_id
      where p.share_presence = true
        and f.status = 'accepted'
        and (
          (f.requester_id = (select auth.uid()) and f.addressee_id = presence.user_id)
          or (f.addressee_id = (select auth.uid()) and f.requester_id = presence.user_id)
        )
    )
    and not exists (
      select 1
      from public.friendships b
      where b.status = 'blocked'
        and (
          (b.requester_id = (select auth.uid()) and b.addressee_id = presence.user_id)
          or (b.requester_id = presence.user_id and b.addressee_id = (select auth.uid()))
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Guest achievement timestamps + score identity
-- ---------------------------------------------------------------------------
alter table public.guest_progress
  add column if not exists achievement_unlocks jsonb not null default '{}'::jsonb;

create unique index if not exists scores_anon_local_session_uidx
  on public.scores (anonymous_id, local_session_id)
  where anonymous_id is not null
    and local_session_id is not null
    and char_length(local_session_id) > 0;

create unique index if not exists scores_user_local_session_uidx
  on public.scores (user_id, local_session_id)
  where user_id is not null
    and local_session_id is not null
    and char_length(local_session_id) > 0;

-- ---------------------------------------------------------------------------
-- finalize_game_run: lock identity, then pay one-shot XP from DB state
-- ---------------------------------------------------------------------------
create or replace function public.finalize_game_run(
  p_session_id uuid,
  p_identity_user_id uuid,
  p_identity_anonymous_id text,
  p_mode text,
  p_score bigint,
  p_duration_ms int,
  p_result text,
  p_verified text,
  p_metadata jsonb,
  p_progression jsonb,
  p_flag_reasons text[],
  p_game_version text,
  p_build_sha text,
  p_offline boolean,
  p_client_started_at timestamptz,
  p_client_ended_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  sess public.game_sessions%rowtype;
  existing_score public.scores%rowtype;
  new_score public.scores%rowtype;
  prof public.profiles%rowtype;
  gp public.guest_progress%rowtype;
  v_xp_earned int := 0;
  v_new_xp int := 0;
  v_new_level int := 1;
  v_verified boolean := false;
  v_applied text[] := '{}';
  v_quests text[] := '{}';
  ach text;
  quest_id text;
  quest_progress double precision;
  quest_done boolean;
  current_xp int := 0;
  today_count int := 0;
  prev_pb bigint;
  is_pb boolean := false;
  first_play boolean := false;
  new_game boolean := false;
  played jsonb;
  ach_xp int;
  inserted int;
  already_completed boolean;
  quest_xp int;
  unlocks jsonb;
begin
  if p_session_id is null then
    raise exception 'session_missing';
  end if;
  if p_verified not in ('verified', 'unverified', 'flagged') then
    raise exception 'invalid_verified';
  end if;
  if p_mode is null or char_length(p_mode) < 1 or char_length(p_mode) > 32 then
    raise exception 'invalid_mode';
  end if;
  if p_score is null or p_score < 0 or p_score >= 1000000000000 then
    raise exception 'invalid_score';
  end if;
  if p_duration_ms is null or p_duration_ms < 0 or p_duration_ms > 30 * 60 * 1000 then
    raise exception 'invalid_duration';
  end if;
  if p_progression is not null and octet_length(p_progression::text) > 8000 then
    raise exception 'payload_too_large';
  end if;
  if p_flag_reasons is not null and coalesce(array_length(p_flag_reasons, 1), 0) > 32 then
    raise exception 'payload_too_large';
  end if;

  v_verified := (p_verified = 'verified');

  select * into sess from public.game_sessions where id = p_session_id for update;
  if not found then
    raise exception 'session_missing';
  end if;

  if p_identity_user_id is not null then
    if sess.user_id is distinct from p_identity_user_id then
      raise exception 'forbidden';
    end if;
  else
    if p_identity_anonymous_id is null or char_length(p_identity_anonymous_id) < 8 then
      raise exception 'invalid_identity';
    end if;
    if sess.user_id is not null or sess.anonymous_id is distinct from p_identity_anonymous_id then
      raise exception 'forbidden';
    end if;
  end if;

  select * into existing_score from public.scores where session_id = p_session_id;
  if found then
    if p_identity_user_id is not null then
      select xp into current_xp from public.profiles where user_id = p_identity_user_id;
    else
      select xp into current_xp from public.guest_progress where anonymous_id = p_identity_anonymous_id;
    end if;
    current_xp := coalesce(current_xp, 0);
    return jsonb_build_object(
      'alreadyApplied', true,
      'scoreId', existing_score.id,
      'xpEarned', 0,
      'newXp', current_xp,
      'newLevel', public.gamesweb_level_from_xp(current_xp),
      'achievementsApplied', '[]'::jsonb,
      'questsCompleted', '[]'::jsonb
    );
  end if;

  if sess.ended_at is not null then
    raise exception 'session_closed';
  end if;

  if p_identity_user_id is not null then
    select * into prof from public.profiles where user_id = p_identity_user_id for update;
    if not found then
      raise exception 'profile_missing';
    end if;
  else
    insert into public.guest_progress (anonymous_id)
    values (p_identity_anonymous_id)
    on conflict (anonymous_id) do nothing;
    select * into gp from public.guest_progress where anonymous_id = p_identity_anonymous_id for update;
    if gp.migrated_at is not null then
      raise exception 'guest_migrated';
    end if;
  end if;

  if jsonb_typeof(coalesce(p_progression -> 'achievementsToUnlock', p_progression -> 'achievements')) = 'array'
     and jsonb_array_length(coalesce(p_progression -> 'achievementsToUnlock', p_progression -> 'achievements')) > 32 then
    raise exception 'payload_too_large';
  end if;
  if jsonb_typeof(p_progression -> 'questsCompleted') = 'array'
     and jsonb_array_length(p_progression -> 'questsCompleted') > 32 then
    raise exception 'payload_too_large';
  end if;

  if v_verified then
    select count(*) into today_count
    from public.scores s
    where s.verified_status = 'verified'
      and s.created_at >= (date_trunc('day', timezone('utc', now())) at time zone 'utc')
      and (
        (p_identity_user_id is not null and s.user_id = p_identity_user_id)
        or (p_identity_user_id is null and s.anonymous_id = p_identity_anonymous_id and s.user_id is null)
      );
    first_play := today_count = 0 and coalesce((p_progression ->> 'firstPlayClaim')::boolean, true);

    if sess.game_id = 'velocity-run' then
      select min(s.score) into prev_pb
      from public.scores s
      where s.verified_status = 'verified'
        and s.game_id = sess.game_id
        and s.mode = p_mode
        and (
          (p_identity_user_id is not null and s.user_id = p_identity_user_id)
          or (p_identity_user_id is null and s.anonymous_id = p_identity_anonymous_id and s.user_id is null)
        );
      is_pb := prev_pb is null or p_score < prev_pb;
    else
      select max(s.score) into prev_pb
      from public.scores s
      where s.verified_status = 'verified'
        and s.game_id = sess.game_id
        and s.mode = p_mode
        and (
          (p_identity_user_id is not null and s.user_id = p_identity_user_id)
          or (p_identity_user_id is null and s.anonymous_id = p_identity_anonymous_id and s.user_id is null)
        );
      is_pb := prev_pb is null or p_score > prev_pb;
    end if;
    is_pb := is_pb and coalesce((p_progression ->> 'pbClaim')::boolean, true);

    if p_identity_user_id is not null then
      new_game := not exists (
        select 1 from public.player_stats ps
        where ps.user_id = p_identity_user_id
          and ps.game_id = sess.game_id
          and ps.stat_key = 'games_played'
          and ps.value > 0
      ) and coalesce((p_progression ->> 'newGameClaim')::boolean, true);
    else
      played := coalesce(gp.stats -> 'playedGameIds', '[]'::jsonb);
      new_game := jsonb_typeof(played) = 'array'
        and not (played ? sess.game_id)
        and coalesce((p_progression ->> 'newGameClaim')::boolean, true);
    end if;

    v_xp_earned := least(greatest(coalesce((p_progression ->> 'runXp')::int, 0), 0), 400);
    if first_play then
      v_xp_earned := v_xp_earned + 40;
    end if;
    if new_game then
      v_xp_earned := v_xp_earned + 45;
    end if;
    if is_pb then
      v_xp_earned := v_xp_earned + 35;
    end if;

    for ach in select jsonb_array_elements_text(
      coalesce(p_progression -> 'achievementsToUnlock', p_progression -> 'achievements', '[]'::jsonb)
    )
    loop
      if exists (select 1 from public.achievements a where a.id = ach)
         and coalesce(array_length(v_applied, 1), 0) < 32 then
        if p_identity_user_id is not null then
          if not exists (
            select 1 from public.player_achievements pa
            where pa.user_id = p_identity_user_id and pa.achievement_id = ach
          ) then
            v_applied := array_append(v_applied, ach);
          end if;
        else
          if not (ach = any (coalesce(gp.achievements, '{}'::text[]))) then
            v_applied := array_append(v_applied, ach);
          end if;
        end if;
      end if;
    end loop;

    foreach ach in array v_applied
    loop
      select a.xp_reward into ach_xp from public.achievements a where a.id = ach;
      v_xp_earned := v_xp_earned + least(greatest(coalesce(ach_xp, 25), 0), 200);
    end loop;

    for quest_id in select jsonb_array_elements_text(coalesce(p_progression -> 'questsCompleted', '[]'::jsonb))
    loop
      if quest_id is null or char_length(quest_id) not between 8 and 96 then
        continue;
      end if;
      if coalesce(array_length(v_quests, 1), 0) >= 32 then
        continue;
      end if;
      already_completed := false;
      if p_identity_user_id is not null then
        already_completed := exists (
          select 1 from public.quest_progress qp
          where qp.user_id = p_identity_user_id and qp.quest_id = quest_id and qp.completed_at is not null
        );
      else
        already_completed := quest_id = any (coalesce(gp.quest_completed, '{}'::text[]));
      end if;
      if not already_completed then
        v_quests := array_append(v_quests, quest_id);
        quest_xp := least(greatest(coalesce((p_progression -> 'questXp' ->> quest_id)::int, 0), 0), 200);
        v_xp_earned := v_xp_earned + quest_xp;
      end if;
    end loop;

    v_xp_earned := least(v_xp_earned, 2500);
  else
    v_xp_earned := 0;
  end if;

  insert into public.scores (
    user_id, anonymous_id, game_id, mode, score, metadata, verified_status, session_id,
    flag_reasons, game_version, build_sha, offline_submission, client_started_at, client_ended_at
  ) values (
    sess.user_id,
    p_identity_anonymous_id,
    sess.game_id,
    p_mode,
    p_score,
    coalesce(p_metadata, '{}'::jsonb),
    p_verified,
    p_session_id,
    coalesce(p_flag_reasons, '{}'),
    p_game_version,
    p_build_sha,
    coalesce(p_offline, false),
    p_client_started_at,
    p_client_ended_at
  ) returning * into new_score;

  update public.game_sessions set
    ended_at = now(),
    server_ended_at = now(),
    duration_ms = p_duration_ms,
    score = p_score,
    result = p_result,
    metadata = coalesce(p_metadata, '{}'::jsonb)
  where id = p_session_id;

  if p_identity_user_id is not null then
    v_new_xp := prof.xp + v_xp_earned;
    v_new_level := public.gamesweb_level_from_xp(v_new_xp);
    update public.profiles
      set xp = v_new_xp,
          level = v_new_level,
          last_seen_at = now(),
          streak = case
            when v_verified then greatest(prof.streak, greatest(coalesce((p_progression ->> 'streakSet')::int, 0), 0))
            else prof.streak
          end
      where user_id = p_identity_user_id;

    if v_verified then
      foreach ach in array v_applied
      loop
        insert into public.player_achievements (user_id, achievement_id, unlocked_at)
        values (p_identity_user_id, ach, now())
        on conflict do nothing;
        get diagnostics inserted = row_count;
        if inserted = 0 then
          select a.xp_reward into ach_xp from public.achievements a where a.id = ach;
          v_xp_earned := greatest(v_xp_earned - least(greatest(coalesce(ach_xp, 25), 0), 200), 0);
          v_new_xp := prof.xp + v_xp_earned;
          update public.profiles set xp = v_new_xp, level = public.gamesweb_level_from_xp(v_new_xp)
            where user_id = p_identity_user_id;
        end if;
      end loop;

      if p_progression -> 'questProgressUpdates' is not null
         or p_progression -> 'questProgress' is not null then
        for quest_id, quest_progress in
          select key, (value #>> '{}')::double precision
          from jsonb_each(coalesce(p_progression -> 'questProgressUpdates', p_progression -> 'questProgress'))
        loop
          perform public.gamesweb_ensure_quest(quest_id);
          if exists (select 1 from public.quests q where q.id = quest_id) then
            quest_done := quest_id = any (v_quests);
            insert into public.quest_progress (quest_id, user_id, progress, completed_at)
            values (
              quest_id,
              p_identity_user_id,
              greatest(coalesce(quest_progress, 0), 0),
              case when quest_done then now() else null end
            )
            on conflict (quest_id, user_id) do update
              set progress = greatest(public.quest_progress.progress, excluded.progress),
                  completed_at = coalesce(public.quest_progress.completed_at, excluded.completed_at);
          end if;
        end loop;
      end if;

      if coalesce((p_progression -> 'statsDelta' ->> 'gamesPlayed')::int, 0) > 0
         or coalesce((p_progression -> 'statsDelta' ->> 'pbCount')::int, 0) > 0 then
        insert into public.player_stats (user_id, game_id, stat_key, value)
        values (p_identity_user_id, sess.game_id, 'games_played', least(greatest(coalesce((p_progression -> 'statsDelta' ->> 'gamesPlayed')::int, 1), 0), 1))
        on conflict (user_id, game_id, stat_key) do update
          set value = public.player_stats.value + excluded.value;
        if is_pb then
          insert into public.player_stats (user_id, game_id, stat_key, value)
          values (p_identity_user_id, sess.game_id, 'pb_count', 1)
          on conflict (user_id, game_id, stat_key) do update
            set value = public.player_stats.value + 1;
        end if;
      end if;
    end if;
  else
    unlocks := coalesce(gp.achievement_unlocks, '{}'::jsonb);
    foreach ach in array v_applied
    loop
      if not (unlocks ? ach) then
        unlocks := jsonb_set(unlocks, array[ach], to_jsonb(now()), true);
      end if;
    end loop;
    v_new_xp := gp.xp + v_xp_earned;
    v_new_level := public.gamesweb_level_from_xp(v_new_xp);
    update public.guest_progress set
      xp = v_new_xp,
      level = v_new_level,
      last_seen_at = now(),
      streak = case
        when v_verified then greatest(gp.streak, greatest(coalesce((p_progression ->> 'streakSet')::int, 0), 0))
        else gp.streak
      end,
      achievements = case
        when v_verified then (
          select coalesce(array_agg(distinct x), '{}')
          from unnest(coalesce(gp.achievements, '{}') || v_applied) as x
        )
        else gp.achievements
      end,
      achievement_unlocks = case when v_verified then unlocks else gp.achievement_unlocks end,
      quest_progress = case
        when v_verified then public.gamesweb_merge_quest_progress(
          gp.quest_progress,
          coalesce(p_progression -> 'questProgressUpdates', p_progression -> 'questProgress', '{}'::jsonb)
        )
        else gp.quest_progress
      end,
      quest_completed = case
        when v_verified then (
          select coalesce(array_agg(distinct x), '{}')
          from unnest(coalesce(gp.quest_completed, '{}') || v_quests) as x
        )
        else gp.quest_completed
      end,
      stats = case
        when v_verified then public.gamesweb_apply_stats_delta(
          gp.stats,
          coalesce(p_progression -> 'statsDelta', '{}'::jsonb),
          sess.game_id
        )
        else gp.stats
      end
    where anonymous_id = p_identity_anonymous_id;
  end if;

  return jsonb_build_object(
    'alreadyApplied', false,
    'scoreId', new_score.id,
    'xpEarned', v_xp_earned,
    'newXp', v_new_xp,
    'newLevel', v_new_level,
    'achievementsApplied', to_jsonb(coalesce(v_applied, '{}')),
    'questsCompleted', to_jsonb(coalesce(v_quests, '{}'))
  );
end;
$$;

revoke all on function public.finalize_game_run(
  uuid, uuid, text, text, bigint, int, text, text, jsonb, jsonb, text[], text, text, boolean, timestamptz, timestamptz
) from public, anon, authenticated;
grant execute on function public.finalize_game_run(
  uuid, uuid, text, text, bigint, int, text, text, jsonb, jsonb, text[], text, text, boolean, timestamptz, timestamptz
) to service_role;

-- ---------------------------------------------------------------------------
-- merge_guest_progress: skip scores that already exist by local_session_id
-- ---------------------------------------------------------------------------
create or replace function public.merge_guest_progress(
  p_user_id uuid,
  p_anonymous_id text,
  p_offline_runs jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.guest_migrations%rowtype;
  prof public.profiles%rowtype;
  gp public.guest_progress%rowtype;
  xp_before int;
  xp_after int;
  run jsonb;
  ach text;
  quest_id text;
  quest_progress double precision;
  offline_count int := 0;
  local_id text;
  unlocked timestamptz;
begin
  if p_user_id is null or p_anonymous_id is null or char_length(p_anonymous_id) < 8 then
    raise exception 'invalid_identity';
  end if;
  if p_offline_runs is not null then
    if jsonb_typeof(p_offline_runs) <> 'array' then
      raise exception 'invalid_offline';
    end if;
    if jsonb_array_length(p_offline_runs) > 40 then
      raise exception 'payload_too_large';
    end if;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_anonymous_id, 0));

  select * into existing from public.guest_migrations where anonymous_id = p_anonymous_id for update;
  if found then
    select xp into xp_before from public.profiles where user_id = p_user_id;
    return jsonb_build_object(
      'alreadyMerged', true,
      'newXp', coalesce(xp_before, 0),
      'newLevel', public.gamesweb_level_from_xp(coalesce(xp_before, 0))
    );
  end if;

  select * into prof from public.profiles where user_id = p_user_id for update;
  if not found then
    raise exception 'profile_missing';
  end if;

  select * into gp from public.guest_progress where anonymous_id = p_anonymous_id for update;

  xp_before := prof.xp;
  xp_after := least(xp_before + coalesce(gp.xp, 0), 5000000);

  update public.scores
    set user_id = p_user_id
    where anonymous_id = p_anonymous_id and user_id is null;

  update public.game_sessions
    set user_id = p_user_id
    where anonymous_id = p_anonymous_id and user_id is null;

  update public.profiles
    set xp = xp_after,
        level = public.gamesweb_level_from_xp(xp_after),
        streak = greatest(streak, coalesce(gp.streak, 0)),
        is_guest = false,
        anonymous_id = p_anonymous_id,
        last_seen_at = now()
    where user_id = p_user_id;

  if gp.achievements is not null then
    foreach ach in array gp.achievements
    loop
      if exists (select 1 from public.achievements a where a.id = ach) then
        unlocked := null;
        if gp.achievement_unlocks ? ach then
          begin
            unlocked := (gp.achievement_unlocks ->> ach)::timestamptz;
          exception when others then
            unlocked := null;
          end;
        end if;
        insert into public.player_achievements (user_id, achievement_id, unlocked_at)
        values (p_user_id, ach, coalesce(unlocked, now()))
        on conflict do nothing;
      end if;
    end loop;
  end if;

  if gp.quest_progress is not null then
    for quest_id, quest_progress in select key, (value #>> '{}')::double precision from jsonb_each(gp.quest_progress)
    loop
      perform public.gamesweb_ensure_quest(quest_id);
      if exists (select 1 from public.quests q where q.id = quest_id) then
        insert into public.quest_progress (quest_id, user_id, progress, completed_at)
        values (
          quest_id,
          p_user_id,
          greatest(coalesce(quest_progress, 0), 0),
          case when gp.quest_completed is not null and quest_id = any (gp.quest_completed) then now() else null end
        )
        on conflict (quest_id, user_id) do update
          set progress = greatest(public.quest_progress.progress, excluded.progress),
              completed_at = coalesce(public.quest_progress.completed_at, excluded.completed_at);
      end if;
    end loop;
  end if;

  if p_offline_runs is not null then
    for run in select * from jsonb_array_elements(p_offline_runs)
    loop
      offline_count := offline_count + 1;
      if offline_count > 40 then
        exit;
      end if;
      if coalesce(run ->> 'gameId', '') not in ('neon-drift', 'velocity-run', 'swarm-protocol') then
        continue;
      end if;
      local_id := nullif(left(coalesce(run ->> 'localSessionId', ''), 80), '');
      if local_id is not null and exists (
        select 1 from public.scores s
        where s.local_session_id = local_id
          and (
            s.anonymous_id = p_anonymous_id
            or s.user_id = p_user_id
          )
      ) then
        continue;
      end if;
      insert into public.scores (
        user_id, anonymous_id, game_id, mode, score, metadata, verified_status,
        offline_submission, client_started_at, client_ended_at, local_session_id, game_version
      ) values (
        p_user_id,
        p_anonymous_id,
        run ->> 'gameId',
        left(coalesce(run ->> 'mode', 'default'), 32),
        least(greatest(coalesce((run ->> 'score')::bigint, 0), 0), 999999999999),
        coalesce(run -> 'metadata', '{}'::jsonb),
        'unverified',
        true,
        to_timestamp(coalesce((run ->> 'startedAt')::bigint, 0) / 1000.0),
        to_timestamp(coalesce((run ->> 'endedAt')::bigint, 0) / 1000.0),
        local_id,
        left(coalesce(run ->> 'gameVersion', ''), 32)
      );
    end loop;
  end if;

  insert into public.guest_migrations (anonymous_id, user_id, xp_before, xp_after)
  values (p_anonymous_id, p_user_id, xp_before, xp_after);

  if gp.anonymous_id is not null then
    update public.guest_progress
      set migrated_at = now(), last_seen_at = now()
      where anonymous_id = p_anonymous_id;
  end if;

  return jsonb_build_object(
    'alreadyMerged', false,
    'newXp', xp_after,
    'newLevel', public.gamesweb_level_from_xp(xp_after),
    'xpTransferred', coalesce(gp.xp, 0)
  );
end;
$$;

revoke all on function public.merge_guest_progress(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.merge_guest_progress(uuid, text, jsonb) to service_role;
