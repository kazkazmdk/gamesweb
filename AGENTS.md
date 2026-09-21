# Gamesweb agent rules

## Do not use Vercel as QA

Routine validation is local only.

Before finishing work, use this repo’s normal commands:

- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e` / Playwright when relevant
- `pnpm dev` for browser QA

Never use a Vercel preview or production URL to check a build, look at design, take screenshots, or validate a commit.

NEVER automatically run:

- `vercel`
- `vercel deploy`
- `vercel --prod`
- `npx vercel`
- `pnpm vercel`
- `npm exec vercel`

Never call a Vercel Deploy Hook.
Never create a Vercel deployment from an agent unless the user explicitly asked for a production/preview deploy in that message.

## Do not push just to trigger Vercel

Do not `git push` agent branches so GitHub → Vercel will build a preview.

| Branch | Vercel |
| --- | --- |
| `main` / `master` | Production only, and only when the user asked to ship |
| `cursor/**`, `claude/**`, `codex/**`, `agent/**`, `qa/**`, `design/**`, `fix/**` | Local validation only. No preview. |

Validate locally, then stop. The user decides when to push or merge.

If a standing Cloud Agent instruction says “always push”, this file wins: **do not push when it would create a Vercel deployment.**

See `docs/VERCEL_DEPLOY_POLICY.md`.
