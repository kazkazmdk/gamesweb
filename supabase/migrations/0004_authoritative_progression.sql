-- Authoritative progression, browser write revocation, guest_progress, relative rewards.
-- Additive on 0001_init.sql + 0002_hardening.sql + 0003_quality_hardening.sql.
-- Do not edit those files.
--
-- Contracts:
-- * anon / authenticated may SELECT catalogs and public views, plus owner SELECT on
--   private tables. They must not INSERT/UPDATE/DELETE authoritative rows.
--   RLS is defense in depth; GRANTS are the capability boundary.
-- * XP is the source of truth. level columns are derived via gamesweb_level_from_xp
--   (port of packages/config/src/index.ts — keep the curve in sync).
-- * finalize_game_run applies relative xpEarned on a row locked FOR UPDATE.
--   Never treat client/Node newXp as the written value.
-- * Guest cumulative XP/quests/stats live in guest_progress (service_role only).
-- * merge_guest_progress: newXp = account.xp + guest_progress.xp (once).
--   Achievement rows may union; they must not add XP again (already inside guest.xp).
-- * idempotency_keys.expires_at is set by the API (~7 days). No in-band janitor.
--   Future cron: delete from public.idempotency_keys where expires_at < now();
-- Rollback: drop guest_progress / new functions, restore 0003 RPC bodies, re-grant
-- table writes only if a rollback of the product architecture is required.

-- ---------------------------------------------------------------------------
-- Level curve (JS port)
-- ---------------------------------------------------------------------------
create or replace function public.gamesweb_xp_required_for_level(p_level integer)
returns integer
language sql
immutable
set search_path = public
as $$
  select case
    when p_level <= 1 then 0
    else floor(80 * power((p_level - 1)::numeric, 1.42) + 40 * (p_level - 1))::integer
  end;
$$;

create or replace function public.gamesweb_level_from_xp(p_xp integer)
returns integer
language plpgsql
immutable
set search_path = public
as $$
declare
  remaining integer := greatest(0, coalesce(p_xp, 0));
  lvl integer := 1;
  need integer;
begin
  while lvl < 99 loop
    need := public.gamesweb_xp_required_for_level(lvl + 1);
    if remaining < need then
      exit;
    end if;
    remaining := remaining - need;
    lvl := lvl + 1;
  end loop;
  return lvl;
end;
$$;

revoke all on function public.gamesweb_xp_required_for_level(integer) from public, anon, authenticated;
revoke all on function public.gamesweb_level_from_xp(integer) from public, anon, authenticated;
grant execute on function public.gamesweb_xp_required_for_level(integer) to service_role;
grant execute on function public.gamesweb_level_from_xp(integer) to service_role;

-- ---------------------------------------------------------------------------
-- Guest progression (service-role only)
-- ---------------------------------------------------------------------------
create table if not exists public.guest_progress (
  anonymous_id text primary key,
  xp integer not null default 0,
  level integer not null default 1,
  streak integer not null default 0,
  quest_progress jsonb not null default '{}'::jsonb,
  quest_completed text[] not null default '{}',
  stats jsonb not null default '{}'::jsonb,
  achievements text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  migrated_at timestamptz,
  constraint guest_progress_anonymous_id_len check (char_length(anonymous_id) between 8 and 80),
  constraint guest_progress_xp_nonneg check (xp >= 0),
  constraint guest_progress_level_min check (level >= 1),
  constraint guest_progress_streak_nonneg check (streak >= 0)
);

drop trigger if exists guest_progress_updated_at on public.guest_progress;
create trigger guest_progress_updated_at
  before update on public.guest_progress
  for each row execute procedure public.gamesweb_set_updated_at();

alter table public.guest_progress enable row level security;
revoke all on table public.guest_progress from public, anon, authenticated;
grant all on table public.guest_progress to service_role;

comment on table public.guest_progress is
  'Server-side cumulative guest progression. No anon/authenticated SELECT. Identity is the Next gw_guest cookie, never a browser Supabase client.';

-- ---------------------------------------------------------------------------
-- Drop browser write policies (mutations go through Next + service role)
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "own profile update" on public.profiles;

drop policy if exists "saves_own" on public.game_saves;
create policy "saves_select_own" on public.game_saves
  for select using ((select auth.uid()) = user_id);

drop policy if exists "stats_own" on public.player_stats;
create policy "stats_select_own" on public.player_stats
  for select using ((select auth.uid()) = user_id);

drop policy if exists "quest_progress_own" on public.quest_progress;
create policy "quest_progress_select_own" on public.quest_progress
  for select using ((select auth.uid()) = user_id);

drop policy if exists "friendships_insert_self" on public.friendships;
drop policy if exists "friendships_update_member" on public.friendships;
-- friendships_members SELECT stays. Writes are service-role only.
-- If grants were ever restored, no generic "member can update any status" policy remains.

drop policy if exists "presence_self_write" on public.presence;
drop policy if exists "presence_self_or_friends" on public.presence;
create policy "presence_select_self" on public.presence
  for select using ((select auth.uid()) = user_id);
create policy "presence_select_friends" on public.presence
  for select using (
    exists (
      select 1
      from public.friendships f
      join public.profiles p on p.user_id = presence.user_id
      where p.share_activity = true
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
-- GRANTS: revoke browser writes, keep required SELECTs
-- ---------------------------------------------------------------------------
alter default privileges in schema public
  revoke all on tables from anon, authenticated;

revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.game_sessions from public, anon, authenticated;
revoke all on table public.scores from public, anon, authenticated;
revoke all on table public.player_achievements from public, anon, authenticated;
revoke all on table public.quest_progress from public, anon, authenticated;
revoke all on table public.player_stats from public, anon, authenticated;
revoke all on table public.friendships from public, anon, authenticated;
revoke all on table public.presence from public, anon, authenticated;
revoke all on table public.game_saves from public, anon, authenticated;
revoke all on table public.guest_migrations from public, anon, authenticated;
revoke all on table public.idempotency_keys from public, anon, authenticated;
revoke all on table public.player_cosmetics from public, anon, authenticated;
revoke all on table public.guest_progress from public, anon, authenticated;

grant select on table public.games to anon, authenticated;
grant select on table public.achievements to anon, authenticated;
grant select on table public.quests to anon, authenticated;
grant select on table public.cosmetics to anon, authenticated;
grant select on table public.public_profiles to anon, authenticated;
grant select on table public.public_scores to anon, authenticated;

grant select on table public.profiles to authenticated;
grant select on table public.game_sessions to authenticated;
grant select on table public.scores to authenticated;
grant select on table public.player_achievements to authenticated;
grant select on table public.quest_progress to authenticated;
grant select on table public.player_stats to authenticated;
grant select on table public.friendships to authenticated;
grant select on table public.presence to authenticated;
grant select on table public.game_saves to authenticated;
grant select on table public.guest_migrations to authenticated;
grant select on table public.player_cosmetics to authenticated;

grant all on table public.profiles to service_role;
grant all on table public.game_sessions to service_role;
grant all on table public.scores to service_role;
grant all on table public.player_achievements to service_role;
grant all on table public.quest_progress to service_role;
grant all on table public.player_stats to service_role;
grant all on table public.friendships to service_role;
grant all on table public.presence to service_role;
grant all on table public.game_saves to service_role;
grant all on table public.guest_migrations to service_role;
grant all on table public.idempotency_keys to service_role;
grant all on table public.player_cosmetics to service_role;
grant all on table public.guest_progress to service_role;
grant all on table public.games to service_role;
grant all on table public.achievements to service_role;
grant all on table public.quests to service_role;
grant all on table public.cosmetics to service_role;

-- ---------------------------------------------------------------------------
-- Helpers used by RPCs
-- ---------------------------------------------------------------------------
create or replace function public.gamesweb_ensure_quest(p_quest_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_quest_id is null or char_length(p_quest_id) < 8 or char_length(p_quest_id) > 96 then
    return;
  end if;
  if position(':' in p_quest_id) = 0 then
    return;
  end if;
  insert into public.quests (id, type, requirements, reward, starts_at, ends_at)
  values (p_quest_id, 'daily', '{}'::jsonb, '{}'::jsonb, now(), now() + interval '2 days')
  on conflict (id) do nothing;
end;
$$;

create or replace function public.gamesweb_merge_quest_progress(p_existing jsonb, p_updates jsonb)
returns jsonb
language plpgsql
immutable
set search_path = public
as $$
declare
  result jsonb := coalesce(p_existing, '{}'::jsonb);
  k text;
  v numeric;
  n int := 0;
begin
  if (p_updates is null or jsonb_typeof(p_updates) <> 'object') then
    return result;
  end if;
  if (select count(*) from jsonb_each(p_updates)) > 48 then
    raise exception 'payload_too_large';
  end if;
  for k, v in select key, (value #>> '{}')::numeric from jsonb_each(p_updates)
  loop
    n := n + 1;
    if n > 48 or k is null or char_length(k) > 96 then
      continue;
    end if;
    result := jsonb_set(
      result,
      array[k],
      to_jsonb(greatest(coalesce((result ->> k)::numeric, 0), coalesce(v, 0))),
      true
    );
  end loop;
  return result;
end;
$$;

create or replace function public.gamesweb_apply_stats_delta(p_existing jsonb, p_delta jsonb, p_game_id text)
returns jsonb
language plpgsql
immutable
set search_path = public
as $$
declare
  games_played int;
  pb_count int;
  played jsonb;
begin
  games_played := greatest(0, coalesce((p_existing ->> 'gamesPlayed')::int, 0))
    + least(greatest(coalesce((p_delta ->> 'gamesPlayed')::int, 0), 0), 1);
  pb_count := greatest(0, coalesce((p_existing ->> 'pbCount')::int, 0))
    + least(greatest(coalesce((p_delta ->> 'pbCount')::int, 0), 0), 1);
  played := coalesce(p_existing -> 'playedGameIds', '[]'::jsonb);
  if p_game_id is not null
     and char_length(p_game_id) > 0
     and jsonb_typeof(played) = 'array'
     and jsonb_array_length(played) < 8
     and not (played ? p_game_id)
  then
    played := played || to_jsonb(p_game_id);
  end if;
  return jsonb_build_object(
    'gamesPlayed', games_played,
    'pbCount', pb_count,
    'playedGameIds', played
  );
end;
$$;

revoke all on function public.gamesweb_ensure_quest(text) from public, anon, authenticated;
revoke all on function public.gamesweb_merge_quest_progress(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.gamesweb_apply_stats_delta(jsonb, jsonb, text) from public, anon, authenticated;
grant execute on function public.gamesweb_ensure_quest(text) to service_role;
grant execute on function public.gamesweb_merge_quest_progress(jsonb, jsonb) to service_role;
grant execute on function public.gamesweb_apply_stats_delta(jsonb, jsonb, text) to service_role;

-- ---------------------------------------------------------------------------
-- finalize_game_run: relative XP, guest or profile, same transaction as score
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

  if v_verified then
    v_xp_earned := least(greatest(coalesce((p_progression ->> 'xpEarned')::int, 0), 0), 2500);
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

  if jsonb_typeof(coalesce(p_progression -> 'achievementsToUnlock', p_progression -> 'achievements')) = 'array'
     and jsonb_array_length(coalesce(p_progression -> 'achievementsToUnlock', p_progression -> 'achievements')) > 32 then
    raise exception 'payload_too_large';
  end if;
  if jsonb_typeof(p_progression -> 'questsCompleted') = 'array'
     and jsonb_array_length(p_progression -> 'questsCompleted') > 32 then
    raise exception 'payload_too_large';
  end if;

  if v_verified then
    for ach in select jsonb_array_elements_text(
      coalesce(p_progression -> 'achievementsToUnlock', p_progression -> 'achievements', '[]'::jsonb)
    )
    loop
      if exists (select 1 from public.achievements a where a.id = ach)
         and coalesce(array_length(v_applied, 1), 0) < 32 then
        v_applied := array_append(v_applied, ach);
      end if;
    end loop;
    for quest_id in select jsonb_array_elements_text(coalesce(p_progression -> 'questsCompleted', '[]'::jsonb))
    loop
      if quest_id is not null and char_length(quest_id) between 8 and 96
         and coalesce(array_length(v_quests, 1), 0) < 32 then
        v_quests := array_append(v_quests, quest_id);
      end if;
    end loop;
  end if;

  if p_identity_user_id is not null then
    select * into prof from public.profiles where user_id = p_identity_user_id for update;
    if not found then
      raise exception 'profile_missing';
    end if;
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
        insert into public.player_achievements (user_id, achievement_id)
        values (p_identity_user_id, ach)
        on conflict do nothing;
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
        if coalesce((p_progression -> 'statsDelta' ->> 'pbCount')::int, 0) > 0 then
          insert into public.player_stats (user_id, game_id, stat_key, value)
          values (p_identity_user_id, sess.game_id, 'pb_count', 1)
          on conflict (user_id, game_id, stat_key) do update
            set value = public.player_stats.value + 1;
        end if;
      end if;
    end if;
  else
    insert into public.guest_progress (anonymous_id)
    values (p_identity_anonymous_id)
    on conflict (anonymous_id) do nothing;
    select * into gp from public.guest_progress where anonymous_id = p_identity_anonymous_id for update;
    if gp.migrated_at is not null then
      raise exception 'guest_migrated';
    end if;
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
    'achievementsApplied', to_jsonb(v_applied),
    'questsCompleted', to_jsonb(v_quests)
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
-- merge_guest_progress: lock guest + account, XP = account.xp + guest.xp once
-- ---------------------------------------------------------------------------
drop function if exists public.merge_guest_progress(uuid, text, int, int, int, text[], jsonb, text[], jsonb);

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
  -- guest_progress.xp is the only guest XP source. Do not add reconstructed achievement XP.
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
        insert into public.player_achievements (user_id, achievement_id)
        values (p_user_id, ach)
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
        left(coalesce(run ->> 'localSessionId', ''), 80),
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

revoke all on function public.best_verified_scores(text, text, int) from public, anon, authenticated;
revoke all on function public.personal_verified_rank(uuid, text, text) from public, anon, authenticated;
grant execute on function public.best_verified_scores(text, text, int) to service_role;
grant execute on function public.personal_verified_rank(uuid, text, text) to service_role;
