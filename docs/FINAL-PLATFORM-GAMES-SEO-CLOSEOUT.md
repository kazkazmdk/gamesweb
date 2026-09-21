# Final platform + games + SEO closeout

Branch: `cursor/final-platform-games-seo-c08e`  
Base: `cursor/game-art-direction-rebuild-c08e` @ `c7e307c`  
Head at report time: `9054cdc` + QA capture commit  
PR: https://github.com/kazkazmdk/gamesweb/pull/19  
Not merged.

This report is evidence of what landed. It does **not** claim “SEO terminé”, guaranteed rankings, or an empty P0/P1 list.

---

## Games

P1 work in `52a3028`. Recaptures in `docs/qa-final-closeout/games/`. Compared to `docs/qa-game-art-direction/` (that folder was not overwritten).

| Game | What changed | Inspected stills | Still open |
| --- | --- | --- | --- |
| Territory Rush | Larger ownership fill, houses recede off owned color, capture wave | `territory-rush-fill-1440.png` — paint dominates (~40%) | **P2** toy houses remain on unclaimed tiles |
| Crowd Control | Saturated +N / ×N signs, pack compress/expand, `seekGate` | `gate-before` pack 10 vs `gate-after` pack 86 | **P2** signs are still bars; boulevard depth is thin |
| Neon Drift | Three authored roadside beats in the track kit | harbour / hairpin / ridge stills | **P1 remaining** — default camera still reads as the same dark asphalt |
| Swarm Protocol | Denser peak, more distinct silhouettes, `seedPeak` | open vs peak | Peak is clearly a different picture |
| Velocity vs Knockout | Rooftop kits vs toy-show props | `velocity-run-hvac` vs `knockout-circuit-factory` | Not interchangeable |
| Pocket / Sky | Targeted tabletop / horizon polish | open/peak | No redesign |

Debug: `seekGate`, `seedPeak`, `setCourse` on the game-core runtime.

Do not treat the previous art-direction report as proof. These stills are the proof for this pass.

---

## Platform

Checked at 1920 / 1440 / 1366 / 768 / 390 under `docs/qa-final-closeout/platform/`.

Home, Arcade, hubs, Results, Pause, Daily, GP, Challenges, Friends, Inbox, Party, Crew, Leaderboards, Profile self/public, Achievements, Settings. `/play` still redirects home.

- Home chrome unchanged: Games → `/`, Arcade → `/arcade`.
- Friends 1440: “Friends” / “No friends yet” / Copy link. No fake social rows.
- Hubs: one hero Play CTA. Visible SSR editorial (`GameHubEditorial`) with “The game”, run, controls, cluster links.

---

## SEO

| Item | Value |
| --- | --- |
| Indexable URLs | **65** |
| Sitemap (preview) | 65, `https://gamesweb-enmc90lrt-loan-s-projects2z.vercel.app/…`, no localhost, no `/arcade` or `/play` |
| Registry | `apps/web/content/` |
| Canonical game landing | `/games/[slug]` |
| Play | `noindex, follow` + hub canonical (verified on preview) |
| Arcade | `noindex, follow`, removed from sitemap |
| Collections | 7, each ≥3 real games |
| Sky strategy | omitted |
| Optional extras | Neon tracks+scoring, Velocity courses+scoring |
| JSON-LD | VideoGame+WebApplication, BreadcrumbList, ItemList, Article on guides. No ratings/FAQ/video |
| Origin | `publicOrigin()` / `requestOrigin()`: `NEXT_PUBLIC_APP_URL` → `VERCEL_URL` → request host |
| Taxonomy P0 | Pocket Striker preview title is `Pocket Striker — Free Online Physics Sports Game \| Gamesweb`. Zero “Survival Game” on that hub |

Query map: `docs/SEO-QUERY-MAP.md`  
Index matrix: `docs/SEO-INDEX-MATRIX.md`  
Audit: `docs/SEO-SURFACE-AUDIT.md`

Analytics: `seo_landing_view`, `game_hub_to_play`, `guide_to_play`, `collection_to_game`, `related_game_click`.

SEO stills: `docs/qa-final-closeout/seo/`. Catalog / guides / collections / Neon guide use Gamesweb chrome, not a bolted-on blog.

### Preview caveat

Vercel preview responses also send `x-robots-tag: noindex`. That is deployment protection, not the route matrix. Production indexing still has to be confirmed on the production host.

Play OG tags still inherit the root Gamesweb card (**P2** — page is noindex).

---

## Testing

| Check | Result |
| --- | --- |
| `pnpm typecheck` | pass |
| `pnpm lint` | pass (existing GameArt `<img>` warning) |
| `pnpm test` | **115** pass including 11 SEO quality tests |
| `pnpm build` | pass, 110 static pages, 43 cluster paths |
| Playwright smoke/platform/gameplay/progression/security/visual/seo | **pass** after origin + hub heading + sitemap path-parse fixes |
| `QA_MATRIX=1` final-closeout + game-art-direction + qa-matrix | **9 passed** (2.8m) |
| Vercel preview `017f6cf` | sitemap/robots/play/hub verified live |
| Vercel `a38ef15` | **ERROR** (lint on raw `<a href="/games/">`, fixed in `017f6cf`) |

CI on the latest push was subscribed; do not assume green until the dashboard says so.

---

## What Search Console still has to prove

- Whether Google discovers the `/games` graph
- Whether hubs stay canonical versus `/play`
- Whether the 65 URLs are indexed or ignored
- Click → play → second run (`guide_to_play`, `game_hub_to_play`)

No ranking forecast.
