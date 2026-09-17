# Production quality pass

Branch `cursor/game-production-quality-c08e`. Superseded for classification by `docs/PRODUCTION-CLOSEOUT.md` on `cursor/game-production-closeout-c08e`. Art is original procedural / vector in-repo. No Poki or CrazyGames assets.

The READY / NEAR READY labels below are historical. Closeout uses SHIP CANDIDATE / POLISH REQUIRED / PROTOTYPE only.

## Method

- Before: start SHA `6253443` (social arcade expansion).
- After: this branch. Screenshots in `docs/qa/` (24 files: desktop / mobile 390 / result × 8).
- Automated: typecheck, lint, unit, build, 61 Playwright e2e.
- Manual: 10 short runs per game (80) via play + `finishRun` on desktop 1440 and mobile 390.

## Game by game

| Game | Before | After | What changed | Remaining weakness | Class |
| --- | --- | --- | --- | --- | --- |
| Neon Drift | Rounded-rect car on asphalt strip | Arcade body + lights + wheels, harbour / district / ridge props, 3-2-1-GO, finish gate, crash squash | Camera still spends most of the lap on empty asphalt; world dressing sits off the racing line | World density on-camera | NEAR READY |
| Velocity Run | Capsule runner, 3 abstract courses | Kinetic runner, 12 structured courses, spike / laser / bar / piston reads, GREEN/RED splits | Backgrounds are still silhouettes, not architecture you can inhabit | World density | NEAR READY |
| Swarm Protocol | Colored circles | Drone core, 8+ enemy silhouettes, 26 upgrades, core / fracture moods, Core + Warden | Early seconds still look sparse until enemies enter | Power-fantasy density at t=0 | NEAR READY |
| Sky Stack | Best of the set, still slab-on-gradient | Materials by altitude, rare events, louder perfect, TAP | First floors stay simple on purpose | High-altitude set dressing | READY |
| Knockout Circuit | Box + primitive obstacles | Stylized runner, 8 maps, readable spinners / beams | Courses still read as platformer bars | Scene architecture | NEAR READY |
| Pocket Striker | Green rectangle tech demo | 30 layouts, 3 themes, shiny ball, bumpers, DRAG → RELEASE | Open layouts can still look empty if you only see felt | Table furniture density | NEAR READY |
| Territory Rush | Cell-jump flood fill | Smoothed hover unit, named bots, pickups, 2 palettes | Grid is still visible; not a continuous paper-io world | Trail / flood spectacle | NEAR READY |
| Crowd Control | Dots through gates | Mini-characters, 15 authored routes, arches, boss, finish tower | Pack still looks small at 12; spectacle starts after first gates | Crowd mass at spawn | NEAR READY |

## Quality matrix

| | Art | Animation | Game feel | Content | Replay | Mobile | Performance |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Neon Drift | NEAR READY | NEAR READY | NEAR READY | NEAR READY | NEAR READY | NEAR READY | READY |
| Velocity Run | NEAR READY | NEAR READY | NEAR READY | NEAR READY | NEAR READY | NEAR READY | READY |
| Swarm Protocol | NEAR READY | NEAR READY | NEAR READY | NEAR READY | NEAR READY | NEAR READY | READY |
| Sky Stack | READY | READY | READY | NEAR READY | READY | READY | READY |
| Knockout Circuit | NEAR READY | NEAR READY | NEAR READY | NEAR READY | NEAR READY | NEAR READY | READY |
| Pocket Striker | NEAR READY | NEAR READY | NEAR READY | NEAR READY | NEAR READY | NEAR READY | READY |
| Territory Rush | NEAR READY | NEAR READY | NEAR READY | NEAR READY | NEAR READY | NEAR READY | READY |
| Crowd Control | NEAR READY | NEAR READY | NEAR READY | NEAR READY | NEAR READY | NEAR READY | READY |

No game is classified **OBVIOUS PROTOTYPE**. None except Sky Stack is a **READY** ship for a Poki homepage without another art pass.

## Content added

- Velocity: 12 courses (`levels/world-1.ts` … `world-3.ts`)
- Swarm: 26 upgrades, swarmling + warden, twin/rail/missile/blade family
- Knockout: 8 maps
- Pocket: 30 layouts
- Crowd: 15 authored levels (`levels/levels.ts`)

## Assets

All new art is code-drawn (SVG-less procedural). No downloaded images. Bundle impact is source only.

| Asset | Source | License | Size |
| --- | --- | --- | --- |
| `packages/game-core/src/production.ts` | original | repo | ~8 KB |
| Track / runner / enemy / crowd draw functions | original | repo | in game sources |
| `docs/qa/*.png` | local capture | repo | screenshots |

## Audio

Existing synth remains the identity. Added uses: countdown chime, rail vs square shots, bumper pings, pickup, crowd gate tones. No sampled banks.

## Performance (this pass)

- Desktop e2e samples: Neon ~29–40 fps in CI workers (headless), Velocity ~41, Swarm ~49, Sky ~48. Local production target 60.
- Quality tiers already drop particles / props on touch and when fps < 40.
- Initial game assets: no new texture downloads. Keep under 5 MB.

## Manual runs (80)

Each game: 10 runs. Mix of desktop 1440 and mobile 390. Actions: boot, first-control hint, 3–8 seconds of play, one death or finish, result overlay, retry where applicable.

| Game | Runs | First impression | Controls | Restart | Notes |
| --- | --- | --- | --- | --- | --- |
| Neon Drift | 10 | STEER / DRIFT readable | WASD + space drift | R / overlay Space after grace | Countdown skipped under `__GW_ALLOW_DEBUG__` |
| Velocity Run | 10 | MOVE / JUMP | AD + space | Death <400ms | Digit 1/2/3 still open worlds 1/2/3 |
| Swarm Protocol | 10 | Drone + orbs | WASD + dash | Overlay | Cards show synergy hint |
| Sky Stack | 10 | TAP | Space / tap | Grace 450ms | Perfect snap + pitch ladder |
| Knockout Circuit | 10 | Runner vs spinner | AD + jump | Ragdoll then reset | 8 maps via registry |
| Pocket Striker | 10 | DRAG → RELEASE | Pull vector | Overlay | Bumper bounce on themed tables |
| Territory Rush | 10 | Hover blade | WASD / stick | Overlay Space | Bots BRICK / NEEDLE / SWEEP |
| Crowd Control | 10 | SWIPE + arches | A/D | Overlay | 15 seeds / authored routes |

## Screenshots

`docs/qa/<slug>-desktop.png`  
`docs/qa/<slug>-mobile.png`  
`docs/qa/<slug>-result.png`

## Blockers

- **P0**: none for CI. E2E green.
- **P1**: Neon / Knockout / Pocket still fail the “Poki homepage screenshot” test on empty first seconds. Need on-camera scenery, not off-track props.
- **P2**: Hero/card JPGs on Home are still the previous capture set until `scripts/capture-gameplay-art.mjs` is re-run against a long-lived server.
- **P2**: Social backend still memory/localStorage. Out of scope.

## Honest answer

If these eight appeared on Poki tomorrow, Sky Stack could sit next to Stacktris-likes. The other seven would look like a coherent indie arcade, not AAA web hits, and a picky reviewer would still call several of them “clean prototypes.” That is NEAR READY, not marketing READY.
