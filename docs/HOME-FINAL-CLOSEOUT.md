# Home final closeout

## Base

`639fa8f1011e0c95a3e4c51d8a0a5603d7093a1d` (PR #12 art-direction closeout).  
This branch starts from `d6dfd76` on `cursor/home-art-direction-closeout-c08e`.

This pass does **not** rebuild the homepage. It closes remaining production blockers.

## Fixes

### Velocity

- Old: `velocity-run-01-transit` — architecture / spike, player ~5px on the ground.
- Selected: `docs/qa-home-final/candidates/velocity-run-selected.jpg` from `velocity-run-01-full.jpg` (course 4 jump).
- Why: player, flag, spike, platforms, and travel direction read without the H1. Scale 1.12.

### Swarm

- Old: `swarm-protocol-06-play` — giant orange core, reads as a boss fight.
- Selected: crop of existing `docs/qa-home-art/candidates/swarm-protocol-01-density.jpg`.
- Why: ship + several hostiles + orbs + wall. Boss is absent. Live recaptures at level 4 stayed sparse (enemies spawn far off-screen).

### Neon

- Kept `neon-drift-02-hairpin-drift`.
- Why: 2 new tighter crops were not objectively better. Car remains the subject on 1440.

### Knockout

- Same circuit frame, tighter crop + left sky pad.
- Why: runner was sitting in the title column. Runner, spinner, moon, and platforms stay in the first viewport.

### Crowd

- Kept pack / reactor / gates frame.
- Why: pack + `x2` / payoff already read. Other candidates were earlier and weaker.

### Grand Prix

- Replaced `flex-wrap` + `title.split(" ")[0]` with a 5-column `home-gp-route`.
- Full labels via `homeGameLabel` (`Sky Stack`, `Velocity Run`, …).
- Desktop: one route `R1 → R2 → R3 → R4 → Final`.
- Mobile `<768`: horizontal scroll, no accidental wrap.

### Avatar

- Glyph `n === 0` was a filled Play triangle (`M12 8 L22 16 L12 24 Z`), colliding with the Gamesweb mark.
- Replaced with a stroke-only double chevron. The other 7 glyphs are unchanged. Fill stays on glyph 1 only.

### Baselines

Home visual snapshots are updated only after reviewing Playwright `actual` frames. Threshold stays `maxDiffPixelRatio: 0.03`.

## Final asset choice

| Game | Old | Selected | Reason |
| --- | --- | --- | --- |
| Velocity Run | `velocity-run-01-transit.jpg` | `docs/qa-home-final/candidates/velocity-run-selected.jpg` | Jump + spike + architecture |
| Swarm Protocol | `swarm-protocol-06-play.jpg` | `swarm-protocol-01-density` crop | Swarm, not boss |
| Neon Drift | current hairpin | kept | New crops not better |
| Knockout Circuit | current skyworks | same frame, recentered | Runner readable |
| Crowd Control | current reactor / pack | kept | Pack + gates already there |

## CI

Local re-run on `ce3a7abd8b559851d6e89d7aa5c99e6a0f6743a9` (no `--update-snapshots`):

```text
pnpm --filter @gamesweb/web typecheck   # pass
pnpm --filter @gamesweb/web lint        # pass (existing GameArt <img> warning)
pnpm test                               # 99 passed
pnpm build                              # pass
pnpm exec playwright test               # 61 passed / 0 failed
```

Visual: 6 home snapshots were red on `639fa8f`. After this pass, Neon/Velocity/390/1920 already matched the closeout baselines; Swarm 1440 and Neon activities were reviewed and replaced. Re-run without `--update-snapshots` is green.

GitHub Actions on the same SHA (`https://github.com/kazkazmdk/gamesweb/actions/runs/35401027856`):

- `check` = success
- `database` = success

PR: https://github.com/kazkazmdk/gamesweb/pull/13

## Vercel

Deployment for `ce3a7abd8b559851d6e89d7aa5c99e6a0f6743a9`:

- id: `dpl_2znEJQttDvpaq6DV8CpxaVUbpC1b`
- url: https://gamesweb-kjqz4sfln-loan-s-projects2z.vercel.app/
- inspector: https://vercel.com/loan-s-projects2z/gamesweb/2znEJQttDvpaq6DV8CpxaVUbpC1b
- state: READY
- `GET /` → HTTP 200
- HTML confirms GameRail full titles, cup route `R1 → R2 → R3 → R4 → Final` with full names, double-chevron avatar glyph 0

## Remaining

- **P0:** none (GitHub `check` + `database` success, Vercel READY + HTTP 200 on this SHA, Velocity/Swarm/GP gates pass).
- **P1:** Swarm mobile hero is quieter than desktop (tile carries the swarm). Crowd pack stays tiny because of the camera. Velocity 390 hero is weaker than desktop (tile carries runner + spike). Neon car is track-led on 390.
- **P2:** Daily chain still uses first-word split (Daily was out of redesign scope). GP tile labels wrap to two lines on purpose.
