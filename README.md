# Gamesweb

Instant browser arcade. One player identity across Neon Drift, Velocity Run, and Swarm Protocol.

This repository is a pnpm workspace: the Next.js app (`apps/web`), shared packages, Phaser games, and Supabase SQL.

This branch is a **public-beta candidate**, not a claim that Gamesweb is deployed or production-verified.

## Architecture

```
Browser (local-first cache + optimistic UI)
  → Next.js App Router
  → guest cookie `gw_guest` or Supabase session
  → Route handlers (Zod + rate limit + origin check)
  → Memory store (dev/CI) or Supabase (when admin credentials exist)
```

The client may be optimistic and offline-tolerant. The server cookie is the guest identity. The server is the source of truth for accounts, verified scores, leaderboards, friendships, presence, cloud saves, and competitive rewards.

`localStorage` is a cache / offline fallback. It cannot choose another player's guest id.

## Develop

```bash
pnpm install
cp .env.example apps/web/.env.local
pnpm dev
```

Open `http://localhost:3000`. Play works immediately as a guest. Without Supabase, APIs use an in-process memory backend (`GAMESWEB_BACKEND=auto`). That backend is real (sessions, scores, leaderboards) but not shared across serverless instances.

## Environment

See `.env.example`.

| Variable | Where | Required in Vercel production |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Public, https | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public (alias: `NEXT_PUBLIC_SUPABASE_ANON_KEY`) | Yes |
| `SUPABASE_SECRET_KEY` | Server only (alias: `SUPABASE_SERVICE_ROLE_KEY`) | Yes |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Server | **Yes** (no memory fallback in production) |
| `NEXT_PUBLIC_POSTHOG_KEY` | Public | No |
| `TURNSTILE_SECRET_KEY` | Server | No |
| `GAMESWEB_BACKEND` | Server | `auto` (default) |

Never put the secret key in `NEXT_PUBLIC_*`. Production (`VERCEL_ENV=production`) refuses to start if Supabase, Redis, or https `NEXT_PUBLIC_APP_URL` are missing, or if the secret equals the publishable key. Seed rivals (`NEXT_PUBLIC_SHOW_SEED_DATA`) are ignored in production.

## Supabase

Code path implemented, **not integration-tested against a live Gamesweb Supabase project in this environment.**

1. Create a project.
2. Apply `supabase/migrations/0001_init.sql`, `0002_hardening.sql`, then `0003_quality_hardening.sql`.
3. Auth → URL configuration: add `https://<domain>/auth/callback` and local `http://localhost:3000/auth/callback`.
4. Enable email magic link. The app uses `@supabase/ssr` `signInWithOtp` + `exchangeCodeForSession` (and `verifyOtp` for `token_hash` links).
5. Optional: run `supabase/seed.sql` only in development.

RLS is enabled. Public clients can read catalogs and `public_profiles` / `public_scores`. Private tables are owner-only. Writes from the app go through Next.js with the secret key after identity checks.

## Auth and guest merge

Guests play immediately (`gw_guest` cookie + local cache). Save progress sends a magic link. `/auth/callback` establishes the Supabase cookie session, then `/auth/complete` POSTs `/api/player/merge`.

Merge rules:

- Guest identity is the **server cookie**, never `body.anonymousId`.
- Client snapshots / claimed achievements / claimed XP are not authority.
- Server-side guest `game_sessions` and `scores` (same `anonymous_id`) transfer to `user_id`.
- Achievements are reconstructed from **verified** scores.
- XP is **not** `guest.xp + account.xp`. The account keeps its XP and gains XP only for newly reconstructed achievements.
- Optional `offlineRuns` import as **unverified** guest data (no competitive rewards).
- Each `anonymous_id` merges at most once (`guest_migrations`), inside `merge_guest_progress`.

## Scores

`POST /api/session` inserts a `game_sessions` row bound to the cookie or auth user.

`POST /api/score` requires session ownership:

- authenticated: `session.user_id === identity.userId`
- guest: `session.anonymous_id === cookie` and no `user_id`

Offline submissions do not invent a session with submit-time as start. They insert as `unverified` (`offline_submission = true`).

Verified runs get full XP / PB / achievements / quests / leaderboard. Unverified runs get minimal run XP only. Flagged runs get 0.

`finalize_game_run` writes score + session close + progression atomically when the RPC is applied.

Public `GET /api/leaderboard` is cacheable and has **no** `personalRank`. Rank is `GET /api/leaderboard/me` (`private, no-store`).

Velocity Run is lower-is-better. Neon Drift uses `circuit` / `daily`. Swarm uses `survival`.

## Vercel

Root directory: repository root. `vercel.json` sets `pnpm install --frozen-lockfile` and `pnpm --filter @gamesweb/web build`. Framework: Next.js.

No Vercel project is claimed deployed from this repository state unless you can open the production URL.

## CI

`.github/workflows/ci.yml` uses the root `packageManager` field (`pnpm@10.33.3`) via `pnpm/action-setup` with no extra version pin.

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

## Threat model (light)

- Guests cannot submit another guest's session.
- Idempotency keys are scoped by identity (`user:` / `anon:`).
- Merge cannot ingest another player's cookie or a client-made XP snapshot.
- Admin/service-role queries still authorize from the server session, not client-supplied user ids.
- Production without Redis fails closed on rate limits and refuses to boot.

## Known limitations

- Live Supabase / Vercel / Upstash are **not provisioned** in this agent environment.
- RLS and security advisors are encoded in SQL; they are not re-run against a live project here.
- Magic-link email delivery cannot be E2E tested without a real auth mailbox.
- Memory backend is single-process; do not use it as production persistence.
- Anti-cheat is heuristic validation, not a trusted client.
- Phaser games remain mechanically the launch versions.

## Rollback

Migration `0003_quality_hardening.sql` is additive. To roll back RPCs: drop `finalize_game_run`, `merge_guest_progress`, `best_verified_scores`, `personal_verified_rank`. Idempotency primary key becomes `(scope, key)` — restore from backup if you must revert that table.
