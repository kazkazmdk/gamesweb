# Search surface map

Architecture only. No keyword-volume claims.

Source of truth: `apps/web/lib/content/` (taxonomy, quality gate, registry).  
Sitemap: `apps/web/app/sitemap.ts` reads `sitemapEntries()` — indexable canonicals only.

| URL pattern | Type | Primary intent | Supporting intent | Source of truth | Indexable | Reason | Parents | Unique value |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | home | Play a Gamesweb title now | Discover the eight games | Home stage + manifests | yes | Product home | — | Live stage, not the catalog |
| `/games` | catalog | Browse all first-party games | Session / input / social truth | `GAME_MANIFESTS` | yes | Public catalog | Home | SSR list, distinct from `/arcade` |
| `/games/[slug]` | game-hub | Land on one game | How it scores, modes, guides | Manifest + `games.ts` | yes | Canonical hub | Home, catalog | Public editorial + client PB/board |
| `/games/[slug]/how-to-play` | how-to-play | Learn controls and first 30s | Fail states, FAQ | Manifest howTo/controls + authored | yes | Distinct how-to | Hub, `/guides` | Mechanics, not marketing |
| `/games/[slug]/strategy` | strategy | Intermediate decisions | Routes / builds / gates | Authored from code | yes if depth | No Sky Stack page | Hub, how-to | Sky Stack omitted (one verb) |
| `/games/neon-drift/tracks/[track]` | track | One Neon circuit | Boosts, width, family | `TRACKS` | yes (3) | Authored tracks | Hub, strategy | Harbour / Hairpin / Ridge |
| `/games/velocity-run/courses/[course]` | course | One rooftop course | Medals, world kit | `COURSES` | yes (12) | 12 distinct courses | Hub, strategy | HVAC / transit / ascent |
| `/games/knockout-circuit/maps/[map]` | map | One obstacle map | Hazards, env | `MAPS` | yes (8) | 8 distinct maps | Hub, strategy | Factory / Skyworks / Signal |
| `/games/pocket-striker/tables/[table]` | table | One physics table | Par, gadgets | `LAYOUTS` | yes (18) | Distinct layouts | Hub, strategy | Workshop / Garden / Arcade Lab |
| `/collections` | collection-index | Browse play intents | Compare session/input | `collections.ts` | yes | Directory | Home, catalog | Not a blog index |
| `/collections/[slug]` | collection | Cross-game intent (≥3) | Honest capability labels | Manifests + authored why | yes (7) | Useful lists only | Catalog, hubs | No live-multiplayer lie |
| `/guides` | guides-index | Find first-party guides | Jump to how-to/strategy | `guides.ts` | yes | Directory | Home, catalog | No third-party topics |
| `/about` `/privacy` `/terms` | legal | Policy / about | — | Existing pages | yes | Support | Footer, home | Not game content |
| `/play/[slug]` | app | Runtime | — | Game boot | **no** `NOINDEX_APP` | Runtime | Hub CTA | Canonical = hub |
| `/arcade` | app | Immersive product | — | Arcade UI | **no** | Duplicates catalog | Nav | Product surface |
| `/settings` `/me` `/friends` `/inbox` `/party/*` `/crew` `/auth` `/c/*` | app | Private / personalized | — | Player state | **no** | Private | — | Off sitemap |
| `/leaderboards` `/achievements` `/daily` `/grand-prix` `/profile/*` | app | Personalized product | — | Player / boards | **no** | Product, not search | — | Off sitemap |
| `/updates` | — | — | — | — | not created | No fabricated history | — | Framework deferred |

## Gate

Every generated page is `INDEXABLE | NOINDEX_THIN | NOINDEX_DUPLICATE | NOINDEX_APP | NOINDEX_PLACEHOLDER`.  
A route existing is not enough.

## Graph

Home → Games → Game hub → How-to / Strategy → Track / Course / Map / Table.  
Hubs also link related games and collections. Content units link parent + siblings + strategy.  
Zero orphan indexable URLs (registry graph test).
