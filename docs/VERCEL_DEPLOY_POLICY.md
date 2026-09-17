# Vercel deploy policy

Vercel is the production host. It is not the routine development or QA environment.

Canonical workflow:

1. Agent works locally.
2. `pnpm install --frozen-lockfile`
3. `pnpm lint`
4. `pnpm typecheck`
5. `pnpm test`
6. `pnpm build`
7. Local browser / Playwright / screenshots
8. Commit and push
9. **No Vercel deployment** on routine agent branches

Intentional release:

- merge or push to `main` / `master`
- **one** Vercel production build for each **affected** app

Override (rare, explicit): set `VERCEL_FORCE_BUILD=1` on the Vercel project or deploy hook. Do not set this from agent scripts.

## Exit-code semantics

`scripts/vercel-should-build.mjs` is the Ignored Build Step.

| Exit | Meaning |
| --- | --- |
| `0` | SKIP the Vercel build |
| `1` | CONTINUE the Vercel build |

This matches [Vercel `ignoreCommand`](https://vercel.com/docs/project-configuration/vercel-json): exiting `0` ignores the build; exiting `1` continues it.

Comparison order:

1. Identify the Vercel project / app (`VERCEL_PROJECT_ID`, `VERCEL_PROJECT_NAME`, or `VERCEL_APP_ID`).
2. Agent preview branches skip immediately (local QA only).
3. Prefer `VERCEL_GIT_PREVIOUS_SHA` + `VERCEL_GIT_COMMIT_SHA`.
4. Inspect changed files.
5. Continue only if **this** app is affected.
6. If the previous SHA is missing or not in the clone, **fail safe and CONTINUE** on production / release. Never skip a necessary production deploy because Git history was shallow.

Do not rely on `HEAD^` or `HEAD~1`. Merge commits, first deploys, and batched agent pushes make that unsafe.

## Vercel projects linked to this repository

This repository currently has **one** deployable app and **one** Git-connected Vercel project.

| Field | Value |
| --- | --- |
| Project name | `gamesweb` |
| Project ID | `prj_6myfSW55ydOMzlVGnsicj2jCAgVk` |
| Team | Loan's projects (`team_208EST8g8YgAtAWhqCd7ZNRe`) |
| Git | `kazkazmdk/gamesweb` |
| App | `@gamesweb/web` |
| Root directory | repository root |
| Production branch | `main` (also recognized: `master`) |
| Framework / build | Next.js via root `vercel.json`: `pnpm --filter @gamesweb/web build` |
| Ignored Build Step | `node scripts/vercel-should-build.mjs` (`ignoreCommand` in `vercel.json`) |

`apps/web/vercel.json` exists for a Root Directory of `apps/web` and uses `node ../../scripts/vercel-should-build.mjs`. The live project uses the **repository root**.

`apps/tmp/**` is leftover local tooling, not a Vercel app.

`import-select` (`prj_mt9c2n8QwUcLpzXGS1rz7C63V09J`) is a different Vercel project and is not part of this repository's Git integration.

## Paths that trigger a `gamesweb` / `web` build

On `main` / `master` / `release/**` (and on any branch if `VERCEL_FORCE_BUILD=1`):

- `apps/web/**`
- `games/**` (every Phaser package is a workspace dependency of `@gamesweb/web`)
- `packages/analytics/**`
- `packages/config/**`
- `packages/database/**`
- `packages/game-core/**`
- `packages/game-sdk/**`
- `packages/ui/**`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `vercel.json`
- `apps/web/vercel.json`
- `.npmrc`
- `scripts/vercel-should-build.mjs`

A shared package rebuilds **only** apps that list it as a dependency. Today that is only `web`. The script is structured so a future second app does not rebuild when an unrelated package changes.

## Paths that do not trigger a build

When those are the **only** changes:

- `docs/**`
- `*.md` (including `AGENTS.md`, `README.md`)
- `e2e/**`
- `tests/**`
- `.github/**`
- `supabase/**` (SQL migrations are not part of the Next.js Vercel artifact)
- `apps/tmp/**`
- Playwright / Vitest config at the repo root

Documentation is not part of the deployed product.

## Agent branch policy

These refs are **local validation only**. The ignore script skips the Vercel build even if app sources changed:

- `cursor/**`
- `claude/**`
- `codex/**`
- `agent/**`
- `qa/**`
- `design/**`
- `fix/**`

`release/**` is allowed to preview when the app is affected.

`vercel.json` `git.deploymentEnabled` only accepts **exact** branch names, not globs. It is **not** used here, because setting `"deploymentEnabled": false` would also block `main`. Agent isolation is done in `ignoreCommand`.

## Canonical production deployment path

**One path only:** GitHub Git integration → Vercel project `gamesweb` → production when `main` is updated and `web` is affected.

There is no second deployer:

- `.github/workflows/ci.yml` runs install / lint / typecheck / tests / `pnpm build` / Playwright. It does **not** call `vercel`, `vercel deploy`, or a Deploy Hook.
- Root `package.json` has no `vercel` / `vercel deploy` / `vercel --prod` script. `pnpm vercel-should-build` only runs the ignore decision locally.
- No `VERCEL_DEPLOY_HOOK`, no `api.vercel.com` deploy calls, no curl deploy hooks in this repository.

Do not add a GitHub Action that deploys the same commit Vercel already received from Git.

## Duplicate deployment audit

| Mechanism | Present? | Action |
| --- | --- | --- |
| GitHub → Vercel Git Integration | Yes (`gamesweb`) | Canonical path |
| `vercel` / `vercel deploy` scripts | No | Keep absent |
| Deploy Hooks / `api.vercel.com` | No | Keep absent |
| GitHub Actions → Vercel | No | Keep absent |
| Remote Playwright helper URLs | Example preview hosts only | Not a deployer |

## Dashboard settings that still require a human

The repository cannot flip every Vercel project toggle. After merge, confirm in the dashboard (do not claim these are already saved):

1. **Project → Settings → Git → Ignored Build Step**  
   Command: `node scripts/vercel-should-build.mjs`  
   `vercel.json` `ignoreCommand` should apply this automatically. If the dashboard still shows the default `git diff HEAD^` command, replace it with the script above.

2. **Project → Settings → Git → Production Branch**  
   Value: `main`

3. **Do not** set Git → Disabled for all deployments.

4. **Do not** create Deploy Hooks for agent QA.

5. Optional spend guard: **Team → Settings → Billing / Spend Management** — not required for this policy, not changed from the repo.

`VERCEL_GIT_PREVIOUS_SHA` is only injected when an Ignored Build Step is configured. That is why step 1 matters.

## Local commands agents must still run

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Local production build = good.  
Vercel build on every agent commit = bad.
