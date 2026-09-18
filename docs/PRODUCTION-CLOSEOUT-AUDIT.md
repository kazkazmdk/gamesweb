# Production closeout — truth audit

Source of truth: code on `cursor/game-production-closeout-c08e` at parent HEAD `82309c1`.  
Not trusted: `docs/PRODUCTION-QUALITY.md`, PR #9 claims, upgrade names, layout counts.

Verdict key:

- **REAL** — a player can see and feel the feature without reading its name.
- **PARTIAL** — some unique data or draw exists, but gameplay/identity is incomplete.
- **FAKE** — exists in data / UI / docs only, or is a renamed clone.

| Game | Claimed feature | Actual implementation | Real / Partial / Fake | Action required |
| --- | --- | --- | --- | --- |
| Swarm Protocol | 26 upgrades | 22 apply measurable stats or fire-path changes. `missile` / `blade` / `plasma` only increment counters. `drone` increments `orbital` and draws the same orbit circles. | PARTIAL (pool) + FAKE (missile, blade, plasma, drone identity) | Implement missile volley, blade orbitals, plasma ring, autonomous drones. Keep only upgrades with gameplay+visual. |
| Swarm Protocol | Missile Burst | `Build.missile` unused in `fire()`, `stepBullets()`, draw. No projectile, no cooldown, no AoE. | FAKE | Real timed volley, homing-limited missiles, explosion, cooldown. |
| Swarm Protocol | Orbital Blade | `Build.blade` unused. Orbitals always `fillCircle` at r=48. | FAKE | Blade-shaped orbiters, longer radius by level, melee arc, rotation, impact. |
| Swarm Protocol | Plasma Nova | `Build.plasma` unused. Pulse radius uses `pulse` only. Nova uses `nova` only. | FAKE | Larger plasma shockwave, distinct ring, burn / multi-hit. |
| Swarm Protocol | Drone Swarm | `applyUpgrade("drone")` does `orbital += 1`. Draw: same 6px circles. | FAKE | Autonomous visible drones that follow and fire / intercept. |
| Swarm Protocol | Twin / Rail / Spread | Twin side bolts in `fire()`. Rail speed/life/damage + sawtooth. Spread widens shot fan. | REAL | Keep. Make rail shot visually longer/thinner. |
| Swarm Protocol | Pulse / Nova / Orbital | Pulse ticks damage. Nova on hit. Orbitals damage at r=48. | REAL (behavior) / PARTIAL (visual) | Keep behavior. Blade/plasma must differentiate look. |
| Swarm Protocol | Shield-wall / lifesteal / coolant / focus | Shield-wall +22 maxHp. Lifesteal on kill. Coolant `dashCd *= 0.9`. Focus damage+ / fireRate-. | REAL | Keep. Coolant is a weaker Afterimage, not a placebo. |
| Swarm Protocol | Protocol Core + Warden | Different HP/size/color. Same `stepBoss` (charge → 8-way spit → chase). Same kill text `CORE DOWN`. | PARTIAL | Three unique attacks each. Warden phase 2 below 40% HP. Distinct death. |
| Swarm Protocol | 2 arenas | `fracture` flag swaps backdrop palette + 2 triangles vs 2 columns. No collision landmarks. | FAKE | CORE CHAMBER vs FRACTURE ZONE with architecture and navigation. |
| Swarm Protocol | Boss end | hitStop 180, flash, `CORE DOWN` floater, then `die()`. No arena reaction, no unique death draw. | PARTIAL | Hit-stop + arena response + death visual + victory beat. |
| Swarm Protocol | Input / mobile / audio | WASD + dash, touch stick + dash button. Synth square/saw. No missile/drone voice. | REAL / PARTIAL | Add weapon-specific audio. Keep mobile stick. |
| Pocket Striker | 30 layouts | 12 authored + `Array.from({ length: 18 })` filler (`l13`–`l30`). Same frame + 1–2 offset boxes. | FAKE (18) / PARTIAL (12) | Delete filler. Author 18 tables, 6 per theme. |
| Pocket Striker | Open Green | Frame + two posts + one bumper. Large empty felt. | PARTIAL | First table must sell the game (bank / bumper / props). |
| Pocket Striker | Themes workshop / garden / arcade | Palette only (felt + rail + bumper color). Same wall draw. | PARTIAL | Theme furniture: metal/bolts vs hedges vs neon. |
| Pocket Striker | movingBlockers / rotators / portals / forcePads / breakables / gates | Not in `Layout` type. Bounce = walls + bumpers only. | FAKE (absent) | Extend model + simulate each. |
| Pocket Striker | Input / result | Drag-release, predict dots, par scoring. | REAL | Keep. |
| Territory Rush | 2 arenas | `(seed.length % 2)` swaps 5 colors. Same 48×28 empty grid. | FAKE | CIRCUIT FLOOR vs SHATTER FIELD with blocked / void cells. |
| Territory Rush | Continuous territory | `fillRect` per cell. Outline per edge. Grid is the art. | FAKE (as product art) | Contour / merged surface. Grid stays simulation only. |
| Territory Rush | Trail ribbon | `fillRect` per trail cell. | FAKE | Smooth polyline ribbon + cut pulse. |
| Territory Rush | Capture spectacle | Instant recolor + white cell flash. | PARTIAL | Flood wave, % popup, punch, sound. |
| Territory Rush | BRICK / NEEDLE / SWEEP | Names + 3 silhouettes. AI: `rng() < 0.08` random dir. | FAKE (strategy) | Distinct route policies. |
| Territory Rush | CUT / ELIMINATED / REVENGE | Cut increments + unlock. No on-screen kill callout. | PARTIAL | Short CUT / ELIMINATED / REVENGE pop. |
| Territory Rush | Pickups | Speed / shield / claim at 3 fixed cells. Circles. | PARTIAL | Keep only if contested + readable; restyle. |
| Crowd Control | 15 authored routes | 15 `Segment[]`. Pattern is mostly gate / enemy / finish. `break` unused in levels. | PARTIAL | Re-family: sprint / destroy / boss / shortcut / attrition / payoff. |
| Crowd Control | Enemy crowds | `pack -= 8` if same lane. Draw: 5 red mini-people. | FAKE (combat) | Visible opposing crowd, 0.5–1.5s clash, both shrink. |
| Crowd Control | Boss | `pack -= 14`. Draw: red rounded rect + circle. No HP. | FAKE | Entity with HP, attack, size, death. Crowd auto-attacks. |
| Crowd Control | Destruction (`break`) | Type exists. Levels never emit it. Touch only `speed += 20`. | FAKE | Real walls/gates/crates the pack bursts. |
| Crowd Control | Finish payoff | Gate + yellow rect “tower”. `mul 2` / `+18`. | PARTIAL | Machine / reactor fed by remaining units + 12/24/48/96 beat. |
| Crowd Control | Crowd of 100 | Cap 40 touch / 80 desktop. Spawn pack 12. | PARTIAL | LOD so 100 reads as 100. |
| Knockout Circuit | 8 maps | 8 authored `MAPS` with unique obstacle sequences. | REAL (layouts) | Keep 8. Do not invent more. |
| Knockout Circuit | Spinner / beam / mover / fall / gate / finish | Collision kinds exist. Draw is still rect / circle primitives. | PARTIAL | Hardware identities: hub+arms, laser gate, rail platform, cracking tile, piston door, finish arch. |
| Knockout Circuit | 3 environments | Per-map palette only. BG = gradient + mountain triangles. | FAKE (places) | Factory / Skyworks / Signal Core composition. |
| Knockout Circuit | Character reactions | `drawRunner` + ragdoll. Weak stumble/land/finish. | PARTIAL | Hit, stumble, fall, land, finish pose. |
| Knockout Circuit | Start / finish | Spawn rect. Finish is a tall rect. | PARTIAL | Start platform, countdown, finish sequence. |
| Neon Drift | 3 tracks | Three closed circuits with sectors. | REAL | Keep. |
| Neon Drift | On-camera world | Props drawn in world space, often far from racing line. Camera follows car. | PARTIAL | Track-side props + 3 landmarks per circuit. |
| Neon Drift | Surface | Asphalt strip + dashed mark + occasional blotch. | PARTIAL | Rubbering, skids, patches, curb identity. |
| Neon Drift | Car | Procedural arcade body. | REAL enough | World first, tiny car polish only. |
| Velocity Run | 12 authored courses | `world-1/2/3.ts`, unique medal ids. | REAL | Work the 12. No 40-level dump. |
| Velocity Run | Platform language | `plat()` rectangles. | PARTIAL | Supports, underside, trims, warning edges. |
| Velocity Run | World structures | Silhouette bands, not inhabitables. | PARTIAL | Training / Transit / Ascent architecture. |
| Velocity Run | Ghost | Rounded rectangle. | FAKE (identity) | Same runner silhouette + trail. |
| Velocity Run | Piston / laser / rotating bar | `liveHazard` movement. Draw still bars. | PARTIAL | Hardware: piston shaft, laser emitter, supported bar. |
| Sky Stack | Best of set | Materials by altitude, rare events, TAP, perfect snap. | REAL | Bugfix / altitude polish / QA only. No feature creep. |
| All 8 | 80 manual runs | Documented as 3–8s + `finishRun`. | FAKE (as playtest) | Natural full runs. `finishRun` stays for e2e only. |
| All 8 | READY / NEAR READY | Previous pass self-score. | FAKE (as classification) | SHIP CANDIDATE / POLISH REQUIRED / PROTOTYPE only. |

## Fake depth to remove or replace

1. Swarm `missile` / `blade` / `plasma` counters with no spawn/draw.
2. Swarm `drone` as `orbital += 1`.
3. Swarm Warden as Core with more HP.
4. Swarm “2 arenas” as two palettes.
5. Pocket `MORE = Array.from({ length: 18 })`.
6. Pocket “30 layouts” claim.
7. Territory “2 arenas” as two palettes.
8. Territory bots as random walk with names.
9. Crowd enemy = `pack -= 8`.
10. Crowd boss = `pack -= 14`.
11. Crowd unused `break`.
12. Knockout named rectangles as finished obstacles.
13. Velocity ghost capsule.
14. Counting short `finishRun` sessions as playtests.

## Keep as-is (already real)

- Neon 3 tracks + drift scoring + countdown + smash.
- Velocity 12 courses + coyote jump + medals.
- Swarm core combat loop, 8 enemy kinds, twin/rail/spread/pulse/nova/chain/split/pierce.
- Sky Stack climb loop.
- Knockout 8 map collision scripts.
- Pocket drag-aim + bumper bounce + par.
- Territory flood-fill capture math.
- Crowd 15 authored gate sequences + flocking members.
