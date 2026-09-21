# Final SEO QA

Base: `cursor/final-platform-games-seo-c08e` @ `f24d352`  
Head: `cursor/final-product-seo-qa-032a`

## Matrix kept

- Indexable band 50–70. Registry still drives sitemap.
- No new topic URLs.
- `/play/*` noindex follow + hub canonical.
- `/arcade`, social, account: noindex follow.
- No fake FAQ / AggregateRating / VideoObject.
- Collections still ≥3 real games.

## Content QA

`apps/web/content/quality-report.ts` + `tests/seo.test.ts` "SEO content quality":

For each indexable URL: intent, title, H1, word count of registry+editorial body, unique tokens, nearest-page Jaccard, internal links, game entities, source, index/canonical, quality gate.

Gate fails on thin (<40 words of authored body) or near-duplicate (Jaccard ≥ 0.82 against another indexable page).

Collections gained `audience` + `pick` so they explain why the shelf exists and how to choose.

## Maillage

Hubs expose Guide / How to play / Controls / Strategy / Tracks|Courses|Scoring / Achievements / Catalog as designed chips.

## Play metadata

`apps/web/app/play/[slug]/layout.tsx` now sets Twitter card fields to the play title/description/hero instead of inheriting the root brand card.

## Production caveats

Canonicals still depend on `publicOrigin()`. Preview hosts must not be used as production canonicals. Challenge and party codes stay noindex.

## Count

`indexablePages().length` stays in the 50–70 band (registry 65). Sitemap parity holds in `tests/seo.test.ts` and `e2e/seo.spec.ts`. Noindex families: `/play/*`, `/arcade`, social/account (`/friends`, `/inbox`, `/party`, `/c/*`, `/me`, `/auth`, `/settings`).
