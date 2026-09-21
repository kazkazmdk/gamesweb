# Game universe + SEO closeout

Branch: `cursor/game-universe-seo-closeout-c08e`  
Base: `cursor/game-art-direction-rebuild-c08e` @ `c7e307c`  
Not merged. No Vercel deploy for this pass.

Local stills: `docs/qa-game-universe-seo/screenshots/` + `contact-open.png` / `contact-peak.png` / `contact-nameless.png`.

Inspected honestly (local stills after `bea6772` + follow-up capture):

- Territory peak: large pink ownership (~40% PAINT) — fill is now the picture.
- Crowd peak: huge ×2 / +N boards + pack mass — gates are no longer thin bars.
- Velocity vs Knockout: ivory roofs vs candy foam hammer / yellow lot — not the same sky family.
- Swarm peak: `seedPeak` now fields ~130 hosts + boss/elite + orbs. Still not a 300-enemy Vampire Survivors wall, but the nameless peak is no longer a sparse opening.
- Neon open: pulled-back default camera now keeps **service canopy, chevron corner, tunnel mouth** in one frame. The plaza is still the weakest of the three; roadside is no longer a single empty ribbon.

This report does **not** claim “SEO terminé”, empty P0, or that nameless contact is a perfect eight-way ID.

Vercel: `bd65580` did create a preview despite `git.deploymentEnabled: false`. Previews are now disabled on the Gamesweb project. Push `bea6772` did **not** spawn a new deployment.

---

## Game worlds

Reference board: `docs/qa-game-universe-seo/REFERENCE-BOARD.md` (5+ refs per game, inspected, borrow / do-not-copy).

P1 code from the prior art closeout was cherry-picked and deepened:

| Game | Universe | What changed | Still open |
| --- | --- | --- | --- |
| Neon Drift | Haruna Service Line | Opening camera pulled to 0.78; authored plaza / chevrons / tunnel mouth share the start frame | Plaza still smaller than the tunnel; keep iterating if a reviewer only reads “dark road” |
| Velocity Run | Coastal Service Roofs | Ivory/sand sky, HVAC / transit / ascent kits, `setCourse` | Mid-run kits need local stills to confirm 4 places |
| Swarm Protocol | Colony Deck 7 | Distinct families + denser `seedPeak` (boss, elite, orbs, orbital blades) | Peak is a packed infestation, not a 300-enemy survivor wall |
| Knockout Circuit | Toy Show Lot | Candy sky, foam props (hammer / inflate / disc) | Must stay visually off Velocity ivory |
| Pocket Striker | Rec-Room Table | Furniture / lamp / card | Targeted polish, not a redesign |
| Territory Rush | Paint First | Authored `closeLoop` map fill, houses recede on paint | Houses on unclaimed cells remain |
| Sky Stack | Ceramic Ascent | Height → peach / blue / gold / lavender | Keep simple |
| Crowd Control | Festival Boulevard | Huge +N/×N signs, `seekGate`, facade windows/banners, pack 10→86 | Signs must read in stills |

Debug: `seekGate`, `seedPeak`, `setCourse` on `__GW_DEBUG_CMD__`.

---

## Platform

Home chrome unchanged (Games / Arcade). sr-only catalog links added for crawl.

Friends empty: still “Friends” / “No friends yet”, copy tightened, no fake rows.  
Leaderboards / Results already had honest empties and game-aware zero copy.  
Daily / GP / Crew / Party / Inbox / Profile: noindex layouts; no fake social.

---

## SEO

| Item | Value |
| --- | --- |
| Indexable URLs | **36** (`indexablePages()`) |
| Catalog | `/games` |
| Canonical hubs | `/games/[slug]` |
| Guides | `/guides` + 8 how-to-play + 8 tips |
| Collections | 5, each ≥3 real games |
| Play | `noindex, follow` + hub canonical |
| Arcade / app / social | noindex, out of sitemap |
| Taxonomy | `gameSeoTitle()` exhaustive — Physics/Arcade/Obstacle/Arena/Runner no longer become Survival |
| JSON-LD | VideoGame + WebApplication, BreadcrumbList, ItemList. No ratings/FAQ/video schema |
| Origin | `requestOrigin()` / `publicOrigin()` |

Docs: `docs/SEO-INDEXATION-MAP.md`

---

## Tests

Local commands (no Vercel):

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test` (112 including 7 SEO quality)
- `pnpm build` then Playwright against localhost
- `QA_MATRIX=1` `e2e/game-universe.spec.ts` for stills / contact-opening / contact-peak / contact-nameless

---

## Honest gaps

- Nameless contact: eight worlds separate by palette and silhouette. Neon’s three places are in frame but the plaza can still lose to the road ribbon.
- Swarm peak is denser, not VS-scale.
- Search Console, not this branch, decides indexation.
- No Vercel QA. `vercel.json` alone did not stop Git previews; project `previewDeploymentsDisabled` did.
