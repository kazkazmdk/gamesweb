# Final SEO QA

Base: `cursor/final-product-seo-qa-032a` @ `d7a22e3`  
Head: `cursor/production-social-closure-032a`

## Counts

- Indexable URLs: **65** (band 50–70)
- No new topic / per-level / city / generated pages
- Sitemap omits `/play/*`, `/arcade`, `/friends`, `/inbox`, `/party/*`, `/c/*`

## Two QA systems

1. Source lint (kept): `apps/web/content/quality-report.ts` + `tests/seo.test.ts`
2. Rendered DOM (new): `e2e/rendered-seo.spec.ts` → `docs/RENDERED-SEO-QA.md` + `docs/qa-production-closure/rendered-seo.json`

Rendered gate uses `main` (or article) text, intent-specific word/link rules, and Jaccard on visible tokens. 65/65 pass. Max similarity 0.602.

## Claims provenance

`apps/web/content/claims.ts` points mechanical numbers at source files (`860`, `1.48`, `comboMax: 12`, Velocity `COURSES`, Pocket `l18`).

## Legal pages

About / Privacy / Terms now include in-main internal links so they are not content orphans.
