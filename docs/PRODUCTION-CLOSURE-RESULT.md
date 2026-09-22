# Production closure result

Base branch: `cursor/final-product-seo-qa-032a`  
Base SHA: `d7a22e3`  
Work branch: `cursor/production-social-closure-032a`  
PR: `#22` → `cursor/final-product-seo-qa-032a`  
Not merged. No production deploy. No Vercel preview.

## Files changed

See `git diff --stat d7a22e3...HEAD`. Principal surfaces:

- `apps/web/lib/backend/{types,memory,supabase,social-arcade,competitive-run}.ts`
- `apps/web/app/api/{parties,challenges,inbox,rivals}/route.ts`
- `supabase/migrations/0007_social_arcade_rounds.sql`
- Client: `arcade-store`, `player-api`, `player-store`, `GameView`, party/challenge/inbox
- Tests: `tests/social-arcade.test.ts`, `tests/social-security.test.ts`
- E2E: `social`, `security-social`, `pause-retry`, `rendered-seo`, `neon-tracks`, `mobile-closure`
- Docs: this file, `PRODUCTION-CLOSURE-AUDIT.md`, `RENDERED-SEO-QA.md`, `FINAL-*-QA.md`

## P0 / P1

| Item | Before | After | Proof |
| --- | --- | --- | --- |
| Party / Challenge / Inbox process Maps | P0 open | **CLOSED** | `tests/social-arcade.test.ts` restart snapshot; two-context `e2e/social.spec.ts` |
| Client `trust: verified` / `score` / `rows[]` | P0 open | **CLOSED** | `e2e/security-social.spec.ts` 403; unit security |
| Party advances on first score | P0 open | **CLOSED** | host submit stays `playing` with **zero points**; both submits → `results` and `PARTY_POINTS`. See `docs/FINAL-CORRECTNESS-CLOSURE.md` |
| Challenge `/c/CODE` without payload | P0 open | **CLOSED** | social e2e |
| Inbox persist + read persist | P0 open | **CLOSED** | social e2e reload |
| Rendered HTML SEO QA | P0 open (source lint only) | **CLOSED** | `e2e/rendered-seo.spec.ts` → 65/65 pass |
| Pause on 8 games | P1 unproven | **CLOSED** | `e2e/pause-retry.spec.ts` 8 freeze + 8 retry |
| Neon 3-track first-read | P1 code-only | **CLOSED** with screenshot proof | `docs/qa-production-closure/neon/` |
| Rivals DB-derived | P1 local | **CORRECTED, not a live Supabase HTTP proof** | Memory `listRivals` replays `challengeOutcome` in `tests/backend-social-contract.test.ts`. `SupabaseBackend.listRivals` uses the same helper and explicit queries. CI does not boot PostgREST, so that client was not executed against Postgres |
| Crew / Daily / GP global pretence | honest local | kept local (P2) | copy unchanged |

## DB persistence

- Default backend remains Memory when no Gamesweb Supabase project is configured.
- Memory now hydrates/persists via `GAMESWEB_MEMORY_FILE` so a new process can reload parties/challenges/inbox/scores.
- `0006` + `0007` + `0008` are the SQL contract. Party round submit is the RPC `submit_party_round_attempt`. `SupabaseBackend` calls that RPC. CI proves the SQL function on Postgres 16, not the HTTP client. Not attached to an arbitrary Supabase project.

## Party state machine

`lobby` → host `start` (ready roster snapshotted) → `playing` → each member `submit-round` with own `runId` → `results` when roster complete → host `advance` → next `playing` or `done`.

Host only: start, advance. Member: join, ready, submit own run. Existing member can reconnect after refresh even mid-round.

## Challenge trust model

`GAME RUN → /api/score → StoredScore.verified → loadCompetitiveRun → competitiveTrust`.  
Browser cannot send `trust`, competitive `score`, `playerId`, or `challengerId`.  
`?p=` fallback forces `unverified`.

## Test matrix

The table below is not a single run. Two full GitHub workflows are green, with the same counts: unit **136 passed**, Playwright **91 passed / 9 skipped / 0 failed**, `pnpm test:db` **43 checks passed**.

- Behavior SHA `73d80e183bbc5a5cf8154db05c27a8fc6d282f02`, run [`35656016061`](https://github.com/kazkazmdk/gamesweb/actions/runs/35656016061) (`check` 106519776517, `database` 106519776248).
- Docs SHA `66aa7fda83003c7eb23a2c0eb37e0c051338dcd5`, run [`35656709498`](https://github.com/kazkazmdk/gamesweb/actions/runs/35656709498) (`check` 106522060229, `database` 106522059966).

`home-swarm-1440` and `home-neon-activities-1440` passed in both runs after the snapshots were replaced with the stable current render. They were not noise.

`remote-keyboard.spec.ts` is ignored by `playwright.config.ts`. The 9 skipped tests are the opted-out QA matrix specs.

## SEO

- Indexable URLs: **65**
- No new thin pages
- Rendered DOM report: `docs/qa-production-closure/rendered-seo.json`
- Max Jaccard on visible main text: 0.602 (velocity guide vs how-to)
- About / Privacy / Terms now have in-`<main>` links (were content orphans)

## Screenshots

- `docs/qa-production-closure/neon/contact-sheet.png`
- `docs/qa-production-closure/neon/contact-sheet-unlabeled.png`
- Per-track opening (page + canvas), mid and distinctive (canvas) at 1440. The CI screenshot timeout was the full page+canvas set of four moments.
- `docs/qa-production-closure/mobile/*`

Harbour / Hairpin / Ridge openings are distinguishable without reading captions: waterfront + sodium + containers vs tight green chevrons vs pulled-back guardrail / underpass.

## Production caveats

- Memory file snapshot is the honest cross-process proof until a Gamesweb Supabase project is provisioned and `0006`/`0007` applied.
- Guests are keyed by `anon:${gw_guest cookie}`, not the localStorage player id.
- Crew / Daily / Grand Prix remain device-local.
- No merge to `main`. No production deploy.
