-- Social arcade tables for a future Gamesweb database project.
-- Not applied to unrelated Supabase projects. Live Gamesweb persistence is not provisioned yet.

insert into public.games (id, slug, title, status, manifest)
values
  ('sky-stack', 'sky-stack', 'Sky Stack', 'live', '{"version":"1.0.0"}'::jsonb),
  ('knockout-circuit', 'knockout-circuit', 'Knockout Circuit', 'live', '{"version":"1.0.0"}'::jsonb),
  ('pocket-striker', 'pocket-striker', 'Pocket Striker', 'live', '{"version":"1.0.0"}'::jsonb),
  ('territory-rush', 'territory-rush', 'Territory Rush', 'live', '{"version":"1.0.0"}'::jsonb),
  ('crowd-control', 'crowd-control', 'Crowd Control', 'live', '{"version":"1.0.0"}'::jsonb)
on conflict (id) do update set title = excluded.title, slug = excluded.slug, manifest = excluded.manifest;

create or replace function public.is_known_game(p_id text)
returns boolean
language sql
stable
as $$
  select exists (select 1 from public.games g where g.id = p_id);
$$;

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  public_code text not null unique,
  game_id text not null references public.games(id),
  mode text not null,
  seed text not null,
  type text not null,
  challenger_id uuid,
  target_id uuid,
  challenger_run_id uuid,
  challenger_score bigint not null,
  challenger_ghost_id uuid,
  status text not null default 'open',
  trust text not null default 'unverified',
  game_version text not null default '1.0.0',
  metadata jsonb not null default '{}'::jsonb,
  winner_id uuid,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  player_id uuid,
  score bigint not null,
  trust text not null default 'unverified',
  run_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (challenge_id, player_id)
);

create table if not exists public.rivals (
  player_a uuid not null,
  player_b uuid not null,
  wins_a int not null default 0,
  wins_b int not null default 0,
  draws int not null default 0,
  total_matches int not null default 0,
  last_match timestamptz,
  streak int not null default 0,
  rivalry_score int not null default 0,
  primary key (player_a, player_b),
  check (player_a < player_b)
);

create table if not exists public.parties (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_id uuid,
  state text not null default 'lobby',
  current_round int not null default 0,
  playlist jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.party_members (
  party_id uuid not null references public.parties(id) on delete cascade,
  user_id uuid not null,
  ready boolean not null default false,
  points int not null default 0,
  primary key (party_id, user_id)
);

create table if not exists public.party_rounds (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.parties(id) on delete cascade,
  round_index int not null,
  game_id text not null references public.games(id),
  unique (party_id, round_index)
);

create table if not exists public.ghost_runs (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references public.games(id),
  mode text not null,
  run_id uuid,
  user_id uuid,
  version text not null,
  seed text,
  duration int not null,
  score bigint not null,
  sampling_rate int not null default 12,
  data jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.recent_players (
  user_id uuid not null,
  other_id uuid not null,
  game_id text,
  last_seen timestamptz not null default now(),
  primary key (user_id, other_id)
);

create table if not exists public.daily_events (
  day date not null,
  idx int not null,
  game_id text not null references public.games(id),
  mode text not null,
  seed text not null,
  primary key (day, idx)
);

create table if not exists public.daily_entries (
  day date not null,
  user_id uuid not null,
  idx int not null,
  score bigint not null,
  normalized int not null,
  primary key (day, user_id, idx)
);

create table if not exists public.crews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tag text not null unique,
  owner_id uuid,
  xp int not null default 0,
  level int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.crew_members (
  crew_id uuid not null references public.crews(id) on delete cascade,
  user_id uuid not null,
  primary key (crew_id, user_id)
);

create table if not exists public.crew_events (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.season_leagues (
  id uuid primary key default gen_random_uuid(),
  season text not null,
  division text not null,
  cap int not null default 40
);

create table if not exists public.league_members (
  league_id uuid not null references public.season_leagues(id) on delete cascade,
  user_id uuid not null,
  points int not null default 0,
  primary key (league_id, user_id)
);

create table if not exists public.game_quality_stats (
  game_id text primary key references public.games(id),
  impressions bigint not null default 0,
  opens bigint not null default 0,
  loaded bigint not null default 0,
  started bigint not null default 0,
  survived_60s bigint not null default 0,
  finished bigint not null default 0,
  second_run bigint not null default 0
);

alter table public.challenges enable row level security;
alter table public.challenge_attempts enable row level security;
alter table public.rivals enable row level security;
alter table public.parties enable row level security;
alter table public.party_members enable row level security;
alter table public.notifications enable row level security;
alter table public.crews enable row level security;
alter table public.crew_members enable row level security;

create policy challenges_read on public.challenges for select using (true);
create policy challenges_no_client_write on public.challenges for insert with check (false);
create policy notifications_own on public.notifications for select using (auth.uid() = user_id);

create or replace function public.claim_daily_reward(p_day date, p_idx int, p_score bigint, p_normalized int)
returns table (duplicate boolean, total int)
language plpgsql
security definer
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'auth required';
  end if;
  insert into public.daily_entries(day, user_id, idx, score, normalized)
  values (p_day, uid, p_idx, p_score, p_normalized)
  on conflict (day, user_id, idx) do nothing;
  if not found then
    return query select true, coalesce((select sum(normalized)::int from public.daily_entries where day = p_day and user_id = uid), 0);
    return;
  end if;
  return query select false, coalesce((select sum(normalized)::int from public.daily_entries where day = p_day and user_id = uid), 0);
end;
$$;
