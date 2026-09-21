# SEO surface audit

Branch: `cursor/final-platform-games-seo-c08e`  
Base: `cursor/game-art-direction-rebuild-c08e` @ `c7e307c`  
Audited before new public routes were added.

This is a code audit, not Search Console data.

---

## Current public surface

| URL | Robots | Sitemap | Notes |
| --- | --- | --- | --- |
| `/` | INDEX | yes | Product home |
| `/arcade` | NOINDEX (follow false) | **yes — leak** | Personalized command center in sitemap |
| `/about` `/privacy` `/terms` | INDEX | yes | Legal |
| `/games/[slug]` × 8 | INDEX | yes | Hubs; titles via `gameSeoTitle()` |
| `/play/[slug]` | NOINDEX follow **false** | no | No hub canonical |
| `/settings` `/me` `/friends` `/auth` `/challenges` `/leaderboards` `/achievements` | NOINDEX | no | OK |
| `/inbox` `/party` `/crew` `/daily` `/grand-prix` `/c/[code]` `/profile/*` `/play` | **no explicit robots** | no | Inherit index from root |

No `/games` catalog. No `/guides`. No `/collections`. No per-game clusters.

Sitemap today: home + arcade + 3 legal + 8 hubs = 13 URLs. One stale date (`MANIFEST_UPDATED = 2026-09-14`) on every row.

---

## P0 — `gameSeoTitle()` misclassification

`apps/web/lib/seo.ts`:

```
Driving → Drift Game
Platformer → Parkour Game
else → Survival Game
```

Verified against manifests:

| Game | Genre | Current title kind | Truthful? |
| --- | --- | --- | --- |
| Neon Drift | Driving | Drift Game | yes |
| Velocity Run | Platformer | Parkour Game | yes |
| Swarm Protocol | Survival | Survival Game | yes |
| Sky Stack | Arcade | **Survival Game** | no |
| Knockout Circuit | Obstacle | **Survival Game** | no |
| Pocket Striker | Physics | **Survival Game** | no |
| Territory Rush | Arena | **Survival Game** | no |
| Crowd Control | Runner | **Survival Game** | no |

Must be an exhaustive slug/genre map with no Survival fallback.

---

## Other verified issues

1. **Play policy** — `NOINDEX` sets `follow: false`. Spec wants `noindex, follow` and canonical `/games/[slug]`.
2. **Localhost origin** — `metadataBase`, sitemap, robots, JSON-LD all use `NEXT_PUBLIC_APP_URL ?? http://localhost:3000`. Empty env on Vercel emits localhost.
3. **Arcade in sitemap** while already noindex — sitemap/noindex inconsistency.
4. **JSON-LD** — `VideoGame` only; spec wants a co-type with `WebApplication` / software app. No ratings (good). Root layout is `WebApplication`.
5. **Hub copy** — how-to / controls / FAQ live in a collapsed `<details>` in `GameHub.tsx` (client). Search-critical copy is not visible SSR.
6. **Home graph** — primary nav “Games” points at `/`, not a catalog. Game rail uses buttons to `/play`, not hubs.
7. **Arcade** — already noindex; keep it as product surface. `/games` should become the public catalog.

---

## Decision (this pass)

- Fix taxonomy first.
- Keep `/arcade` noindex; remove it from sitemap.
- `/play/*` noindex, follow, hub canonical.
- Explicit noindex on remaining app surfaces.
- Build `/games`, `/guides`, `/collections`, per-game clusters from a typed registry.
- Target ~50–70 indexable URLs, not per-level doorways.

---

## Implemented

See `docs/SEO-INDEX-MATRIX.md` and `docs/SEO-QUERY-MAP.md`.

- `gameSeoTitle()` now uses an exhaustive slug/genre map and throws on unknown genres.
- `publicOrigin()` prefers `NEXT_PUBLIC_APP_URL`, then `https://${VERCEL_URL}`.
- Registry lives in `apps/web/content/`. Sitemap is registry-derived (65 URLs).
- Arcade removed from the sitemap. Play uses `NOINDEX_FOLLOW` + hub canonical.
- Inbox, party, crew, daily, grand-prix, profile, challenge-code, play index now set robots explicitly.
