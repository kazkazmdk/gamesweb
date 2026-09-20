# GAME ART DIRECTION REBUILD — 8 DISTINCT WORLDS

## Branch / base

Work on:

`cursor/game-art-direction-rebuild-c08e`

Base:

`cursor/platform-visual-closeout-c08e` @ `21c782db63f4c26d6b92e980a43792b46b806dbf`

Do not merge. Do not restart the platform closeout. Do not redesign the Gamesweb Home.

---

# 0. Why this pass exists

The platform shell is now coherent, but the games themselves are not visually differentiated enough.

The current failure is NOT simply "not enough polish".

Too many games share the same visual formula:

- near-black / charcoal background,
- one neon accent,
- thin glowing lines,
- abstract geometric props,
- white HUD,
- sparse world dressing,
- similar visual density,
- similar "tech demo" / "prototype" feeling.

This makes Neon Drift, Velocity Run, Swarm Protocol, Knockout Circuit, Territory Rush and Crowd Control feel like different modes of one dark-neon game instead of eight independent games with their own worlds.

Gamesweb shell identity and game identity must now be separated.

## Core principle

**Gamesweb shell = one coherent platform.**
**Each game canvas = a separate authored world.**

When gameplay starts, the Gamesweb brand should recede.

A screenshot of the canvas with the platform HUD hidden must be identifiable without the game title.

If two games could plausibly swap their palette and still look correct, the art direction is not distinct enough.

---

# 1. Hard constraints

## Do NOT

- redesign Home;
- rebuild platform pages already closed;
- change core mechanics just to make visuals easier;
- replace the existing product with eight generic Poki clones;
- make all eight games cartoon;
- make all eight games dark;
- solve differentiation by changing only hue/accent;
- use "black + neon + rectangles" as the default fallback;
- use procedural geometry with no authored composition everywhere;
- add decorative noise that hurts gameplay readability;
- invent fake social data;
- add heavy asset libraries or large runtime dependencies;
- import/copy copyrighted game assets or screenshots into production;
- blindly regenerate screenshots and mark the pass finished.

## You MAY

- rebuild rendering layers;
- redesign backgrounds and environmental dressing;
- create original SVG/CSS/Canvas/Phaser shapes and textures;
- add lightweight original sprites/illustrations where useful;
- add particles, shadows, lighting, parallax, material cues and camera framing;
- improve VFX and payoff;
- add purely visual environmental animation;
- adjust camera composition when mechanics/collisions do not change;
- add game-specific HUD styling inside the canvas;
- add game-specific micro-interactions and feedback;
- create visual-only set pieces that do not alter collision rules.

---

# 2. Separation of design systems

## A. Platform Art System — Gamesweb

Keep the existing shell language:

- dark premium console framing,
- off-white typography,
- chamfered CTA grammar,
- restrained platform accent,
- geometric navigation,
- shared social/progression surfaces,
- PS5 / Xbox / Discord-Activities influence.

This system applies to:

- Home
- Arcade
- Game Hub
- Daily
- Grand Prix
- Friends
- Crew
- Leaderboards
- Profile
- Achievements
- Settings
- Pause/results shell where appropriate

## B. Game Art Bible — one per game

Each game needs its own:

- world premise,
- dominant palette,
- lighting model,
- material language,
- shape language,
- silhouette system,
- prop vocabulary,
- environmental depth,
- VFX vocabulary,
- HUD/gameplay typography treatment,
- camera composition rules,
- opening/mid/peak/payoff visual states.

Do not inherit the Gamesweb dark-neon palette merely because the shell uses it.

---

# 3. Global visual target

The target is NOT "AAA".

The target is:

**browser-game immediacy + authored visual identity + excellent readability + high replay visual payoff.**

Use successful browser games as a benchmark for how aggressively they communicate gameplay visually:

- Poki / CrazyGames games often use large silhouettes,
- strong primary/secondary colors,
- obvious objects,
- authored environments,
- exaggerated feedback,
- tactile materials,
- high-contrast gates/objectives,
- big state changes.

The useful lesson is not "make it childish".
The useful lesson is:

**the gameplay itself must be the visual spectacle.**

A game can be minimal like OvO and still feel finished.
A game can be saturated/cartoon like Rumble Rush and feel finished.
A game can be dark like Vampire Survivors and feel finished.

What is not acceptable is generic dark abstraction with one accent.

---

# 4. Diversity rules across the full catalog

Across the 8 games:

- maximum 2 games may be predominantly dark/night scenes;
- at least 4 games should be predominantly light / high-key / mid-key;
- at least 3 must use warm color families prominently;
- at least 3 must use organic/soft/rounded visual forms;
- at least 3 must use hard architectural/mechanical forms;
- no two adjacent games in the launcher should look like palette swaps;
- no repeated generic black void;
- no repeated "thin neon line + rectangle platform" solution.

The 8 thumbnails should form an obviously diverse catalog when viewed together.

Create a catalog contact sheet before and after.

---

# 5. Reference methodology

Before changing code, inspect current screenshots:

`docs/qa-platform-visual-closeout/*-{open,mid,peak}-1440.png`

and current source for each game.

Then research visual references for each game.

Use references to understand:

- composition,
- readability,
- camera distance,
- color blocking,
- environmental density,
- materials,
- feedback,
- silhouette,
- scale.

Do NOT copy layouts/assets 1:1.

Document the conclusions in:

`docs/qa-game-art-direction/REFERENCE-MAP.md`

For each game include:

- 3–5 visual references,
- what to borrow conceptually,
- what NOT to copy,
- final Gamesweb-specific visual thesis.

---

# 6. GAME ART BIBLE 01 — NEON DRIFT

## Current problem

Neon Drift is too dependent on:

- black void,
- magenta accent,
- track line,
- sparse roadside geometry.

The recent roadside pass helped, but it still feels like a dark vector prototype rather than a place.

The player previously reported that the game itself was hard to understand, so visual identity and gameplay clarity must improve together.

## New direction

**Midnight street / touge score attack.**

Not "cyberpunk neon everywhere".

Think:

- wet asphalt,
- real road hierarchy,
- street lamps,
- sodium amber light,
- cool moonlight,
- dark vegetation/buildings,
- reflective barriers,
- road signs,
- tunnel sections,
- service areas,
- mountain/city silhouettes,
- occasional magenta/cyan commercial signs.

### Palette

Dominant:
- asphalt blue-gray,
- deep navy,
- muted concrete,
- sodium amber.

Accent:
- magenta/cyan only as secondary race identity.

Avoid:
- large pure-black empty regions,
- magenta being the entire world.

### Materials

Need visible distinction between:

- asphalt,
- painted lane markings,
- barriers,
- grass/earth,
- concrete,
- reflective signs,
- building facades,
- glass,
- wet/reflective surfaces.

### Gameplay spectacle

Drift itself must create the visual reward:

- visible tire marks,
- smoke/dust/light particles,
- slip-angle feedback,
- road-edge proximity feedback,
- combo intensity,
- bank pulse,
- trackside parallax.

### Camera

The player must see enough upcoming road to plan.

Avoid giant empty margins outside the track.

Frame roadside architecture/vegetation inside the actual gameplay camera, not outside it.

### Reference principles

Useful references:
- Drift Hunters: environmental grounding / car-space relation.
- art of rally: readable road/environment composition.
- Inertial Drift: stylized night racing and color contrast.
- Night-Runners / Japanese night-road imagery: location identity.

Do not clone their assets.

### Acceptance

A no-HUD screenshot must read as "night drift racing" immediately.

Opening, first corner, mid-run and high-combo state must look materially different.

---

# 7. GAME ART BIBLE 02 — VELOCITY RUN

## Current problem

Velocity still reads like:

- dark silhouettes,
- floating platforms,
- cyan accent,
- placeholder architecture.

The start arch improved the opening but not the world.

## New direction

**Graphic rooftop parkour in daylight.**

The most important decision: leave the dark-night family.

### Palette

Dominant:
- warm white / ivory concrete,
- pale sky blue,
- deep cobalt/navy structural shadows.

Accent:
- orange/red safety paint,
- occasional teal.

### World

Create recognizable places, not generic platforms:

- rooftop HVAC zone,
- construction crane crossing,
- glass office canyon,
- metro/service roof,
- antenna tower,
- maintenance bridge,
- billboard gap,
- solar rooftop,
- final communications tower.

The level should feel like a route through a city.

### Shape language

- large clean architectural masses,
- bold safety markings,
- readable ledges,
- strong depth planes,
- very limited visual clutter on collision edges.

### Reference principles

Useful references:
- Mirror's Edge: architectural color coding and route readability.
- OvO: ruthless gameplay silhouette clarity.
- Parkour Race: immediate forward direction and readable obstacles.

### Acceptance

A screenshot must no longer look like "black platform prototype".

At least 3 course sections must be identifiable from screenshots alone.

---

# 8. GAME ART BIBLE 03 — SWARM PROTOCOL

## Current problem

Swarm has good core readability but still feels visually like particles and geometric enemies on a dark field.

Peak state is not spectacular enough relative to survivor references.

## New direction

**Organic sci-fi salvage / alien infestation.**

This may remain one of the predominantly dark games, but it must not look like Neon Drift.

### Palette

Dominant:
- deep desaturated blue/green,
- alien organic greens,
- rust / salvage orange,
- bone / ivory enemies.

Accent:
- toxic lime,
- plasma cyan,
- hazard yellow.

### Materials/world

The arena should feel like a location:

- derelict ship deck,
- cracked colony floor,
- fungal/alien growth,
- wreckage,
- cables,
- vents,
- salvage containers,
- reactor/biological structures.

### Enemy identity

Do not use only circles/blobs.

Need distinct silhouette families:

- skitterers,
- bulbous swarmers,
- ranged spores,
- shield shells,
- elites,
- boss mass.

### Peak-state spectacle

At peak:

- large readable enemy density,
- projectile patterns,
- drops/pickups,
- hit flashes,
- area clearings,
- power effects,
- enemy death states,
- contrast pockets around player.

Reference principle:
Vampire Survivors / Brotato / 20 Minutes Till Dawn show power escalation visually.

### Acceptance

Open state must promise danger.
Peak must look dramatically more powerful than open.
A screenshot should never be confused with Neon or Territory.

---

# 9. GAME ART BIBLE 04 — KNOCKOUT CIRCUIT

## Current problem

Recent factory dressing helped but the game is still too geometric/abstract.

## New direction

**Toy-scale industrial game show.**

This should be one of the brightest games in the catalog.

### Palette

Dominant:
- sky / warm light background,
- saturated yellow,
- coral red,
- cyan,
- off-white.

Secondary:
- industrial gray only for support structures.

### Materials

Think tactile:

- foam,
- painted steel,
- rubber,
- plastic barriers,
- conveyor belts,
- fabric banners,
- hazard decals.

Avoid a realistic dirty factory.

### Obstacles

Every obstacle should have an exaggerated readable identity:

- giant rotating arms,
- punch pistons,
- conveyors,
- swinging blocks,
- crushers,
- fans,
- moving doors,
- tilting platforms,
- foam rollers.

### Environment

Add game-show framing:

- spectator/light rigs,
- banners,
- finish arch,
- score screens,
- confetti/payoff zones,
- visible next obstacle.

### Reference principles

- Fall Guys: obstacle silhouette and material softness.
- Rumble Rush: browser readability and saturated course identity.
- Stumble-style games: immediate hazard language.

### Acceptance

No screenshot should look like a generic Phaser obstacle prototype.
A child should understand "avoid that giant moving thing" without reading.

---

# 10. GAME ART BIBLE 05 — POCKET STRIKER

## Current problem

Direction is promising but too empty.

## New direction

**Warm tabletop miniature sports diorama.**

Do not make it neon.

### Palette

Dominant:
- warm wood,
- cream,
- felt green / blue,
- painted red,
- warm lamp light.

Accent:
- player/team color.

### World

The play surface exists inside a physical room/table context:

- table edge,
- miniature rails,
- scoreboard,
- tiny stands,
- desk objects,
- lamp,
- stickers,
- score cards,
- tactile bumpers.

Background should sell scale.

### Materials

Strong distinction:

- wood,
- felt,
- plastic,
- painted metal,
- rubber bumpers,
- paper/card.

### Shot feedback

- aim guide clean,
- impact squash/flash,
- contact sound synchronization,
- tiny crowd reaction,
- score plaque flips,
- ball/puck shadow.

### Reference principles

- Blumgi Soccer: instant objective readability.
- tabletop mini-golf / foosball / toy sports: tactile material identity.
- 8 Ball Pool: aim readability and anticipation.

### Acceptance

Pocket must look warm and physical, almost touchable.
It should be visually incompatible with Swarm and Neon.

---

# 11. GAME ART BIBLE 06 — TERRITORY RUSH

## Current problem

This is currently the weakest art-direction match.

Adding checker districts/roads did not solve the main issue.

It still reads as a technical grid.

## New direction

**Bright paint / toy-city territory battle.**

This should be a high-key game.

### Palette

Dominant:
- light neutral ground,
- saturated player colors,
- playful city greens/blues/cream.

Territory colors must dominate the image.

### World

Use simplified toy-city geometry:

- blocks,
- plazas,
- parks,
- tiny roads,
- bridges,
- decorative buildings outside collision-critical zones.

But gameplay must remain readable.

### Core visual loop

The capture itself is the spectacle:

1. player exits owned zone,
2. trail appears clearly,
3. risk is visually obvious,
4. loop closes,
5. fill wave expands,
6. captured area pops/settles,
7. score/percentage reacts,
8. new frontier becomes obvious.

This transformation matters more than background detail.

### Reference principles

- Paper.io 2: territory/trail clarity.
- Splatoon: paint as world-state communication.
- toy-city / board-game visuals: approachable dimensionality.

Do NOT simply copy Paper.io colors/layout.

### Acceptance

The screen must be dominated by territory ownership, not by a grid.
Peak screenshots must visibly show map transformation.

---

# 12. GAME ART BIBLE 07 — SKY STACK

## Current problem

Sky Stack is already closest to shippable.
Do not overcomplicate it.

## New direction

**Serene vertical architecture / sky ritual.**

Move it away from generic dark.

### Palette

Dynamic sky sequences:

- dawn peach,
- pale blue day,
- golden hour,
- lavender dusk.

Blocks/materials:
- ceramic,
- stone,
- frosted glass,
- painted concrete.

### Visual progression

As the stack grows:

- camera climbs,
- sky evolves,
- clouds/parallax shift,
- horizon changes,
- block scale/composition feels taller,
- perfect streak adds restrained glow/particles.

### Reference principles

- Monument Valley: architectural calm and palette.
- Alto's Odyssey: atmosphere/progression.
- Stack/Stacktris: immediate physical readability.

### Acceptance

Keep the one-action clarity.
Do not turn this into a feature-heavy game.
Visual polish should increase serenity and physicality.

---

# 13. GAME ART BIBLE 08 — CROWD CONTROL

## Current problem

Pack-aware camera fixed scale, but the crowd still feels like a graphic cluster on a dark surface.

## New direction

**Bright city-festival / toy-runner spectacle.**

### Palette

Dominant:
- light road/concrete,
- grass/park green,
- warm building colors,
- blue sky.

Crowd:
- multiple coordinated colors, not one orange mass.

Gates:
- huge saturated signs.

### Environment

Run through recognizable event spaces:

- boulevard,
- plaza,
- park,
- festival barriers,
- bridge,
- finish arena.

### Crowd spectacle

The crowd must physically communicate growth:

- 10 = clearly small,
- 30 = meaningful cluster,
- 80 = huge swarm,
- 120+ = absurd mass.

Need:

- larger spatial spread,
- depth layers,
- individual silhouette variance,
- bounce/animation,
- readable shadows,
- temporary compression through gates,
- dramatic re-expansion.

### Gate payoff

`+30`, `×2`, risk gates, clash zones etc. must dominate composition at the decision moment.

### Reference principles

- Count Masters / crowd runners: exaggerated arithmetic payoff.
- arcade toy-runner framing: bright, high readability.

### Acceptance

A +30 gate must create an unmistakable before/after screenshot.
Peak crowd should feel almost excessive.

---

# 14. Game-specific UI / HUD

The platform shell may stay consistent, but in-game HUD does not have to be identical across all eight games.

Create a restrained HUD dialect per game.

Examples:

- Neon: motorsport telemetry / banked score.
- Velocity: time/sector typography and route marker.
- Swarm: survival / build telemetry.
- Knockout: round / placement / event signage.
- Pocket: physical scoreboard.
- Territory: ownership % / trail danger.
- Sky: minimal streak / height.
- Crowd: population / gates.

Do not use identical white text blocks in the same corner for every title.

Maintain accessibility and legibility.

---

# 15. Material / depth rules

Every game must demonstrate at least 3 visually distinct material/depth classes.

Examples:

- foreground gameplay surface,
- midground interactive/semantic props,
- background world/environment.

Use:

- shadows,
- parallax,
- overlap,
- scale,
- atmospheric perspective,
- controlled texture,
- lighting,
- material highlights.

Avoid turning Canvas into a flat vector diagram unless the entire game intentionally chooses a minimal style like OvO.

---

# 16. Gameplay readability > decoration

Never hide:

- player,
- hazards,
- track,
- territory trail,
- projectile,
- goal,
- gate,
- obstacle timing.

Every decorative pass must answer:

1. What gameplay information becomes easier to read?
2. What identity does this add?
3. Does it remain clear at 390px?

If the answer is "it just looks busier", remove it.

---

# 17. Required inherited correctness fixes

Close these while touching the relevant surfaces.

## Neon tutorial migration — P0

Current tutorial key is still:

`gw:neon-tutorial`

The old implementation also used that key and marked it complete after first input.

Therefore existing players who already touched Neon before the new HOLD → COMBO → BANK tutorial can skip the improved tutorial forever.

Version/migrate it.

Example:
`gw:neon-tutorial-v2`

The new first-run lesson must be shown to users carrying the old key.

Do not repeatedly show it after successful completion.

## Results zero-score copy

Do NOT use "No score banked" globally.

That copy is Neon-specific.

Provide game-aware zero-result language.

Examples:
- Neon: No score banked.
- Velocity: No finish recorded / Run ended.
- Swarm: No survival score.
- Knockout: Eliminated before scoring.
- Pocket: No points scored.
- Territory: No territory secured.
- Sky: No stack score.
- Crowd: Run ended before scoring.

Use the correct semantics for actual game result behavior.

---

# 18. Implementation strategy

Do not rebuild all mechanics.

Preferred order:

1. Create reference map/art bible.
2. Establish game-specific palette/material constants.
3. Rework rendering/background/world layers.
4. Add gameplay-specific feedback layers.
5. Fix in-game HUD dialect.
6. Check camera composition.
7. Capture states.
8. Inspect visually.
9. Iterate.
10. Only then update baselines/report.

Where reusable helpers genuinely make sense, add them to `game-core`.

But do NOT create a universal art renderer that forces the eight games back into the same visual language.

Shared engineering primitives are fine.
Shared art direction is not.

---

# 19. Required visual QA matrix

Create:

`docs/qa-game-art-direction/`

For EACH game capture at 1440:

- `<slug>-open-1440.png`
- `<slug>-mid-1440.png`
- `<slug>-peak-1440.png`
- `<slug>-payoff-1440.png`

Also capture at 390:

- `<slug>-play-390.png`

Total minimum: 40 screenshots.

For Neon additionally capture:

- tutorial HOLD,
- COMBO/LIVE,
- BANK,
- combo break.

For Territory additionally capture:

- trail exposed,
- loop closing,
- fill payoff.

For Crowd additionally capture:

- small pack,
- medium pack,
- huge pack,
- gate before/after.

For Sky:
- opening,
- high stack,
- perfect streak.

---

# 20. Catalog contact sheet

Create a contact sheet that shows all 8 games at peak state together.

Acceptance question:

**Would a new user believe these screenshots come from eight different games?**

If not, continue.

Also create a second contact sheet with the opening state of all 8 games.

This catches the common failure where peak states differ but every opening screen still looks like the same Gamesweb template.

---

# 21. Visual acceptance gates

## P0

- No broken gameplay.
- No broken collision.
- No unreadable player/hazard/objective.
- Neon tutorial migration fixed.
- Zero-result copy no longer globally says "banked".
- Mobile 390 remains playable.
- Home/platform shell not unintentionally redesigned.

## P1

All must pass:

1. Each game has a documented art bible.
2. Each game has a distinct palette.
3. Each game has a distinct material vocabulary.
4. Each game has a distinct silhouette language.
5. Each game has a distinct environment/world premise.
6. No more than 2 games are predominantly dark.
7. At least 4 are clearly light/high-key/mid-key.
8. Open/mid/peak/payoff states show visible escalation.
9. Eight-game peak contact sheet reads as eight independent products.
10. No screenshot should be describable merely as "dark background + colored shapes".

## P2

- additional ambient animation,
- deeper props,
- extra weather/time variations,
- more environment sets,
- richer cosmetic integration.

Do not block P1 on huge content expansion.

---

# 22. Per-game qualitative target

Do NOT fake numerical certainty, but use these qualitative expectations:

- Neon Drift: authored night racing, not neon vector demo.
- Velocity Run: daylight architectural parkour, not silhouette prototype.
- Swarm Protocol: hostile organic sci-fi, not particles on black.
- Knockout Circuit: colorful toy-industrial game show, not geometry test.
- Pocket Striker: tactile warm tabletop, not purple empty board.
- Territory Rush: bright paint/territory spectacle, not technical grid.
- Sky Stack: serene sky architecture, not dark stack screen.
- Crowd Control: bright crowd spectacle, not orange dots on dark ground.

---

# 23. Performance

Do not destroy browser performance.

Requirements:

- retain smooth play on typical laptop/mobile;
- avoid large raster assets when lightweight procedural/SVG/canvas art can achieve the result;
- use quality tiers where particle counts are heavy;
- avoid excessive overdraw;
- no large new JS framework/dependency;
- inspect bundle impact;
- keep screenshot QA deterministic.

Art direction cannot be an excuse for a stuttering game.

---

# 24. Required testing

Before reporting complete:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm exec playwright test e2e/smoke.spec.ts e2e/platform.spec.ts e2e/gameplay.spec.ts e2e/progression.spec.ts e2e/security.spec.ts e2e/visual.spec.ts
QA_MATRIX=1 pnpm exec playwright test e2e/qa-matrix.spec.ts
```

Add/update targeted visual QA coverage where needed for new state captures.

Do not use `--update-snapshots` as a substitute for inspection.

---

# 25. Final report

Create/update:

`docs/GAME-ART-DIRECTION-REBUILD.md`

Report:

- branch,
- final SHA,
- files changed,
- art thesis for each game,
- reference principles used,
- before/after visual summary,
- screenshot matrix,
- contact sheets,
- tests,
- bundle/performance notes,
- exact unresolved P1/P2 issues.

For every game, state honestly:

- what visibly improved,
- what still looks generic,
- what still needs deeper content later.

No "perfect", "done", "AAA", or "P0 empty" claims without visual evidence.

---

# 26. Final test

Before finishing, hide all game titles and ask:

- Can I identify each game from one frame?
- Does each world have a specific place/material/light?
- Does the visual state explain what I am doing?
- Does peak gameplay look significantly more exciting than opening?
- Could any two games swap palettes without looking wrong?

If the last answer is yes, differentiation is still insufficient.

The objective of this pass is not eight prettier versions of the same dark-neon language.

The objective is:

**one Gamesweb platform, eight unmistakably different games.**
