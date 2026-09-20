# Game Art Direction Rebuild

Branch: `cursor/game-art-direction-rebuild-c08e`  
Base: `cursor/platform-visual-closeout-c08e`  
Implementation SHA: `43077fa477eb649a0ff0fca82f6e21441583c104`  
Report / capture SHA: see the commit that adds this file.

Home and platform pages were not redesigned. Mechanics and collisions were not rewritten. No reference assets were copied.

---

## Why this pass

The closeout frames in `docs/qa-platform-visual-closeout/` failed a nameless catalog test: six of eight canvases read as one dark-neon geometric product. Peak states barely escalated from openings. Palette-only swaps would still have looked interchangeable.

Audit notes live in `docs/qa-game-art-direction/REFERENCE-MAP.md`.

---

## Inherited correctness

| Fix | Evidence |
| --- | --- |
| Neon tutorial key is now `gw:neon-tutorial-v2` | `games/neon-drift/src/config.ts`, `tests/gameplay.test.ts` |
| Old `gw:neon-tutorial` no longer hides HOLD → COMBO → BANK | returning players do not have the v2 key |
| Results zero copy is game-aware | Velocity payoff capture reads **No finish recorded**, not "No score banked" (`docs/qa-game-art-direction/velocity-run-payoff-1440.png`) |
| Other zero strings | `zeroResultCopy()` in `apps/web/lib/platform/format.ts` |

---

## Art thesis per game

### Neon Drift — midnight street / touge
**References used:** Drift Hunters (car/road scale), art of rally (road vs earth), Inertial Drift (night contrast), touge stills (sodium + wet asphalt).  
**What changed:** navy sky instead of a black void; gray asphalt with wet sodium pools; grass shoulders inside the camera; sodium lamps and buildings on the curb; magenta kept as race identity only. HUD is BANK / LIVE / combo telemetry.  
**Still generic:** roadside dressing is still sparse at this zoom; the navy margins remain large; the HOLD overlay covers a lot of tarmac; the automated peak frame landed on Results because the QA drive finished the run.

### Velocity Run — daylight rooftop parkour
**References used:** Mirror's Edge (route color), OvO (silhouette), rooftop HVAC / crane / billboard language.  
**What changed:** left the night family. Pale sky, ivory concrete, orange safety paint, HVAC units, billboard, start arch. HUD: `SECTOR`.  
**Still generic:** course sections beyond Gate A still share one roof kit; open/mid/peak look similar until the player actually runs the line.

### Swarm Protocol — organic sci-fi salvage
**References used:** Vampire Survivors (density), Brotato (pickup/flash), infestation/salvage materials.  
**What changed:** deep green hull instead of brown-black; fungus patches, salvage containers, bone/ivory and lime enemies; rust stays on tanks. HUD: `HULL` / `SALVAGED` / `DECK`. One of two allowed dark games, and it no longer looks like a night road.  
**Still generic:** most enemies are still circles/triangles; peak density in the 4s QA window is not a survivor spectacle; the arena floor is still a dark field under the growth.

### Knockout Circuit — toy industrial game show
**References used:** Fall Guys (foam silhouette), Rumble Rush (saturated course), stumble-style signage.  
**What changed:** bright sky, yellow foam platforms, coral spinner, lamps, `LIVE SHOW` HUD. No longer a dark factory test.  
**Still generic:** obstacles are still simple bars/spinners; spectator stands are flat color blocks; open ≈ peak.

### Pocket Striker — warm tabletop
**References used:** Blumgi Soccer (objective), tabletop mini-golf / foosball (wood/felt/lamp), 8 Ball Pool (aim).  
**What changed:** cream room, thick wood rail, warm lamp, score plaque, `TABLE` HUD. Visually incompatible with Neon/Swarm.  
**Still generic:** the felt is still an empty rectangle; desk clutter is a lamp and one card; workshop/garden/arcade variants need more authored furniture.

### Territory Rush — bright paint / toy-city
**References used:** Paper.io 2 (trail/fill), Splatoon (paint as state), toy-city boards.  
**What changed:** cream ground, tiny houses, saturated territories, `PAINT %` HUD. The technical dark grid is gone.  
**Still generic:** at 2% owned the houses still dominate the picture; the debug fill only grows a small pink bite; paint is not yet the spectacle the spec asks for.

### Sky Stack — zen vertical architecture
**References used:** Monument Valley (calm palette), Alto's Odyssey (sky as progress), Stack (one-action readability).  
**What changed:** dawn peach opening; ceramic tints; horizon hills; `HEIGHT` HUD. Peak at floor 28 is a tall pastel tower under a warmer sky — the clearest open→peak escalation in the catalog.  
**Still generic:** slabs are still rounded bars; dusk never goes dark (good) but also never becomes a distinct place.

### Crowd Control — city festival toy runner
**References used:** Count Masters (gate payoff), toy-runner boulevards, festival color.  
**What changed:** light road, grass/blue sky, tan building bars, multi-color pack, `PACK` HUD. 12 / 30 / 48 / 86 read as different masses. 390 stays readable.  
**Still generic:** gates are still green bars, not huge saturated signs; buildings are side color strips; the road is still a flat slab.

---

## Diversity lock (after)

| Rule | Result |
| --- | --- |
| Max 2 predominantly dark | Neon + Swarm only |
| ≥ 4 light / high-key | Velocity, Knockout, Pocket, Territory, Sky, Crowd |
| ≥ 3 warm families | Pocket wood, Knockout yellow/coral, Crowd festival, Neon sodium, Territory paint |
| ≥ 3 organic | Swarm, Pocket, Crowd |
| ≥ 3 architectural / mechanical | Neon, Velocity, Knockout, Sky |
| Nameless ID | Yes for all eight on the opening contact sheet |
| Palette-swap test | Closest pair is Velocity / Knockout (shared daylight-blue sky). Shape language still differs (ivory roof + orange safety vs yellow foam + red spinner). Not interchangeable, but they should drift further apart later. |

---

## Screenshot matrix

Folder: `docs/qa-game-art-direction/`

Per game, 1440: `open` / `mid` / `peak` / `payoff`  
Per game, 390: `play-390`

Specials:
- Neon: `hold`, `combo`, `bank`, `break`
- Territory: `trail`, `fill`
- Crowd: `pack-30` plus open (12) and peak (86)
- Sky: open, mid (~4), peak (~28)

Contact sheets:
- `contact-sheet-open-1440.png`
- `contact-sheet-peak-1440.png` (Neon uses the combo frame because the automated peak landed on Results)

Inspected before any snapshot update. `e2e/visual.spec.ts` was left on the existing platform baselines and stayed green.

---

## Tests

```
pnpm typecheck     # pass
pnpm lint          # pass (existing GameArt <img> warning only)
pnpm test          # 101 pass
pnpm build         # pass
playwright e2e/smoke.spec.ts e2e/platform.spec.ts e2e/gameplay.spec.ts
  e2e/progression.spec.ts e2e/security.spec.ts e2e/visual.spec.ts
                   # 61 pass, no --update-snapshots
QA_MATRIX=1 e2e/qa-matrix.spec.ts
                   # 4 pass
QA_MATRIX=1 e2e/game-art-direction.spec.ts
                   # 2 pass
```

Smoke/gameplay still boot and steer all eight titles. No collision rewrite.

---

## Bundle / performance

No new dependencies. Art is procedural canvas. Shared helpers added to `game-core` (`drawSodiumLamp`, `drawBush`, `drawHvac`, `drawBillboard`, `drawToyHouse`, `drawFungusPatch`) — primitives only, not a shared art renderer.

Playwright smoke reported Neon ~21 fps / Velocity ~39 fps / Swarm ~41 fps / Sky ~39 fps in the headed-less CI-like runner (same ballpark as previous closeout captures; the headless metrics are noisy). Quality tiers and particle caps are unchanged.

---

## Unresolved

### P1 leftovers
- Territory peak still does not show a map-dominating paint transformation.
- Crowd gates are readable but not "huge saturated signs".
- Neon roadside still needs denser authored corners (tunnel/service area) inside the default camera.
- Swarm peak is not yet a survivor-density spectacle in the QA window.
- Velocity / Knockout still share a daylight-blue sky family.

### P2
- Pocket desk diorama (more lamp, cards, rails, crowd).
- Distinct Velocity course kits (HVAC / crane / comms) that photograph as three places.
- Knockout spectator rigs, finish confetti, foam rollers.
- Sky dusk/lavender as a real horizon change, not only slab tint.
- Neon combo-break photo (the break capture exists; it is subtle).

Do not treat this report as "done" or "AAA". The catalog is no longer one dark-neon product. Several worlds still need deeper authored content before a nameless 8-up would look like eight finished games rather than eight distinct prototypes.
