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
2. Apply `supabase/migrations/0001_init.sql`, `0002_hardening.sql`, `0003_quality_hardening.sql`, then `0004_authoritative_progression.sql`.
3. Auth → URL configuration: add `https://<domain>/auth/callback` and local `http://localhost:3000/auth/callback`.
4. Enable email magic link. The app uses `@supabase/ssr` `signInWithOtp` + `exchangeCodeForSession` (and `verifyOtp` for `token_hash` links).
5. Optional: run `supabase/seed.sql` only in development.
6. Optional live checks: `pnpm test:supabase` (no-ops with exit 0 unless URL + publishable + secret keys are set).

RLS is enabled. **GRANTS** are the write boundary: `anon` and `authenticated` have SELECT on catalogs, `public_profiles` / `public_scores`, and owner-only private rows. They do **not** have INSERT/UPDATE/DELETE on `profiles`, scores, sessions, achievements, quests, stats, friendships, presence, saves, cosmetics, guest migrations, idempotency keys, or `guest_progress`. Browser clients cannot `update({ xp: 999999 })` on their own profile. Writes go through Next.js with the secret key.

`guest_progress` has no anon/authenticated SELECT. Guest identity is the `gw_guest` cookie on Next, never a Supabase anon client.

CSP: Next hydration and Phaser still require a `'unsafe-inline'` script fallback alongside the nonce + `strict-dynamic` policy. Do not remove it before a dedicated CSP pass; it is documented, not accidental.

## Auth and guest merge

Guests play immediately (`gw_guest` cookie + local cache). Save progress sends a magic link. `/auth/callback` establishes the Supabase cookie session, then `/auth/complete` POSTs `/api/player/merge`.

Merge rules:

- Guest identity is the **server cookie**, never `body.anonymousId`.
- Client snapshots / claimed achievements / claimed XP are not authority.
- Server-side guest `game_sessions` and `scores` (same `anonymous_id`) transfer to `user_id`.
- Server-side `guest_progress` (XP, quests, stats, achievement projection) transfers in the same transaction.
- **XP source:** `guest_progress.xp` is authoritative for the guest side (awarded run-by-run in `finalize_game_run`). Merge does `account.xp + guest.xp` once. Reconstructed achievements are unioned and do **not** add XP again.
- Optional `offlineRuns` import as **unverified** guest data (0 competitive XP).
- Each `anonymous_id` merges at most once (`guest_migrations` + row locks + advisory lock). `guest_progress.migrated_at` is set on success.

## Scores

`POST /api/session` inserts a `game_sessions` row bound to the cookie or auth user.

`POST /api/score` requires session ownership:

- authenticated: `session.user_id === identity.userId`
- guest: `session.anonymous_id === cookie` and no `user_id`

Offline submissions do not invent a session with submit-time as start. They insert as `unverified` (`offline_submission = true`).

Verified runs get full XP / PB / achievements / quests / leaderboard. Unverified and offline runs persist the score and return `newXp = existingXp` (0 competitive XP). Flagged runs get 0. The client must not show a reward that was not committed.

`finalize_game_run` locks the profile or `guest_progress` row `FOR UPDATE`, applies **relative** `xpEarned` to current XP, and returns the committed `{ scoreId, alreadyApplied, xpEarned, newXp, newLevel, achievementsApplied, questsCompleted }`. Node never writes an absolute `newXp` as authority. Two concurrent verified runs add; they do not last-write-wins.

Idempotency keys carry `expires_at` (~7 days). There is no janitor in this beta; a future cron can `delete from idempotency_keys where expires_at < now()`.

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
- `anon` / `authenticated` cannot write XP, scores, achievements, quests, stats, or sessions.
- Social: `remove` only deletes `accepted`. `unblock` only deletes a `blocked` row created by the caller. The blocked user cannot delete the other's block.

## Known limitations

- Live Supabase / Vercel / Upstash are **not provisioned** in this agent environment.
- RLS and security advisors are encoded in SQL; they are not re-run against a live project here.
- Magic-link email delivery cannot be E2E tested without a real auth mailbox.
- Memory backend is single-process; do not use it as production persistence.
- Anti-cheat is heuristic validation, not a trusted client.
- Phaser games remain mechanically the launch versions.
- `pnpm test:supabase` is the live grant/RLS script; without credentials it skips.

## Rollback

Migration `0004_authoritative_progression.sql` is additive. To roll back: drop `guest_progress`, restore `finalize_game_run` / `merge_guest_progress` from `0003`, and re-evaluate table GRANTs. Do not drop `guest_migrations`.
