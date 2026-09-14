# Gamesweb

Instant browser arcade. One player identity across Neon Drift, Velocity Run, and Swarm Protocol.

## Stack

- Next.js (App Router) + TypeScript
- Phaser 3 games, code-split per title
- Tailwind CSS
- Local-first guest identity; optional Supabase + PostHog

## Develop

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. Play is available immediately — no account.

## Environment

Copy `.env.example` to `apps/web/.env.local`. The app runs without secrets.

Apply `supabase/migrations/0001_init.sql` when you have a Supabase project.

## Brand

Product name, wordmark, and defaults live in `packages/config/src/index.ts`.
