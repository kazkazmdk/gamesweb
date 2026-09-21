# Game universe + SEO closeout

Branch: `cursor/game-universe-seo-closeout-c08e`  
Base: `cursor/game-art-direction-rebuild-c08e` @ `c7e307c`  
Not merged. No Vercel deploy for this pass.

This report is evidence of what landed. It does **not** claim “SEO terminé”, empty P0, or that every nameless still is instantly identifiable.

---

## Game worlds

Reference board: `docs/qa-game-universe-seo/REFERENCE-BOARD.md` (5+ refs per game, inspected, borrow / do-not-copy).

P1 code from the prior art closeout was cherry-picked and deepened:

| Game | Universe | What changed | Still open |
| --- | --- | --- | --- |
| Neon Drift | Haruna Service Line | Authored roadside families: service / touge / tunnel; wet pools; harbour/district/ridge | Default camera can still flatten zones — treat as remaining P1 until contact-nameless is inspected |
| Velocity Run | Coastal Service Roofs | Ivory/sand sky, HVAC / transit / ascent kits, `setCourse` | Mid-run kits need local stills to confirm 4 places |
| Swarm Protocol | Colony Deck 7 | Distinct families + `seedPeak` | Peak density vs Vampire Survivors is still our scale, not 300 enemies |
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

- Nameless contact sheet must be inspected after local capture. If two games still read as palette swaps, continue.
- Neon default-camera zone identity remains the hardest P1.
- Search Console, not this branch, decides indexation.
- No Vercel preview was used.
