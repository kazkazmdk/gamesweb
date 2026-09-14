# Gamesweb

Instant browser arcade. One player identity across Neon Drift, Velocity Run, and Swarm Protocol.

This repository is a pnpm workspace: the Next.js app (`apps/web`), shared packages, Phaser games, and Supabase SQL.

## Architecture

```
Browser (local-first cache)
  → Next.js App Router
  → guest cookie or Supabase session
  → Route handlers (Zod + rate limit + origin check)
  → Memory store (dev/CI) or Supabase (preview/production)
```

The client may be optimistic and offline-tolerant. The server is the source of truth for accounts, global scores, leaderboards, friendships, presence, cloud saves, and important rewards.

`localStorage` is a cache / guest fallback, not cross-player authority.

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
| `NEXT_PUBLIC_APP_URL` | Public | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public (anon/publishable alias: `NEXT_PUBLIC_SUPABASE_ANON_KEY`) | Yes |
| `SUPABASE_SECRET_KEY` | Server only (alias: `SUPABASE_SERVICE_ROLE_KEY`) | Yes |
| `NEXT_PUBLIC_POSTHOG_KEY` | Public | No |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Server | No (memory rate limits otherwise) |
| `TURNSTILE_SECRET_KEY` | Server | No |
| `GAMESWEB_BACKEND` | Server | `auto` (default) |

Never put the secret key in `NEXT_PUBLIC_*`. Production (`VERCEL_ENV=production`) without Supabase admin credentials returns `503 NOT_CONFIGURED` from mutating APIs. Seed rivals (`NEXT_PUBLIC_SHOW_SEED_DATA`) are ignored in production.

## Supabase

1. Create a project.
2. Apply `supabase/migrations/0001_init.sql` then `0002_hardening.sql`.
3. Auth → URL configuration: add `https://<domain>/auth/callback` and local `http://localhost:3000/auth/callback`.
4. Enable email magic link.
5. Optional: run `supabase/seed.sql` only in development.

RLS is enabled. Public clients can read catalogs and `public_profiles` / `public_scores`. Private tables are owner-only. Writes from the app go through Next.js with the secret key.

## Auth and guest merge

Guests play immediately (`gw_guest` cookie + local cache). Save progress sends a magic link. `/auth/callback` establishes the Supabase cookie session, then `/auth/complete` POSTs `/api/player/merge`.

Merge rules (also in `packages/database`):

- Each `anonymous_id` merges at most once (`guest_migrations`).
- Achievements: set union.
- Scores: union, skip flagged, skip duplicates.
- Saves: latest timestamp wins.
- XP is **not** `guest.xp + account.xp`. The account keeps its XP and gains XP only for newly added achievements.

## Scores

`POST /api/session` inserts a `game_sessions` row.

`POST /api/score` loads that session, rejects missing/closed/mismatched runs, validates with `validateScore`, writes a score, and returns `progressionDiff`. Public leaderboards include **verified** authenticated scores only. Offline submissions are `unverified`.

Velocity Run is lower-is-better (`course-1` / `course-2` / `course-3`). Neon Drift uses `circuit` / `daily`. Swarm uses `survival`.

## Vercel

Root directory: repository root. `vercel.json` sets `pnpm install --frozen-lockfile` and `pnpm --filter @gamesweb/web build`. Framework: Next.js.

## CI

`.github/workflows/ci.yml` runs frozen install, typecheck, lint, vitest, production build, and Playwright smoke tests.

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

## Production checklist

- Supabase project + both migrations
- Redirect URLs for magic link
- `NEXT_PUBLIC_APP_URL` is the canonical https origin
- Secret key only on the server
- `NEXT_PUBLIC_SHOW_SEED_DATA=false`
- Optional Upstash for distributed rate limits
- Optional PostHog
- Confirm CSP still allows Phaser, WebAudio, fullscreen, and auth redirects
