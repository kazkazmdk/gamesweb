-- Completes 0006 for server-authoritative party rounds and text actor keys.
-- Applied only to a Gamesweb database project. Not a second social backend.

alter table public.parties add column if not exists host_actor text;
alter table public.party_members add column if not exists actor_id text;
alter table public.party_members add column if not exists display_name text default 'Player';
alter table public.party_rounds add column if not exists mode text not null default 'default';
alter table public.party_rounds add column if not exists status text not null default 'pending';

alter table public.challenges add column if not exists challenger_actor text;
alter table public.challenges add column if not exists challenger_name text;
alter table public.challenge_attempts add column if not exists player_actor text;
alter table public.challenge_attempts add column if not exists player_name text;
alter table public.notifications add column if not exists actor_id text;

create table if not exists public.party_round_attempts (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.parties(id) on delete cascade,
  round_index int not null,
  actor_id text not null,
  run_id text not null,
  score bigint not null,
  trust text not null default 'unverified',
  submitted_at timestamptz not null default now(),
  unique (party_id, round_index, actor_id),
  unique (party_id, round_index, run_id)
);

create index if not exists party_round_attempts_party_idx on public.party_round_attempts (party_id, round_index);
create index if not exists notifications_actor_idx on public.notifications (actor_id, created_at desc);

-- user_id is part of the original primary key, so it cannot become nullable until that key is dropped.
alter table public.party_members drop constraint if exists party_members_pkey;
alter table public.party_members alter column user_id drop not null;
create unique index if not exists party_members_party_user_uidx
  on public.party_members (party_id, user_id)
  where user_id is not null;
create unique index if not exists party_members_party_actor_uidx
  on public.party_members (party_id, actor_id)
  where actor_id is not null;
alter table public.notifications alter column user_id drop not null;
alter table public.parties add column if not exists standings jsonb not null default '[]'::jsonb;
alter table public.parties add column if not exists round_roster jsonb not null default '[]'::jsonb;
alter table public.parties add column if not exists submitted jsonb not null default '[]'::jsonb;
alter table public.party_members add column if not exists joined_at timestamptz not null default now();
alter table public.rivals add column if not exists self_actor text;
alter table public.rivals add column if not exists other_actor text;
alter table public.rivals add column if not exists other_name text;
