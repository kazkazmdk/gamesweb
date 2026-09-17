# Agent rules

## CLOUD AGENT BUILD POLICY

Routine validation must happen locally.

Before completing work, use the repository's normal commands for:

- install (`pnpm install --frozen-lockfile`)
- lint (`pnpm lint`)
- typecheck (`pnpm typecheck`)
- tests (`pnpm test`)
- production build (`pnpm build`)
- local browser QA
- Playwright/screenshots if relevant (`pnpm test:e2e`)

Never use Vercel as a validation environment.

NEVER automatically execute:

```
vercel
vercel deploy
vercel --prod
npx vercel
pnpm vercel
npm exec vercel
```

Never call a Vercel Deploy Hook automatically.

Never create a Vercel deployment only to:

- check if code builds
- inspect design
- capture screenshots
- run QA
- test responsive behavior
- validate a small commit

A Vercel deployment must be intentional and explicitly requested.

### Branch policy

| Branch | Validation | Vercel |
| --- | --- | --- |
| `main` / `master` | Local + CI | Production deploy when the app is affected |
| `release/**` | Local | Preview only when the app is affected |
| `cursor/**` `claude/**` `codex/**` `agent/**` `qa/**` `design/**` `fix/**` | **Local only** | Skip (Ignored Build Step) |

See `docs/VERCEL_DEPLOY_POLICY.md`.
