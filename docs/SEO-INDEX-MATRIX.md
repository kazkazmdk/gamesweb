# SEO index matrix

Registry: `apps/web/content/registry.ts`  
Helpers: `apps/web/lib/seo.ts` (`INDEX`, `NOINDEX_FOLLOW`)  
Sitemap: built only from `indexablePages()`.

Decision date: 2026-09-20.

---

## INDEX (self-canonical)

| Family | URLs | Notes |
| --- | --- | --- |
| Home | `/` | Product |
| Catalog | `/games` | Public discovery. Not `/arcade`. |
| Guides index | `/guides` | |
| Collections index | `/collections` | |
| Collections | 7 × `/collections/[slug]` | Each has ≥3 real games |
| Game hubs | 8 × `/games/[slug]` | Canonical landing per game |
| Guides | 8 × `/games/[slug]/guide` | |
| How to play | 8 × `/games/[slug]/how-to-play` | |
| Controls | 8 × `/games/[slug]/controls` | |
| Strategy | 7 × `/games/[slug]/strategy` | Sky omitted |
| Achievements | 8 × `/games/[slug]/achievements` | Public trophy defs, not `/achievements` app |
| Neon extras | `/games/neon-drift/tracks`, `/scoring` | |
| Velocity extras | `/games/velocity-run/courses`, `/scoring` | |
| Legal | `/about`, `/privacy`, `/terms` | |

**Indexable count: 65.** Sitemap must match.

`/arcade` is **not** indexed. It is a logged/product command center (client widgets, personalization). `/games` is the public catalog. This is an explicit product split, not a duplicate.

---

## NOINDEX, FOLLOW

Crawlers must be able to fetch the document to see robots. These are not in `robots.txt` disallows (except `/api/`).

| Family | Robots | Canonical | Why |
| --- | --- | --- | --- |
| `/play`, `/play/[slug]` | noindex, follow | `/games/[slug]` | Transient Phaser session |
| `/arcade` | noindex, follow | self | Personalized command center |
| `/auth/*` | noindex, follow | self | Account |
| `/me` | noindex, follow | self | Signed-in profile |
| `/settings` | noindex, follow | self | Preferences |
| `/friends` | noindex, follow | self | Empty/social graph |
| `/inbox` | noindex, follow | self | Private messages |
| `/party`, `/party/[code]` | noindex, follow | self | Session codes |
| `/crew` | noindex, follow | self | Crew state |
| `/challenges` | noindex, follow | self | Personalized missions |
| `/leaderboards` | noindex, follow | self | Client-fetched / sparse honest board |
| `/achievements` | noindex, follow | self | Player trophy shelf (defs live on game pages) |
| `/daily` | noindex, follow | self | UTC-day playlist |
| `/grand-prix` | noindex, follow | self | Rotating event |
| `/profile/[username]` | noindex, follow | self | User-specific |
| `/c/[code]` | noindex, follow | self | Challenge invite + `?p=` payload |

Query variants (`?daily=1`, `?seed=`, party/campaign params) inherit the route policy. They must not appear in the sitemap.

---

## robots.txt

```
User-Agent: *
Allow: /
Disallow: /api/
Sitemap: {publicOrigin}/sitemap.xml
```

No global disallow. API blocked. noindex routes remain crawlable.

---

## Origin

`publicOrigin()` / `appUrl()`:

1. `NEXT_PUBLIC_APP_URL` if set
2. else `https://${VERCEL_URL}`
3. else `http://localhost:3000`

Production/preview metadata and sitemap must not emit localhost when Vercel provides a host.

---

## Structured data

| Surface | Types | Forbidden |
| --- | --- | --- |
| Home / root layout | `WebApplication` | ratings |
| Game hub | `VideoGame` + `WebApplication` graph, `BreadcrumbList` | AggregateRating, FAQPage, VideoObject |
| Guide/cluster | `Article` + `BreadcrumbList` | FAQPage unless we add real FAQ schema (we do not) |
| Collections | `ItemList` + `BreadcrumbList` | fake reviews |

---

## Count check

If `indexablePages().length` leaves 50–70 and `sitemap.xml` URL count matches, the matrix is in spec. Tests in `tests/seo.test.ts` and `e2e/seo.spec.ts` fail the build otherwise.
