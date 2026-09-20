# Final games + platform + SEO closeout

Branch: `cursor/final-games-platform-seo-c08e`  
Base: `cursor/game-art-direction-rebuild-c08e` @ `c7e307c`  
Implementation commits: `1107dd2` (games P1), `3f90e9c` (SEO/platform), plus this docs/QA stamp.  
PR: https://github.com/kazkazmdk/gamesweb/pull/18  

Do not merge. Do not call this finished or “SEO complete”.

---

## What landed

### Games (P1 closeout, not a restart)

- **Territory** — `closeLoop` fills a large authored rectangle (~37% paint). Capture wave is a dominant pink field; houses drop off owned cells. Before/after: `docs/qa-final-closeout/territory-rush-before-1440.png` vs `territory-rush-after-1440.png`.
- **Crowd** — Gate signs show `+N` / `×N`. Pack 12 vs 86 is readable. `seekGate` lands just before the next gate.
- **Neon** — Denser curb blocks + sodium pools; three families in data (harbour / tunnel-service / touge). Tutorial key still `gw:neon-tutorial-v2`. Navy margins remain at default zoom.
- **Swarm** — Stronger density curve, mixed silhouettes, `seedPeak`. Still an icon field more than a survivor photograph.
- **Velocity** — Three kits photograph without titles: HVAC mint, transit steel-blue, ascent peach (`velocity-hvac|transit|ascent-1440.png`). `setCourse(id)`.
- **Knockout** — Warmer toy sky, foam hammer, inflatable gate, spectator ticks. Further from Velocity rooftops.
- **Pocket** — Table edge, rails, lamp, scoreboard, theme furniture.
- **Sky** — Dawn → high → dusk sky only. No extra verbs.

Debug additions in `packages/game-core`: `seekGate`, `seedPeak`, `setCourse`.

### Platform (Home untouched)

- Friends empty keeps the honest heading plus a short “Meanwhile” rail.
- Leaderboards empty names the selected game and how to set the first score.
- Achievements: locked vs unlocked labels.
- Crew empty copy.
- Footer (non-home): Games, Guides, Collections, legal.
- Home chrome still Games + Arcade. Catalog links on Home are `sr-only` so visual baselines stay green.

### SEO

- Explicit taxonomy. Sky Stack is stacking arcade, not Survival. Unknown slug throws.
- `/play/[slug]`: `noindex, follow`, canonical hub, off sitemap. Robots.txt still allows `/` so crawlers can see the tag.
- Public catalog `/games`. Arcade remains noindex.
- Quality gate + registry → sitemap.
- 78 indexable URLs (50–80 band). Zero orphans in the registry graph.
- GameHub: server public hero/editorial; client PB/board/friends.

Architecture: `apps/web/lib/content/*`.

---

## Remaining unresolved

### P0

None verified in this pass. Genre titles and play noindex are covered by `tests/seo.test.ts` and `e2e/seo.spec.ts`.  
**Deploy risk (not a code P0 on this branch):** if a Vercel preview has empty `NEXT_PUBLIC_APP_URL` and no `VERCEL_URL` at sitemap render, origins fall back to localhost. `publicOrigin()` now also reads `VERCEL_URL` and the request host.

### P1

- Crowd gates are signed tables, not yet huge saturated game-show objects.
- Neon default camera still shows large navy margins; three families are denser but not equally obvious in one still.
- Swarm peak is busier, not yet a readable power-fantasy photograph.
- Game hub shows Play twice (public hero + personal strip).
- Home → `/games` is crawlable but not visually obvious (on purpose, to keep Home).

### P2

- Pocket/Sky can still go deeper without clutter.
- Knockout vs Velocity remain daylight toys (shape language differs).
- Per-unit screenshots/OG are shared game JPGs.
- `/updates` not shipped.
- No mechanics-guide articles beyond how-to/strategy.
- `hideHud` still leaves some Velocity chrome.

---

## Tests

```
pnpm typecheck     # pass (after clearing stale .next types)
pnpm lint          # pass (existing GameArt <img> warning)
pnpm test          # 113 pass
pnpm build         # pass, 123 static/dynamic pages
playwright smoke/platform/gameplay/progression/security/visual/seo
                   # pass, no --update-snapshots
QA_MATRIX=1 qa-matrix + game-art-direction + qa-final-closeout
                   # pass
```

## Performance

Informational SEO routes first-load ~106 kB shared, page JS ~197 B. They do not boot Phaser.  
`/play/[slug]` first-load ~155 kB. No new npm dependencies.

## Screenshot / contact-sheet paths

- `docs/qa-final-closeout/` (62 captures + `contact-seo.html`)
- `docs/qa-game-art-direction/` recaptured by `e2e/game-art-direction.spec.ts`
- Art-direction 8-up sheets still in that folder

## Major files

- `apps/web/lib/content/*`, `apps/web/app/games/**`, `apps/web/app/collections/**`, `apps/web/app/guides/page.tsx`
- `apps/web/app/sitemap.ts`, `apps/web/lib/seo.ts`, `apps/web/lib/env.ts`
- `apps/web/components/game/GameHub.tsx`, `GamePublicContent.tsx`
- `games/*/src/scenes/PlayScene.ts` and listed systems
- `tests/seo.test.ts`, `e2e/seo.spec.ts`, `e2e/qa-final-closeout.spec.ts`
- `docs/seo/SEARCH-SURFACE-MAP.md`, `docs/SEO-CLOSEOUT.md`
