# Vercel deploy policy

Gamesweb has one Next.js app (`apps/web`) and one Vercel project. Agent work must not create preview deployments.

Canonical path:

```text
local install → lint → typecheck → tests → production build → local QA
→ user-requested merge/push to main
→ GitHub Git integration (if enabled)
```

There is no agent path through Vercel.

## Git deployments

`vercel.json` sets `git.deploymentEnabled` to `false`. That file alone did not stop Git preview builds on this project, so preview deployments are also disabled on the Vercel project (`previewDeploymentsDisabled`) and `ignoreCommand` skips agent branches.

`ignoreCommand` still skips agent branches if Git deploys are turned back on:

```bash
node scripts/vercel-should-build.mjs
```

| Exit | Meaning |
| --- | --- |
| `0` | Skip the Vercel build |
| `1` | Continue / build |

Skipped prefixes: `cursor/`, `claude/`, `codex/`, `agent/`, `qa/`, `design/`, `fix/`.

A commit message containing `[skip vercel]` is also skipped.

`FORCE_VERCEL_BUILD=1` is the only override, and only when a human asked for a deploy.

## Agent rules

- Do not push `cursor/**` (or other agent prefixes) to get a preview.
- Do not run the Vercel CLI.
- Do not call Deploy Hooks or `api.vercel.com` deployments.
- Docs-only and test-only commits must never be an excuse to deploy.

## Local validation

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```
