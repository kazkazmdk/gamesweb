# Home art direction closeout

Branch: `cursor/home-art-direction-closeout-c08e`  
Base: `cursor/home-visual-rebuild-c08e` @ `d124d1121428633ea206b98485f0888cb18dac18`

This pass does not rebuild the launcher. It recaptures gameplay, gives each title a stage family, and finishes chrome / events / social so the existing dock reads as a Gamesweb surface.

## Hero assets

| Game | Old | New | Why |
| --- | --- | --- | --- |
| Neon Drift | `docs/qa-home-art-closeout/before/art/neon-drift-hero.jpg` | Hairpin drift (`candidates/neon-drift-02-hairpin-drift.jpg`) | Same car language, clearer curve + skid. Kept because the previous frame was already a real drift. |
| Velocity Run | `…/velocity-run-hero.jpg` | Transit (`velocity-run-01-transit.jpg`) | Teal transit architecture and a readable spike instead of a generic training slab. |
| Swarm Protocol | `…/swarm-protocol-hero.jpg` | Core fight (`swarm-protocol-06-play.jpg`) | Old frame was a lost triangle in empty dark. New frame is a boss + projectiles + ship after real upgrades. |
| Sky Stack | `…/sky-stack-hero.jpg` | Taller stack (`sky-stack-01-tower.jpg`) | Same minimal sky, seven floors instead of three. |
| Knockout Circuit | `…/knockout-circuit-hero.jpg` | Skyworks (`knockout-circuit-01-skyworks.jpg`) | Warm factory staggered platforms instead of a flat starter line. |
| Pocket Striker | `…/pocket-striker-hero.jpg` | Arcade Lab aim (`pocket-striker-01-arcade-aim.jpg`) | Purple table, pink ball, aim line. A miniature, not the brown workshop rectangle. |
| Territory Rush | `…/territory-rush-hero.jpg` | Mid-claim (`territory-rush-02-fill.jpg`) | Ribbon in motion, several colours. Graphic family, bloom off. |
| Crowd Control | `…/crowd-control-hero.jpg` | ×4 payoff (`crowd-control-12-late.jpg`) | Pack 152 on the multiplier, finish ahead. Still tiny people — that is the game draw, not a fake crowd. |

Candidates (3+ per game) live in `docs/qa-home-art/candidates/`.

## Home composition

`home-stage.ts` now drives `family`, `copy`, `leftWash`, `bottomWash`, `vignette`, and `travel`. Families:

- speed — Neon, Velocity (directional wash, horizontal energy)
- arena — Swarm (offset copy, stronger vignette, boss-centered crop)
- vertical — Sky (tower lifted into the sky field)
- diorama — Pocket (tighter table crop, low bloom)
- graphic — Territory (no photographic bloom)
- runner — Knockout, Crowd (depth wash, subject lifted over the rail)

Stage switches nudge ±1.5% on speed/runner titles. Filters stay finish-only. Max scale is 1.18.

## GameRail

- Full titles on idle tiles. Focused tile is a framed preview (index + ticks), not a second `NEON DRIFT`.
- Focused ~18rem, idle ~11.25rem. Mobile focused `58vw` so the next cover peeks.
- Marks: challenge `VS` → daily timer dot → continue notch. Unplayed is not `NEW`.
- Daily is a corner dot, not `DAILY` on four tiles.

## Mobile

Top bar: mark + Gamesweb, Inbox + player. Search only in the bottom nav. Settings lives in Me. Tested at 390.

## Daily / Grand Prix

One event board. Daily keeps the editorial live count, route chain, countdown, `Enter ›`. Grand Prix is a cup route (`R1 → … → Final`) with points or `Enter cup ›`, not a thumbnail list.

## Social

`Arcade live`, max three signals: open challenge (VS + score), friend currently playing, primary rival (wins). Hidden when empty. No invented Join.

## Player identity

Eight deterministic geometric glyphs, chamfered frame, accent edge. Hash of player id.

## QA table

| Game | Hero | Tile | Identity | Mobile | Status |
| --- | ---: | ---: | ---: | ---: | --- |
| Neon | Car on a hairpin, room for Play | Track readable | Yes without the title | Chrome gone, next tile peeks | PASS |
| Velocity | Spike / transit architecture | Player visible on tile | Place yes, runner weaker in the hero | — | POLISH |
| Swarm | Boss + shots, ship no longer lost | Boss on tile 03 | Immediate | Boss + peek | PASS |
| Sky | Tower in the sky field | Stack on tile | Immediate | Sky + tower on tile | PASS |
| Knockout | Platforms / moon | Spinner on tile | Environment yes, runner mostly on tile | — | POLISH |
| Pocket | Purple table, pink ball | Full table | Yes | — | PASS |
| Territory | Coloured blocks + ribbon | Full board | Yes | — | PASS |
| Crowd | Finish + ×2 payoff | Pack on tile 08 | Gates yes. People stay engine-tiny | Pack on tile, hero is the route | POLISH |

## Remaining

**P0** — none that still match the closeout blockers. Swarm is a fight. Crowd is a payoff route, not an empty corridor. Mobile chrome is not duplicated. Grand Prix is a cup. Badges are quiet. Titles are full.

**P1**

- Crowd people are 4–6 px stick figures even at pack 152. A convincing “huge crowd” hero would need a game camera change, which this pass must not do.
- Velocity / Knockout runners sit low in the source frames; the dock still eats them more than the environment.
- Grand Prix Final wraps under R1–R4 on mid desktops.

**P2**

- Pocket hero still shows more table field than furniture.
- Daily dots appear on every remaining daily game (3–4). Quieter than `DAILY`, still a little busy.
- Headless Phaser capture runs at ~8–11 fps, so later Swarm density is harder to freeze.

## Screenshots

`docs/qa-home-art-closeout/after/`

- Desktop 1440: neon, velocity, swarm, sky, knockout, pocket, territory, crowd
- Mobile 390: neon, swarm, crowd, sky
- States: new-player, returning, challenge, friend-playing
- Full page: neon 1440, neon 390
- Contact sheet: `docs/qa-home-art-closeout/contact-sheet.html`
- Before art: `docs/qa-home-art-closeout/before/art/`
- Previous rebuild shots (referenced): `docs/qa-home-rebuild/`
