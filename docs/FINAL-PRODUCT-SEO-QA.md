# Final product + SEO QA

Base branch: `cursor/final-product-seo-qa-032a`  
Base HEAD: `d7a22e3`  
Work branch: `cursor/production-social-closure-032a`  
PR target: `cursor/final-product-seo-qa-032a`  
Not merged. No production deploy. No Vercel preview.

## Source-of-truth matrix (after production closure)

| Feature | Current source of truth | Target | Guest | Auth | Cross-device | Multi-user |
| --- | --- | --- | --- | --- | --- | --- |
| Friends | `/api/friends` + DB/memory | keep | cannot send | real | yes | yes |
| Presence | `/api/presence` | keep | no heartbeat | real | yes | friends only |
| Scores / sessions | `/api/score` + trust | keep | cookie guest | profile | auth yes | leaderboards |
| Challenges | `BackendStore` via `runId` | keep | cookie actor | same + inbox | yes on backend | yes |
| Party | `BackendStore` host/round machine | keep | cookie actor | same | yes on backend | yes |
| Inbox | backend notifications | keep | cookie actor | persist | yes on backend | writer → owner |
| Rivals | derived from completed challenges | keep | cookie actor | same | yes on backend | derived |
| Crew | explicit local-preview house only | preview | empty until user starts one | same | no | no |
| Daily arcade / GP | local | keep local + honest copy | local | local | no | no |

`supabase/migrations/0006_social_arcade.sql` still defines tables that are **not provisioned**. Two Playwright contexts on one Next server share the process store. Multi-instance production still needs 0006.

`localStorage` `gw:arcade-social` remains cache / offline fallback. Create/join/attempt wait for the server when it answers.

## P0 closed

| Item | Fix |
| --- | --- |
| Party / challenge / inbox local-only | Server records by code; two contexts share roster / challenge / inbox |
| Silent `ensureCrew()` "Arcade Crew" | Removed. Empty state + explicit local house |

## P1 closed

| Item | Fix |
| --- | --- |
| Neon first-read | Per-track camera, widths, lighting, silhouettes, roadside families |
| Pause overlay lying | Pause stops Sky / Knockout / Pocket / Territory / Crowd sims |
| Results hierarchy | Result → score → PB → Retry primary |
| Hub cluster sr-only | Visible "Learn the game" on every hub |
| `/games` hidden | Desktop Catalog + home public catalog section |
| Challenge without `?p=` | GET `/api/challenges?code=` hydrates from store |
| Play Twitter OG | Play layouts set their own twitter card |

## P2 remaining

Territory still uses a board grid (houses are now faint context). Crowd boulevard depth improved but is still a 2.5D runner. Swarm peak not redesigned. Thin `/controls` pages remain useful for two-input games. Process store is not durable across multiple Node instances.

## Policy

No new thin SEO URLs. Indexable band stays 50–70 (target 65). No fake users, presence, or crew members.

## Tests run (this pass)

| Command | Result |
| --- | --- |
| `pnpm test` | 119 passed |
| `pnpm typecheck` | pass (cleared stale `.next/types` from another URL model) |
| `pnpm lint` | pass + existing `GameArt` img warning |
| `pnpm --filter @gamesweb/web build` | pass, 112 static pages |
| `e2e/social.spec.ts` | 2 passed (two-context party + challenge/inbox) |
| `e2e/smoke.spec.ts` | 12 passed |
| `e2e/seo.spec.ts` | 7 passed |
| `e2e/platform.spec.ts` | 16 passed |
| `e2e/gameplay.spec.ts` | 9 passed after Results CTA de-dupe |

Visual/mobile contact-sheet recapture was **not** run this pass. Compare against `docs/qa-final-closeout/`.

## Known limitations

- Social objects live in `globalThis.__gw_social_arcade` on one Next instance. Multi-instance production needs `0006_social_arcade.sql`.
- Crew is a local-preview house, not a shared team.
- Daily / Grand Prix remain local.
- No production deploy. No Vercel preview.
