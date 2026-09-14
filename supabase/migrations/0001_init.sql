-- Gamesweb identity, progression, social, and score tables.
-- Apply with the Supabase CLI or SQL editor. RLS is on; writes go through
-- service-role API routes except for public profile reads.

create extension if not exists pgcrypto;

create or replace function gamesweb_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  user_id uuid primary key,
  anonymous_id text unique,
  username text unique not null,
  display_name text not null,
  avatar text not null default 'orb-0',
  level int not null default 1 check (level >= 1),
  xp int not null default 0 check (xp >= 0),
  streak int not null default 0 check (streak >= 0),
  is_guest boolean not null default true,
  is_seed boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.games (
  id text primary key,
  slug text unique not null,
  title text not null,
  status text not null default 'live' check (status in ('live', 'hidden')),
  manifest jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(user_id) on delete set null,
  anonymous_id text,
  game_id text not null references public.games(id),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_ms int,
  device text not null default 'desktop',
  score bigint,
  result text,
  game_version text not null default '0.1.0',
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(user_id) on delete set null,
  anonymous_id text,
  game_id text not null references public.games(id),
  mode text not null default 'default',
  score bigint not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  verified_status text not null default 'unverified' check (verified_status in ('verified', 'unverified', 'flagged')),
  session_id uuid references public.game_sessions(id) on delete set null
);

create table if not exists public.achievements (
  id text primary key,
  game_id text references public.games(id) on delete cascade,
  key text not null,
  name text not null,
  description text not null,
  xp_reward int not null default 25,
  unique (game_id, key)
);

create table if not exists public.player_achievements (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  achievement_id text not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table if not exists public.quests (
  id text primary key,
  type text not null check (type in ('daily', 'weekly', 'platform')),
  game_id text references public.games(id) on delete set null,
  requirements jsonb not null,
  reward jsonb not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null
);

create table if not exists public.quest_progress (
  quest_id text not null references public.quests(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  progress double precision not null default 0,
  completed_at timestamptz,
  primary key (quest_id, user_id)
);

create table if not exists public.friendships (
  requester_id uuid not null references public.profiles(user_id) on delete cascade,
  addressee_id uuid not null references public.profiles(user_id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create table if not exists public.presence (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  game_id text references public.games(id) on delete set null,
  status text not null default 'online' check (status in ('online', 'away', 'playing', 'offline')),
  updated_at timestamptz not null default now(),
  room_id text
);

create table if not exists public.game_saves (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  game_id text not null references public.games(id) on delete cascade,
  version text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

create table if not exists public.cosmetics (
  id text primary key,
  type text not null,
  rarity text not null,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.player_cosmetics (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  cosmetic_id text not null references public.cosmetics(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, cosmetic_id)
);

create table if not exists public.player_stats (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  game_id text not null references public.games(id) on delete cascade,
  stat_key text not null,
  value double precision not null default 0,
  primary key (user_id, game_id, stat_key)
);

create index if not exists scores_game_mode_score_idx on public.scores (game_id, mode, score desc);
create index if not exists scores_user_game_idx on public.scores (user_id, game_id);
create index if not exists sessions_user_started_idx on public.game_sessions (user_id, started_at desc);
create index if not exists presence_updated_idx on public.presence (updated_at desc);
create index if not exists friendships_addressee_idx on public.friendships (addressee_id, status);
create index if not exists profiles_username_idx on public.profiles (username);
create index if not exists player_stats_user_idx on public.player_stats (user_id);

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.game_sessions enable row level security;
alter table public.scores enable row level security;
alter table public.achievements enable row level security;
alter table public.player_achievements enable row level security;
alter table public.quests enable row level security;
alter table public.quest_progress enable row level security;
alter table public.friendships enable row level security;
alter table public.presence enable row level security;
alter table public.game_saves enable row level security;
alter table public.cosmetics enable row level security;
alter table public.player_cosmetics enable row level security;
alter table public.player_stats enable row level security;

create policy "public profiles are readable" on public.profiles
  for select using (true);

create policy "games are readable" on public.games
  for select using (status = 'live');

create policy "verified scores readable" on public.scores
  for select using (verified_status <> 'flagged' and (select is_seed from public.profiles p where p.user_id = scores.user_id) is distinct from true or current_setting('request.jwt.claim.role', true) = 'service_role');

create policy "achievements readable" on public.achievements
  for select using (true);

create policy "quests readable" on public.quests
  for select using (true);

create policy "cosmetics readable" on public.cosmetics
  for select using (true);

create policy "accepted friendships readable by members" on public.friendships
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "presence readable" on public.presence
  for select using (true);

create policy "own saves readable" on public.game_saves
  for select using (auth.uid() = user_id);

create policy "own stats readable" on public.player_stats
  for select using (auth.uid() = user_id or true);

create policy "player achievements readable" on public.player_achievements
  for select using (true);

-- Writes are performed by Next.js with the service role. Authenticated users
-- may update their own profile display fields only.
create policy "own profile update" on public.profiles
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into public.games (id, slug, title, status)
values
  ('neon-drift', 'neon-drift', 'Neon Drift', 'live'),
  ('velocity-run', 'velocity-run', 'Velocity Run', 'live'),
  ('swarm-protocol', 'swarm-protocol', 'Swarm Protocol', 'live')
on conflict (id) do nothing;
