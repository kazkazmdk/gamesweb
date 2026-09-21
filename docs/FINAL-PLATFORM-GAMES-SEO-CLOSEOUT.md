# Final platform + games + SEO closeout

Branch: `cursor/final-platform-games-seo-c08e`  
Base: `cursor/game-art-direction-rebuild-c08e` @ `c7e307c`  
Not merged.

This report is evidence of what landed. It does **not** claim “SEO terminé”, guaranteed rankings, or an empty P0 list without the verification tables below.

---

## Games

P1s closed in `52a3028` against the admitted gaps in the art-direction rebuild:

| Game | What changed | Still open (P2) |
| --- | --- | --- |
| Territory Rush | Larger ownership fill, houses recede off owned color, capture wave | Toy dressing still visible on unclaimed tiles |
| Crowd Control | Huge +N / ×N / TAX signs, pack compress/expand | Boulevard depth can still read flat between gates |
| Neon Drift | Three authored roadside beats (service / touge / tunnel) | Default camera still crops some dressing |
| Swarm Protocol | Denser peak, more distinct silhouettes, `seedPeak` | Quality tiers still thin some debris |
| Velocity vs Knockout | Rooftop kits vs saturated toy-show props | Both remain daylight-adjacent at a glance if cropped tightly |
| Pocket / Sky | Targeted tabletop / horizon polish only | No redesign; felt/sky still simple by design |

Debug: `seekGate`, `seedPeak`, `setCourse` on `packages/game-core` runtime.

QA recapture target: `docs/qa-final-closeout/games/` compared to `docs/qa-game-art-direction/` (do not overwrite the latter). Status of those files is recorded after the capture pass.

---

## Platform

Audited surfaces (code + intended screenshot pass):

Home, Arcade, 8 hubs, Results, Pause, Daily, Grand Prix, Challenges, Friends, Inbox, Party, Crew, Leaderboards, Profile self, Achievements, Settings, Play index (`/play` still redirects home).

Hubs: one hero Play CTA. Editorial is now a visible SSR block (`GameHubEditorial`), not a collapsed `<details>`. Related games + collection links sit below the product chrome.

Social empty states were not filled with fake activity.

Home chrome is unchanged: desktop nav is still Games → `/` and Arcade → `/arcade`. Catalog crawl links are `sr-only` on Home plus footer links on other pages.

---

## SEO

| Item | Value |
| --- | --- |
| Indexable URLs | **65** |
| Sitemap | 65, registry-derived, no arcade/play/private |
| Registry | `apps/web/content/` |
| Canonical game landing | `/games/[slug]` |
| Play | `noindex, follow` + hub canonical |
| Arcade | `noindex, follow`, removed from sitemap |
| Collections | 7, each ≥3 real games |
| Sky strategy | omitted on purpose |
| Optional extras | Neon tracks+scoring, Velocity courses+scoring |
| JSON-LD | VideoGame+WebApplication, BreadcrumbList, ItemList, Article on guides. No ratings/FAQ/video. |
| Origin | `publicOrigin()`: `NEXT_PUBLIC_APP_URL` → `https://${VERCEL_URL}` → localhost |
| Taxonomy P0 | exhaustive slug/genre map; unknown genre throws; Sky/Knockout/Pocket/Territory/Crowd no longer become “Survival Game” |

Query map: `docs/SEO-QUERY-MAP.md`  
Index matrix: `docs/SEO-INDEX-MATRIX.md`  
Pre-change audit: `docs/SEO-SURFACE-AUDIT.md`

Analytics events: `seo_landing_view`, `game_hub_to_play`, `guide_to_play`, `collection_to_game`, `related_game_click`.

---

## Testing

| Check | Status |
| --- | --- |
| `pnpm test tests/seo.test.ts` | pass (10) — unique titles/descriptions/canonicals, 50–70 band, no private sitemap leak, taxonomy, origin |
| `pnpm typecheck` | pending this revision |
| `pnpm lint` | pending |
| `pnpm test` (full) | pending |
| `pnpm build` | pending |
| Playwright smoke/platform/gameplay/progression/security/visual | pending |
| `QA_MATRIX=1` qa-matrix + game-art-direction | pending |
| `e2e/seo.spec.ts` | pending |
| Vercel preview | pending — do not treat localhost metadata as production proof |

CI / preview SHA will be stamped after those commands run.

---

## What Search Console still has to prove

- Whether Google discovers the new `/games` graph
- Whether hubs stay canonical versus `/play`
- Whether the 65 URLs are indexed or ignored
- Click → play → second run conversion (`guide_to_play`, `game_hub_to_play`)

Do not read this document as a ranking forecast.
