-- Harden RLS, public surface, indexes, constraints, guest merge ledger.
-- Additive on 0001_init.sql. Service-role API routes remain the write path.

alter table public.profiles
  add column if not exists share_activity boolean not null default true;

alter table public.profiles
  drop constraint if exists profiles_username_len;
alter table public.profiles
  add constraint profiles_username_len check (char_length(username) between 3 and 20);
alter table public.profiles
  drop constraint if exists profiles_display_name_len;
alter table public.profiles
  add constraint profiles_display_name_len check (char_length(display_name) between 1 and 32);
alter table public.profiles
  drop constraint if exists profiles_username_format;
alter table public.profiles
  add constraint profiles_username_format check (username ~ '^[a-zA-Z0-9_]+$');

alter table public.game_sessions
  drop constraint if exists game_sessions_device_check;
alter table public.game_sessions
  add constraint game_sessions_device_check
  check (device in ('desktop', 'laptop', 'tablet', 'mobile'));

alter table public.scores
  drop constraint if exists scores_session_unique;
alter table public.scores
  add constraint scores_session_unique unique (session_id);

create table if not exists public.guest_migrations (
  anonymous_id text primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  merged_at timestamptz not null default now(),
  xp_before int not null default 0,
  xp_after int not null default 0
);

create table if not exists public.idempotency_keys (
  key text primary key,
  endpoint text not null,
  user_id uuid,
  anonymous_id text,
  status int not null,
  response jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists scores_verified_desc_idx
  on public.scores (game_id, mode, score desc, created_at desc)
  where verified_status = 'verified';
create index if not exists scores_verified_asc_idx
  on public.scores (game_id, mode, score asc, created_at asc)
  where verified_status = 'verified';
create index if not exists scores_session_idx on public.scores (session_id);
create index if not exists sessions_anon_started_idx on public.game_sessions (anonymous_id, started_at desc);
create index if not exists friendships_requester_idx on public.friendships (requester_id, status);
create index if not exists quest_progress_user_idx on public.quest_progress (user_id);
create index if not exists guest_migrations_user_idx on public.guest_migrations (user_id);
create index if not exists profiles_username_lower_idx on public.profiles (lower(username));

drop policy if exists "public profiles are readable" on public.profiles;
drop policy if exists "verified scores readable" on public.scores;
drop policy if exists "presence readable" on public.presence;
drop policy if exists "own stats readable" on public.player_stats;
drop policy if exists "player achievements readable" on public.player_achievements;
drop policy if exists "own saves readable" on public.game_saves;
drop policy if exists "accepted friendships readable by members" on public.friendships;
drop policy if exists "own profile update" on public.profiles;
drop policy if exists "games are readable" on public.games;
drop policy if exists "achievements readable" on public.achievements;
drop policy if exists "quests readable" on public.quests;
drop policy if exists "cosmetics readable" on public.cosmetics;

-- Catalogs
create policy "games_live_read" on public.games
  for select using (status = 'live');
create policy "achievements_read" on public.achievements
  for select using (true);
create policy "quests_read" on public.quests
  for select using (true);
create policy "cosmetics_read" on public.cosmetics
  for select using (true);

-- Profiles: owner only. Public columns live on public_profiles.
create policy "profiles_select_own" on public.profiles
  for select using ((select auth.uid()) = user_id);
create policy "profiles_update_own" on public.profiles
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Private player data
create policy "sessions_own_read" on public.game_sessions
  for select using (
    (select auth.uid()) is not null and (select auth.uid()) = user_id
  );

create policy "scores_own_read" on public.scores
  for select using (
    (select auth.uid()) is not null and (select auth.uid()) = user_id
  );

create policy "saves_own" on public.game_saves
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "stats_own" on public.player_stats
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "player_achievements_own" on public.player_achievements
  for select using ((select auth.uid()) = user_id);

create policy "quest_progress_own" on public.quest_progress
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "cosmetics_own" on public.player_cosmetics
  for select using ((select auth.uid()) = user_id);

create policy "friendships_members" on public.friendships
  for select using (
    (select auth.uid()) = requester_id or (select auth.uid()) = addressee_id
  );

create policy "friendships_insert_self" on public.friendships
  for insert with check ((select auth.uid()) = requester_id and requester_id <> addressee_id);

create policy "friendships_update_member" on public.friendships
  for update using (
    (select auth.uid()) = requester_id or (select auth.uid()) = addressee_id
  );

create policy "presence_self_write" on public.presence
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "presence_self_or_friends" on public.presence
  for select using (
    (select auth.uid()) = user_id
    or exists (
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
  );

create policy "guest_migrations_own" on public.guest_migrations
  for select using ((select auth.uid()) = user_id);

alter table public.guest_migrations enable row level security;
alter table public.idempotency_keys enable row level security;

create policy "idempotency_deny" on public.idempotency_keys
  for select using (false);

-- Public profile surface: no email, no anonymous_id, no last_seen.
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

grant select on public.public_profiles to anon, authenticated;

create or replace view public.public_scores
with (security_barrier = true, security_invoker = false) as
select
  s.game_id,
  s.mode,
  s.score,
  s.created_at,
  s.verified_status,
  p.username,
  p.display_name,
  p.avatar
from public.scores s
join public.profiles p on p.user_id = s.user_id
where s.verified_status = 'verified'
  and p.is_seed is distinct from true
  and s.user_id is not null;

grant select on public.public_scores to anon, authenticated;

insert into public.achievements (id, game_id, key, name, description, xp_reward)
values
  ('platform:first-run', null, 'first-run', 'First Run', 'Finish any game once.', 20),
  ('platform:three-worlds', null, 'three-worlds', 'Three Worlds', 'Play all three launch games.', 80),
  ('platform:on-fire', null, 'on-fire', 'On Fire', 'Beat a personal record three times.', 60),
  ('platform:night-shift', null, 'night-shift', 'Night Shift', 'Play after midnight.', 25),
  ('platform:explorer', null, 'explorer', 'Explorer', 'Play two genres in one session.', 40),
  ('platform:return-tomorrow', null, 'return-tomorrow', 'Return Tomorrow', 'Keep a 2-day streak.', 35),
  ('platform:weekender', null, 'weekender', 'Weekender', 'Reach a 7-day streak.', 90),
  ('platform:social-spark', null, 'social-spark', 'Social Spark', 'Copy an invite link.', 15)
on conflict (id) do nothing;
