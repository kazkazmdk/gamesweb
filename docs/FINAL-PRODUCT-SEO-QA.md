# Final product + SEO QA

Base branch: `cursor/final-platform-games-seo-c08e`  
Base HEAD: `f24d352` (documented closeout SHA `8377639` plus later CI/Vercel-policy commits)  
Work branch: `cursor/final-product-seo-qa-032a`  
PR target: `cursor/final-platform-games-seo-c08e`  
Not merged. No production deploy. No Vercel preview.

## Source-of-truth matrix (after this pass)

| Feature | Current source of truth | Target | Guest | Auth | Cross-device | Multi-user |
| --- | --- | --- | --- | --- | --- | --- |
| Friends | `/api/friends` + DB/memory | keep | cannot send | real | yes | yes |
| Presence | `/api/presence` | keep | no heartbeat | real | yes | friends only |
| Scores / sessions | `/api/score` + trust | keep | cookie guest | profile | auth yes | leaderboards |
| Challenges | process store `globalThis.__gw_social_arcade` + `/api/challenges` | same until 0006 | play via code | same + inbox | same instance | yes on one instance |
| Party | same process store + `/api/parties` | same until 0006 | cookie identity | same | same instance | yes on one instance |
| Inbox | `/api/inbox` keyed by actor | same until 0006 | cookie identity | persist | same instance | writer → reader |
| Rivals | local ledger of challenge outcomes | cache | local | local | no | derived |
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
