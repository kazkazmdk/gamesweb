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

Recorded after the GitHub workflow on the final SHA.

```text
pnpm --filter @gamesweb/web typecheck
pnpm --filter @gamesweb/web lint
pnpm test
pnpm build
pnpm exec playwright test
```

## Vercel

Recorded after the deployment that matches the final SHA.

## Remaining

Filled only after GitHub CI + Vercel on the final SHA are verified.
