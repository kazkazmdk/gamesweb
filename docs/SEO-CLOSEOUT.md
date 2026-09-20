# SEO closeout

Branch: `cursor/final-games-platform-seo-c08e`  
Do not treat this as Search Console performance. Counts are from `apps/web/lib/content/registry.ts` at this SHA.

## Counts

| Metric | Value |
| --- | ---: |
| Indexable URLs | 78 |
| Sitemap URLs | 78 |
| Public entities in registry | 78 |
| Noindex app surfaces (policy) | play, arcade, settings, me, friends, inbox, party, crew, auth, challenges, invite codes, leaderboards, achievements, daily, grand-prix, profile |
| Orphan indexable | 0 |
| Duplicate titles | 0 |
| Duplicate canonicals | 0 |
| Missing H1 (indexable) | 0 |
| Missing OG (indexable) | 0 |

## Page types (indexable)

| Type | Count |
| --- | ---: |
| home | 1 |
| catalog `/games` | 1 |
| game hub | 8 |
| how-to-play | 8 |
| strategy | 7 (Sky Stack omitted) |
| Neon tracks | 3 |
| Velocity courses | 12 |
| Knockout maps | 8 |
| Pocket tables | 18 |
| collection index | 1 |
| collections | 7 |
| guides index | 1 |
| legal | 3 |

## Gate outcomes

Indexable pages passed unique intent / title / H1, first-party facts, ≥2 internal links, game-backed data, image+alt.  
Sky Stack `/strategy` is not generated (`NOINDEX` by absence).  
`/play/*` is `NOINDEX_APP`, `follow`, canonical → `/games/[slug]`.  
`/arcade` stays `NOINDEX` (product surface).  
`/updates` was not created (no real release history).

## Structured data

- Home / catalog / collections / guides: `WebSite` (root) + `ItemList` / `BreadcrumbList` where the visible list matches.
- Game hubs: `VideoGame` without ratings or player counts.
- No FAQ schema.

## Screenshots

`docs/qa-final-closeout/`:

- `games-catalog-1440.png` / `390`
- `game-hub-1440.png` / `390`
- `guides-1440.png`, `howto-1440.png`, `strategy-1440.png`
- `collection-1440.png`, `content-unit-1440.png`
- `contact-seo.html`

Hub editorial is visible below the fold (not inside `<details>`). Personal PB/board stays client-side.

## Remaining SEO weaknesses

- Home → catalog links are crawlable but `sr-only` so Home visual baselines stay intact.
- Content-unit OG images reuse game hero/tile/backdrop JPGs, not per-track photos.
- `/games` catalog is dynamically rendered (`headers` / origin), hubs and units are SSG.
- Local sitemap uses the request host; production still needs a real `NEXT_PUBLIC_APP_URL` or `VERCEL_URL`.
- No Search Console impressions/clicks to report.
