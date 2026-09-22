# Final games QA

Base: `cursor/final-product-seo-qa-032a` @ `d7a22e3`  
Head: `cursor/production-social-closure-032a`

## Eight games — proven this pass

| Game | Boot | Pause freezes score/pos/time | Retry (no second Phaser) |
| --- | --- | --- | --- |
| Neon Drift | e2e | **e2e pause-retry** | **e2e** |
| Velocity Run | e2e | **e2e** | **e2e** |
| Swarm Protocol | e2e | **e2e** | **e2e** |
| Sky Stack | e2e | **e2e** | **e2e** |
| Knockout Circuit | e2e | **e2e** | **e2e** |
| Pocket Striker | e2e | **e2e** | **e2e** |
| Territory Rush | e2e | **e2e** | **e2e** |
| Crowd Control | e2e | **e2e** | **e2e** |

Proof: `e2e/pause-retry.spec.ts` (16 passed). Debug `tick` still counts overlay frames; freeze is asserted on simulation fields.

## Neon Drift first-read

Screenshot proof (1440): `docs/qa-production-closure/neon/`

| Track | Opening read |
| --- | --- |
| Harbour | Wide waterfront, sodium lamps, water, containers |
| Hairpin | Tight road, dark vegetation, orange chevrons |
| Ridge | Pulled-back height, guardrails, underpass bar |

Unlabeled contact sheet: `docs/qa-production-closure/neon/contact-sheet-unlabeled.png`.

## Results

Unchanged hierarchy: score / PB / Retry primary / challenge secondary / next game tertiary. Space/R grace still covered by `e2e/gameplay.spec.ts`.
