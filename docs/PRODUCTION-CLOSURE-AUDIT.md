# Production closure audit

Base branch: `cursor/final-product-seo-qa-032a`  
Base SHA: `d7a22e3`  
Work branch: `cursor/production-social-closure-032a`  
Not merged. No production deploy.

## Feature matrix

| FEATURE | CURRENT IMPLEMENTATION | CURRENT SOURCE OF TRUTH | SECURITY ISSUE | PERSISTENCE ISSUE | TARGET IMPLEMENTATION | P0/P1/P2 |
| --- | --- | --- | --- | --- | --- | --- |
| Scores / sessions | `/api/score` + `validateScore` + Memory/Supabase | `BackendStore.scores` / `public.scores` | Client score still sent, but trust is server-derived | Durable on Supabase; memory is process-local | Keep. Add `getScore` / `loadCompetitiveRun` | P0 |
| Friends / presence | `/api/friends`, `/api/presence` | BackendStore | Auth writes only | Durable on Supabase | Keep | — |
| Challenges | `globalThis.__gw_social_arcade` + POST body `score`/`trust` | Process Map | Client can send `trust: verified` and any score | Dies on isolate / restart | Create/attempt from `runId`; trust from stored score | P0 |
| Challenge share `?p=` | Optional hydrate into process store | URL payload | Payload could carry a claimed trust | Works offline only | Legacy fallback, force `unverified` | P0 |
| Party | Process Map; `score` action takes `rows[]` | Process Map | Any client can write other players' scores; first submit advances round | Isolate-local | Host start; per-member `runId` submit; round waits for roster | P0 |
| Inbox | Process array keyed by actor | Process Map | Mark-read is own-row only (good) | Isolate-local | Persist via backend notifications | P0 |
| Rivals | `arcade-store` localStorage | Browser | None | Device-local while UI implies history | Derive from completed challenges in backend | P1 |
| Crew | Local preview, explicit create | localStorage | None | Honest local | Keep preview. No backend this pass | P2 |
| Daily / GP | localStorage + honest copy | Browser | None | Device-local | Keep local | P2 |
| Pause / retry | Wired in 8 games | Client sim | — | — | E2E freeze/resume + retry on 8 | P1 |
| Neon first-read | Per-track camera/world in code | Code | — | No screenshot proof last pass | Capture 3 tracks, unlabeled sheet | P1 |
| SEO quality | Registry/editorial lint | Source files | — | Not rendered HTML | Keep lint + add Playwright DOM QA | P0 |

## Existing infrastructure to reuse

- `getIdentity()` / `actorId` (`userId ?? anon:${anonymousId}`)
- `getBackend()` → Memory or Supabase (never a third store)
- `validateScore` + `VerifiedStatus` on `/api/score`
- `policies` / `rateLimit`
- `supabase/migrations/0006_social_arcade.sql` plus a thin `0007` for round attempts / actor text columns
- Playwright two-context pattern in `e2e/social.spec.ts`

## Decision

Do **not** keep `__gw_social_arcade` as truth. Social objects move onto `BackendStore` (same memory singleton + optional file snapshot for restart tests; Supabase when that backend is already selected). `globalThis` remains only the existing MemoryBackend process cache, which already holds scores/friends.

## Implementation notes

- `loadCompetitiveRun` is the only competitive trust reader.
- Party actions: `create | join | ready | start | advance | submit-round`. `score` + `rows[]` returns 403.
- Challenge create/attempt require `runId`. Client `trust: verified`, `score`, `playerId`, `challengerId` return 403.
- Payload `?p=` hydrates with `trust` forced `unverified`.
- Inbox/rivals persist on the same backend. Crew / Daily / GP stay local.
