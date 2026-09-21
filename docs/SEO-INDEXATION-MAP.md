# SEO indexation map

Branch: `cursor/game-universe-seo-closeout-c08e`

Source of truth: `apps/web/content/registry.ts` → `indexablePages()`.

## INDEX

| Path | Why |
| --- | --- |
| `/` | Home / product |
| `/games` | Public catalog |
| `/games/[slug]` | Canonical game landing (×8) |
| `/guides` | Editorial index |
| `/guides/[slug]/how-to-play` | Real mechanics (×8) |
| `/guides/[slug]/tips` | Game-specific strategy (×8) |
| `/collections` | Collection index |
| `/collections/[slug]` | 5 justified groupings |
| `/about` `/privacy` `/terms` | Legal / about |

Count: **36** indexable URLs.

## NOINDEX

| Path | Robots |
| --- | --- |
| `/play/[slug]` | `noindex, follow` + canonical `/games/[slug]` |
| `/arcade` | noindex (product widget surface) |
| `/daily` `/grand-prix` | noindex (app state) |
| `/friends` `/crew` `/party` `/inbox` `/me` `/settings` | noindex |
| `/leaderboards` `/challenges` `/achievements` | noindex (user-state UI) |
| `/profile/[username]` `/c/[code]` `/auth/*` | noindex |

Arcade is not in the sitemap. Play is not in the sitemap.

Preview hosts may still send `x-robots-tag: noindex` as deployment protection. That is not this matrix.
