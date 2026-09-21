# Game Art Direction Rebuild

Branch: `cursor/final-platform-games-seo-c08e`  
Base art-direction SHA: `c7e307c`  
This pass: remaining game P1 closeout (no Home redesign, no new SEO routes).

Home and platform pages were not redesigned. Mechanics and collisions were not rewritten, except Territory debug fill size. No reference assets were copied. No new npm dependencies.

---

## Why this pass

The previous rebuild (`43077fa` / report `d8be0fb`) split the catalog into eight worlds, but its own P1 list was still open: Territory paint did not dominate, Crowd gates were green bars, Neon roadside was sparse, Swarm peak was thin, and Velocity / Knockout still shared a daylight-blue sky.

This pass closes those P1s and the admitted Pocket / Sky polish items.

---

## Inherited correctness

| Fix | Evidence |
| --- | --- |
| Neon tutorial key is `gw:neon-tutorial-v2` | `games/neon-drift/src/config.ts`, `tests/gameplay.test.ts` |
| Old `gw:neon-tutorial` no longer hides HOLD → COMBO → BANK | returning players do not have the v2 key |
| Results zero copy is game-aware | unchanged from prior pass |
| TRACKS is exported from the Neon entry | `games/neon-drift/src/index.ts` |

---

## What changed this pass

### Territory Rush — paint as the spectacle
- `closeLoop` now authors a ~32×18 loop (~36% of the 48×28 map), not a 2×2 bite.
- Owned cells skip houses; fill opacity is near-solid so paint dominates the board.
- `captureWave` expands across most of the map and decays at ~0.6 so QA can photograph the fill.
- `exposeTrail` is a longer risk ribbon; the ribbon itself is thicker and brighter.
- Toy-city dressing stays on unowned cells only. Houses were not added.

### Crowd Control — huge gate signs
- Gates are saturated sign structures with readable `+N` / `×N` / `TAX −N`.
- Add / multiply / tax have distinct face, trim, and badge treatments.
- The pack compresses through a gate and re-expands after.
- `seekGate` jumps the pack to just before the next gate.
- `setPack` now accepts 10 / 30 / 80 / 120 and those sizes stay visually distinct.

### Neon Drift — three roadside families
- Roadside dressing is denser inside the default camera.
- Three authored families: sodium service / pit, vegetation touge corner, tunnel / underpass.
- Navy empty margins are reduced with a ground plane and wider grass shoulders.
- Wet asphalt + sodium lamps kept. Tutorial key unchanged (`gw:neon-tutorial-v2`).
- `TRACKS` is re-exported from `games/neon-drift/src/index.ts`. Collision samples were not rewritten.

### Swarm Protocol — open → mid → peak
- `desiredCount` now escalates 18 → 32 → 48 → 56 (boss 40), with quality caps (28 / 42 / 64).
- Enemy silhouettes are distinct (insect dart, treads, stalked spitter, crystal splitter, segmented chaser, ivory elite).
- Projectiles, pickups, and deaths read more clearly. The player sits in a contrast pocket.
- Quality tiers use `qualityFromFps` with draw/spawn caps.
- `seedPeak` forces a late-run dense field for QA.

### Velocity Run vs Knockout Circuit
- Velocity kits now match worlds: training = ivory/orange HVAC roof, transit = steel-blue crane/glass canyon, ascent = peach comms/high-rise.
- `setCourse(id)` accepts course id or world name (`training` / `transit` / `ascent`). Collisions unchanged.
- Knockout skies are warmer toy-show yellows. Platforms read as foam. Map A has three signature props: foam hammer, plastic disc, inflatable gate, plus spectator stands and banner signage.

### Pocket Striker / Sky Stack — polish only
- Pocket: thicker table edge and rails, lamp, cards, scoreboard, theme furniture on the rail. Aim line stays on the felt.
- Sky: height-based dawn peach → dusk lavender, a real horizon band, clouds drop out at height. No extra feature clutter.

---

## Debug commands added

`GwDebugCommands` in `packages/game-core/src/runtime.ts`:

| Command | Game |
| --- | --- |
| `seekGate()` | Crowd Control |
| `seedPeak()` | Swarm Protocol |
| `setCourse(id)` | Velocity Run |

Existing `exposeTrail` / `closeLoop` / `setPack` / `stackTo` remain.

---

## Diversity lock (after)

| Rule | Result |
| --- | --- |
| Max 2 predominantly dark | Neon + Swarm only |
| ≥ 4 light / high-key | Velocity, Knockout, Pocket, Territory, Sky, Crowd |
| ≥ 3 warm families | Pocket wood, Knockout foam/coral, Crowd festival, Neon sodium, Territory paint, Velocity ivory/peach |
| ≥ 3 organic | Swarm, Pocket, Crowd |
| ≥ 3 architectural / mechanical | Neon, Velocity, Knockout, Sky |
| Nameless ID | Stronger than the prior pass: Velocity and Knockout no longer share a daylight-blue sky |
| Palette-swap test | Closest remaining pair is still two daylight games, but ivory HVAC vs yellow foam + hammer/disc/gate should not be interchangeable |

---

## Tests

```
pnpm test          # 105 pass (was 101)
```

Added unit coverage for Territory loop size, Crowd `+N` / `×N` / tax labels, Swarm density escalation, and the Neon `TRACKS` export. Existing Neon tutorial v2 and Velocity medal tests stay in place.

`pnpm typecheck` (`apps/web` `tsc --noEmit`) still fails on stale `.next/types` stubs for SEO routes that were **not** added (`/collections`, `/guides`, per-game clusters). No errors in the game sources this pass touched.

No collision rewrite. Canvas frames were not recaptured in this environment (no headed QA matrix).

---

## Bundle / performance

No new dependencies. Art is still procedural canvas. Swarm and Crowd keep quality caps so peak density does not unbounded-draw.

---

## Unresolved

### Closed this pass (was P1)
- Territory map-dominating paint / large debug fill
- Crowd huge saturated signs + pack squeeze
- Neon authored roadside families inside the default camera
- Swarm peak density + silhouettes + `seedPeak`
- Velocity / Knockout sky-family split

### Still P2
- Neon combo-break photo remains subtle
- Knockout finish confetti is still light
- Sky slabs are still rounded bars (intentional; one-action readability)
- Automated peak frames still need a headed QA recapture (`QA_MATRIX=1 e2e/game-art-direction.spec.ts`)

Do not treat this report as "AAA". The remaining P1 art gaps from the prior rebuild are closed. A nameless 8-up should now read as eight places rather than eight prototypes with one leftover blue-sky pair.
