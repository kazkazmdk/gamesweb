-- Quality hardening: scoped idempotency, atomic RPCs, score/session metadata.
-- Additive on 0001_init.sql + 0002_hardening.sql. Do not edit those files.
-- Rollback: drop the new functions/views/columns if needed; guest_migrations stays authoritative.

alter function public.gamesweb_set_updated_at() set search_path = public;

alter table public.idempotency_keys
  add column if not exists scope text;
alter table public.idempotency_keys
  add column if not exists expires_at timestamptz;

update public.idempotency_keys
set scope = coalesce(
  case when user_id is not null then 'user:' || user_id::text end,
  case when anonymous_id is not null then 'anon:' || anonymous_id end,
  'global'
)
where scope is null;

alter table public.idempotency_keys
  alter column scope set default 'global';
update public.idempotency_keys set scope = 'global' where scope is null;
alter table public.idempotency_keys
  alter column scope set not null;

alter table public.idempotency_keys drop constraint if exists idempotency_keys_pkey;
alter table public.idempotency_keys drop constraint if exists idempotency_keys_scope_key_pkey;
alter table public.idempotency_keys add primary key (scope, key);

create index if not exists idempotency_keys_expires_idx on public.idempotency_keys (expires_at);

alter table public.scores
  add column if not exists flag_reasons text[] not null default '{}';
alter table public.scores
  add column if not exists review_status text not null default 'none';
alter table public.scores
  add column if not exists reviewed_at timestamptz;
alter table public.scores
  add column if not exists game_version text;
alter table public.scores
  add column if not exists build_sha text;
alter table public.scores
  add column if not exists offline_submission boolean not null default false;
alter table public.scores
  add column if not exists client_started_at timestamptz;
alter table public.scores
  add column if not exists client_ended_at timestamptz;
alter table public.scores
  add column if not exists local_session_id text;

alter table public.scores drop constraint if exists scores_review_status_check;
alter table public.scores
  add constraint scores_review_status_check
  check (review_status in ('none', 'pending', 'cleared', 'rejected'));

alter table public.game_sessions
  add column if not exists build_sha text;
alter table public.game_sessions
  add column if not exists app_version text;
alter table public.game_sessions
  add column if not exists client_started_at timestamptz;
alter table public.game_sessions
  add column if not exists server_started_at timestamptz not null default now();
alter table public.game_sessions
  add column if not exists server_ended_at timestamptz;
alter table public.game_sessions
  add column if not exists offline boolean not null default false;

create index if not exists scores_anon_idx on public.scores (anonymous_id, created_at desc)
  where user_id is null;
create index if not exists scores_user_game_mode_idx on public.scores (user_id, game_id, mode, verified_status);

-- Best verified score per authenticated user. Velocity is lower-is-better.
create or replace function public.best_verified_scores(p_game_id text, p_mode text, p_limit int)
returns table (
  rank int,
  display_name text,
  username text,
  avatar text,
  score bigint,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with best as (
    select distinct on (s.user_id)
      s.user_id,
      s.score,
      s.created_at
    from public.scores s
    join public.profiles p on p.user_id = s.user_id
    where s.game_id = p_game_id
      and s.mode = p_mode
      and s.verified_status = 'verified'
      and s.user_id is not null
      and p.is_seed is distinct from true
    order by
      s.user_id,
      case when p_game_id = 'velocity-run' then s.score end asc nulls last,
      case when p_game_id <> 'velocity-run' then s.score end desc nulls last,
      s.created_at asc
  ),
  ordered as (
    select
      b.*,
      p.display_name,
      p.username,
      p.avatar,
      row_number() over (
        order by
          case when p_game_id = 'velocity-run' then b.score end asc nulls last,
          case when p_game_id <> 'velocity-run' then b.score end desc nulls last,
          b.created_at asc
      )::int as rank
    from best b
    join public.profiles p on p.user_id = b.user_id
  )
  select o.rank, o.display_name, o.username, o.avatar, o.score, o.created_at
  from ordered o
  order by o.rank
  limit greatest(1, least(coalesce(p_limit, 10), 100));
$$;

create or replace function public.personal_verified_rank(p_user_id uuid, p_game_id text, p_mode text)
returns int
language sql
stable
security definer
set search_path = public
as $$
  with best as (
    select distinct on (s.user_id)
      s.user_id,
      s.score,
      s.created_at
    from public.scores s
    join public.profiles p on p.user_id = s.user_id
    where s.game_id = p_game_id
      and s.mode = p_mode
      and s.verified_status = 'verified'
      and s.user_id is not null
      and p.is_seed is distinct from true
    order by
      s.user_id,
      case when p_game_id = 'velocity-run' then s.score end asc nulls last,
      case when p_game_id <> 'velocity-run' then s.score end desc nulls last,
      s.created_at asc
  ),
  ranked as (
    select
      user_id,
      row_number() over (
        order by
          case when p_game_id = 'velocity-run' then score end asc nulls last,
          case when p_game_id <> 'velocity-run' then score end desc nulls last,
          created_at asc
      )::int as rank
    from best
  )
  select rank from ranked where user_id = p_user_id;
$$;

revoke all on function public.best_verified_scores(text, text, int) from public;
revoke all on function public.personal_verified_rank(uuid, text, text) from public;
grant execute on function public.best_verified_scores(text, text, int) to service_role;
grant execute on function public.personal_verified_rank(uuid, text, text) to service_role;

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
  new_xp int;
  new_level int;
  ach text;
  quest_id text;
  quest_progress double precision;
  quest_done boolean;
begin
  if p_verified not in ('verified', 'unverified', 'flagged') then
    raise exception 'invalid_verified';
  end if;

  select * into sess from public.game_sessions where id = p_session_id for update;
  if not found then
    raise exception 'session_missing';
  end if;

  if p_identity_user_id is not null then
    if sess.user_id is distinct from p_identity_user_id then
      raise exception 'forbidden';
    end if;
  else
    if sess.user_id is not null or sess.anonymous_id is distinct from p_identity_anonymous_id then
      raise exception 'forbidden';
    end if;
  end if;

  select * into existing_score from public.scores where session_id = p_session_id;
  if found then
    return jsonb_build_object('alreadyApplied', true, 'scoreId', existing_score.id);
  end if;

  if sess.ended_at is not null then
    raise exception 'session_closed';
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

  if p_identity_user_id is not null and p_progression is not null then
    new_xp := coalesce((p_progression->>'newXp')::int, 0);
    new_level := coalesce((p_progression->>'newLevel')::int, 1);
    update public.profiles
      set xp = new_xp, level = new_level, last_seen_at = now()
      where user_id = p_identity_user_id;

    for ach in select jsonb_array_elements_text(coalesce(p_progression->'achievements', '[]'::jsonb))
    loop
      if exists (select 1 from public.achievements a where a.id = ach) then
        insert into public.player_achievements (user_id, achievement_id)
        values (p_identity_user_id, ach)
        on conflict do nothing;
      end if;
    end loop;

    if p_progression->'questProgress' is not null then
      for quest_id, quest_progress in
        select key, value::text::double precision
        from jsonb_each(p_progression->'questProgress')
      loop
        if exists (select 1 from public.quests q where q.id = quest_id) then
          quest_done := coalesce(p_progression->'questsCompleted', '[]'::jsonb) ? quest_id;
          insert into public.quest_progress (quest_id, user_id, progress, completed_at)
          values (
            quest_id,
            p_identity_user_id,
            quest_progress,
            case when quest_done then now() else null end
          )
          on conflict (quest_id, user_id) do update
            set progress = excluded.progress,
                completed_at = coalesce(public.quest_progress.completed_at, excluded.completed_at);
        end if;
      end loop;
    end if;
  end if;

  return jsonb_build_object('alreadyApplied', false, 'scoreId', new_score.id);
end;
$$;

create or replace function public.merge_guest_progress(
  p_user_id uuid,
  p_anonymous_id text,
  p_xp int,
  p_level int,
  p_streak int,
  p_achievements text[],
  p_quest_progress jsonb,
  p_quest_completed text[],
  p_offline_runs jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.guest_migrations%rowtype;
  xp_before int;
  run jsonb;
  ach text;
  quest_id text;
  quest_progress double precision;
begin
  if p_user_id is null or p_anonymous_id is null or length(p_anonymous_id) < 8 then
    raise exception 'invalid_identity';
  end if;

  perform 1 from public.profiles where user_id = p_user_id for update;
  if not found then
    raise exception 'profile_missing';
  end if;

  select * into existing from public.guest_migrations where anonymous_id = p_anonymous_id for update;
  if found then
    return jsonb_build_object('alreadyMerged', true);
  end if;

  select xp into xp_before from public.profiles where user_id = p_user_id;

  insert into public.guest_migrations (anonymous_id, user_id, xp_before, xp_after)
  values (p_anonymous_id, p_user_id, coalesce(xp_before, 0), coalesce(p_xp, xp_before, 0));

  update public.scores
    set user_id = p_user_id
    where anonymous_id = p_anonymous_id and user_id is null;

  update public.game_sessions
    set user_id = p_user_id
    where anonymous_id = p_anonymous_id and user_id is null;

  update public.profiles
    set xp = coalesce(p_xp, xp),
        level = coalesce(p_level, level),
        streak = greatest(streak, coalesce(p_streak, 0)),
        is_guest = false,
        anonymous_id = p_anonymous_id,
        last_seen_at = now()
    where user_id = p_user_id;

  if p_achievements is not null then
    foreach ach in array p_achievements
    loop
      if exists (select 1 from public.achievements a where a.id = ach) then
        insert into public.player_achievements (user_id, achievement_id)
        values (p_user_id, ach)
        on conflict do nothing;
      end if;
    end loop;
  end if;

  if p_quest_progress is not null then
    for quest_id, quest_progress in select key, value::text::double precision from jsonb_each(p_quest_progress)
    loop
      if exists (select 1 from public.quests q where q.id = quest_id) then
        insert into public.quest_progress (quest_id, user_id, progress, completed_at)
        values (
          quest_id,
          p_user_id,
          quest_progress,
          case when p_quest_completed is not null and quest_id = any(p_quest_completed) then now() else null end
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
      insert into public.scores (
        user_id, anonymous_id, game_id, mode, score, metadata, verified_status,
        offline_submission, client_started_at, client_ended_at, local_session_id, game_version
      ) values (
        p_user_id,
        p_anonymous_id,
        run->>'gameId',
        coalesce(run->>'mode', 'default'),
        coalesce((run->>'score')::bigint, 0),
        coalesce(run->'metadata', '{}'::jsonb),
        'unverified',
        true,
        to_timestamp(coalesce((run->>'startedAt')::bigint, 0) / 1000.0),
        to_timestamp(coalesce((run->>'endedAt')::bigint, 0) / 1000.0),
        run->>'localSessionId',
        run->>'gameVersion'
      );
    end loop;
  end if;

  return jsonb_build_object('alreadyMerged', false);
end;
$$;

revoke all on function public.finalize_game_run(
  uuid, uuid, text, text, bigint, int, text, text, jsonb, jsonb, text[], text, text, boolean, timestamptz, timestamptz
) from public;
revoke all on function public.merge_guest_progress(
  uuid, text, int, int, int, text[], jsonb, text[], jsonb
) from public;
grant execute on function public.finalize_game_run(
  uuid, uuid, text, text, bigint, int, text, text, jsonb, jsonb, text[], text, text, boolean, timestamptz, timestamptz
) to service_role;
grant execute on function public.merge_guest_progress(
  uuid, text, int, int, int, text[], jsonb, text[], jsonb
) to service_role;

-- Public views stay column-minimal. Recreate to lock the surface.
create or replace view public.public_profiles
with (security_barrier = true, security_invoker = false) as
select
  p.username,
  p.display_name,
  p.avatar,
  p.level,
  (
    select count(*)::int
    from public.player_achievements pa
    where pa.user_id = p.user_id
  ) as achievement_count
from public.profiles p
where p.is_seed is distinct from true;

create or replace view public.public_scores
with (security_barrier = true, security_invoker = false) as
select
  s.game_id,
  s.mode,
  s.score,
  s.created_at,
  p.username,
  p.display_name,
  p.avatar
from public.scores s
join public.profiles p on p.user_id = s.user_id
where s.verified_status = 'verified'
  and p.is_seed is distinct from true
  and s.user_id is not null;

grant select on public.public_profiles to anon, authenticated;
grant select on public.public_scores to anon, authenticated;
