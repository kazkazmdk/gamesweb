# SEO surface

Gamesweb’s first useful indexable surface. Not a ranking claim. No Search Console numbers are invented here.

## Totals

| Family | Indexable URLs |
| --- | ---: |
| Home | 1 |
| Catalog `/games` | 1 |
| Game hubs | 8 |
| Collection index | 1 |
| Collections | 11 |
| Guide index | 1 |
| Guide hubs | 8 |
| Deep guides | 51 |
| Learn index | 1 |
| Learn | 12 |
| About / Privacy / Terms | 3 |
| **Total** | **98** |

Quality gate: unique title, unique description, unique H1 (legal excepted), valid relations, inbound link, no query-param paths. Word count is not a criterion.

Rejected from the first tranche (honest overlap): `solo-games`, `keyboard-games`, `mobile-games`, `no-download-games`, `high-score-games`, `replayable-games`, `short-session-games` as collections. Session length lives on `/collections/quick-games` and `/learn/short-session-games`.

## URL families

| Family | Pattern | Index |
| --- | --- | --- |
| Home | `/` | yes |
| Catalog | `/games` | yes |
| Game hub | `/games/[slug]` | yes |
| Collections | `/collections`, `/collections/[slug]` | yes |
| Guides | `/guides`, `/guides/[game]`, `/guides/[game]/[article]` | yes |
| Learn | `/learn`, `/learn/[slug]` | yes |
| Legal | `/about`, `/privacy`, `/terms` | yes |
| Arcade / player | `/arcade`, `/play/*`, `/me`, `/settings`, `/friends`, `/inbox`, `/crew`, `/party/*`, `/achievements`, `/leaderboards`, `/daily`, `/grand-prix`, `/challenges`, `/c/*`, `/auth/*`, `/profile/*` | **noindex** |

## Sitemap

- Production URL: `{NEXT_PUBLIC_APP_URL}/sitemap.xml`
- Source: `indexableEntries()` in `apps/web/lib/seo-content/registry.ts`
- `lastModified` comes from each entry’s `updatedAt`
- Single sitemap. `shouldUseSitemapIndex()` is ready if the catalog ever crosses 40,000 URLs.

## Noindex policy

Control is `robots: noindex` metadata, not `Disallow` in `robots.ts`. Google can still fetch `/play/*` and read the tag.

Daily Arcade, Grand Prix, Challenges, and Leaderboards stay noindex: their HTML is player-state, not a public editorial page. No dated daily archives.

## Internal link model

```
HOME  →  /games  →  Collections / Game hubs / Guides / Learn
                      ↕                ↕           �  /games  →  Collections / Game hubs / Guides / Learn
                      ↕                ↕           ↕
                 Game hub ←→ Guide hub ←→ Deep guide
                      ↕
                 Collection ←→ Learn
```

- Game hub: 3–6 guides, 2–4 collections, related games
- Guide: game hub, guide hub, 2–4 related guides, 1–3 collections
- Collection: all relevant games, 2–5 guides, related collections
- Learn: playable examples, collection, guides

Links are `<Link href>` / `<a href>`. No SEO navigation via `onClick` only. Footer on product pages: Games, Collections, Guides, Learn, About, Privacy, Terms. Home keeps the launcher chrome; a visually hidden catalog nav remains crawlable.

## Content inventory

### Collections (11)

`quick-games`, `skill-games`, `arcade-games`, `score-attack-games`, `time-attack-games`, `competitive-browser-games`, `daily-challenge-games`, `precision-games`, `ghost-race-games`, `survival-and-arena`, `one-thumb-games`

### Guide hubs + deep guides (8 + 51)

| Game | Deep guides |
| --- | --- |
| Neon Drift | how-to-drift, scoring, live-vs-banked, combo, tracks, beginner-mistakes, ghost-pb |
| Velocity Run | beginner-movement, jump-timing, coyote-time, courses, medals, checkpoints, speedrun-basics, ghost-runs |
| Swarm Protocol | beginner-survival, upgrades, dash-iframes, enemy-types, core-boss, same-seed, high-score |
| Knockout Circuit | obstacles, timing, recovery, routes, common-mistakes, ghosts |
| Pocket Striker | aiming, rebounds, obstacles, scoring, precision, advanced |
| Territory Rush | how-territory-works, safe-loops, trail-risk, large-vs-small, opponents, percentage |
| Sky Stack | perfect-placement, streaks, timing, high-stack, atmosphere |
| Crowd Control | gates, multipliers, preservation, routes, clash, high-population |

### Learn (12)

`browser-games`, `arcade-games`, `drift-games`, `parkour-games`, `survivor-games`, `score-attack-games`, `time-attack-games`, `territory-games`, `stacking-games`, `crowd-runner-games`, `one-button-games`, `short-session-games`

## Structured data

- `WebSite` on the root layout
- `VideoGame` on game hubs (no reviews, no aggregateRating)
- `BreadcrumbList` on games / guides / collections / learn
- `ItemList` on catalog, collection index, collection pages, guide indexes
- `Article` on deep guides only

## Search Console — what to submit later

1. Production sitemap
2. Inspect `/`, `/games`, one hub, one collection, one guide, one learn page
3. Confirm noindex on `/arcade` and `/play/neon-drift`
4. Request indexing only for the public families above

Do not submit dated dailies or challenge codes.

## Metrics that matter later

- Indexed URL count vs 98
- Impressions / clicks / CTR / average position **by family**
- Query coverage
- Game hub → Play CTR
- Guide → Play CTR
- Collection → Game CTR

No current Search Console figures exist in this repo.

## Future scale

Adding a game should add: hub copy, compatible collections, a guide hub, related links, sitemap membership. **Nothing becomes indexable just because a manifest exists.** `indexable` stays explicit. Architecture can grow 100 → 500 → 1,000+ when the catalog justifies it.

## Analytics

Reuse `@gamesweb/analytics`. Events:

- `seo_landing_view`
- `seo_game_click`
- `seo_play_click`
- `seo_guide_to_game`
- `seo_collection_to_game`

Props: `source_page_type`, `source_slug`, `game_id` when relevant.
