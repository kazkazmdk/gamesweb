# Game Art Direction — Reference Map

Audit of `docs/qa-platform-visual-closeout/*-{open,mid,peak}-1440.png` plus current Phaser sources.
References are used for composition, materials, camera, readability, density, and feedback only.
No layouts, sprites, or assets are copied.

## Catalog failure (before)

Nameless contact-sheet test on the closeout frames:

| Game | What the frame actually reads as |
| --- | --- |
| Neon Drift | black void + magenta ribbon + sparse triangles |
| Velocity Run | navy silhouette platforms + cyan accent |
| Swarm Protocol | black field + orange/peach dots |
| Knockout Circuit | black factory + beige bars + red spinner |
| Pocket Striker | empty brown board |
| Territory Rush | dark checker grid + four colored squares |
| Sky Stack | blue gradient + two bars (closest to finished) |
| Crowd Control | dark brown road + orange pill crowd |

Six of eight sit in the same dark-neon geometric family. Peak frames barely escalate from open.
Palette-only swaps would still look interchangeable.

Dark-count before: 6/8 predominantly dark (Neon, Velocity, Swarm, Knockout, Territory, Crowd).
Allowed after: Neon + Swarm only.

---

## 01 — Neon Drift

**Current:** harbour/district/ridge dressing exists in code but sits outside the camera. The playfield is wet-looking only as a dark fill. Magenta owns the world.

**References (principles only)**
1. Drift Hunters — car-to-road scale, curb/barrier as the real play edge.
2. art of rally — readable road vs earth vs vegetation, not a floating ribbon.
3. Inertial Drift — night contrast without making neon the ground.
4. Japanese night touge / Night-Runners stills — sodium lamps, wet asphalt, mountain silhouette.
5. Browser arcade racers (Drift Boss family) — upcoming-road camera, obvious slip feedback.

**Borrow:** wet asphalt + painted marks; sodium pools on the tarmac; vegetation/buildings inside the gameplay frustum; tire smoke as the reward.
**Do not copy:** car models, track layouts, UI chrome, signage art.

**Thesis:** Midnight street / touge score attack. Asphalt blue-gray, navy sky, muted concrete, sodium amber light. Magenta/cyan only as race identity (sectors, bank pulse). The drift itself (marks, slip, near-edge, combo) is the spectacle.

---

## 02 — Velocity Run

**Current:** dark cyan rooftop prototype. Start arch is the only place cue. Platforms read as floating bars.

**References**
1. Mirror's Edge — architectural color coding, route as a city path.
2. OvO — ruthless silhouette of player vs ledge vs hazard.
3. Parkour Race / browser rooftop runners — immediate forward direction, bold obstacles.
4. Daytime city-rooftop photography — HVAC, cranes, glass, solar, antennas.

**Borrow:** daylight high-key; ivory concrete + orange safety; three named rooftop types.
**Do not copy:** Faith's costume, specific buildings, course geometry.

**Thesis:** Graphic rooftop parkour in daylight. Warm white concrete, pale sky, cobalt shadows, orange/red safety paint. Training = HVAC roof, transit = crane/metro canyon, ascent = comms tower. Never a night-neon cousin of Neon.

---

## 03 — Swarm Protocol

**Current:** readable survivor loop, but particles on a black void. Enemies are circles/triangles. Peak does not escalate.

**References**
1. Vampire Survivors — density and power escalation as the picture.
2. Brotato / 20 Minutes Till Dawn — pickup/flash/death as readable spectacle.
3. Alien salvage / infestation concept art — rust, bone, fungus, wreckage (shapes only).
4. Browser survivor arenas — contrast pocket around the player.

**Borrow:** organic hostile location; distinct enemy families; peak density + flashes.
**Do not copy:** VS pixel art, specific enemy designs, UI.

**Thesis:** Organic sci-fi salvage / infestation. Deep desaturated blue-green hull, rust salvage, bone/ivory swarm, toxic lime and plasma accents. Derelict deck with growth and wreckage. One of two allowed dark games, and it must not resemble a night road.

---

## 04 — Knockout Circuit

**Current:** dark factory with lamps/crates. Still a geometry test.

**References**
1. Fall Guys — soft foam silhouettes, obvious moving hazards.
2. Rumble Rush — saturated browser course, huge readable arms.
3. Stumble Guys-style courses — game-show framing, banners, finish arch.
4. Toy industrial sets — painted steel + rubber + plastic, not dirty realism.

**Borrow:** bright sky, tactile foam/plastic, exaggerated obstacle identity, spectator rigs.
**Do not copy:** bean characters, specific obstacles, logos.

**Thesis:** Toy-scale industrial game show. Sky / warm light, saturated yellow, coral, cyan, off-white. Industrial gray only for supports. A child should see "avoid that giant spinning thing".

---

## 05 — Pocket Striker

**Current:** promising felt table, but empty. Arcade variant still leans purple-neon.

**References**
1. Blumgi Soccer — instant objective (ball vs goal).
2. Tabletop mini-golf / foosball — wood rails, felt, lamp, tactile bumpers.
3. 8 Ball Pool — aim guide + anticipation, not decoration.
4. Desk diorama photos — lamp, score cards, stickers, table edge selling scale.

**Borrow:** warm physical room around the table; wood/felt/plastic/rubber materials; clean aim.
**Do not copy:** pool tables, brand felt, UI.

**Thesis:** Warm tabletop miniature sports. Wood, cream, felt green/blue, painted red, warm lamp. The play surface lives on a desk. Visually incompatible with Swarm and Neon.

---

## 06 — Territory Rush

**Current:** weakest match. Checker districts still read as a technical grid. Paint does not dominate.

**References**
1. Paper.io 2 — trail risk and fill as the whole picture.
2. Splatoon — paint as world-state, not a HUD overlay.
3. Toy-city / board-game tables — blocks, plazas, parks as scale, not clutter.
4. Browser io territory games — high-key ground so ownership color wins.

**Borrow:** light ground, saturated ownership, obvious trail → close → fill wave.
**Do not copy:** Paper.io palette, hexagonal layouts, Splatoon characters.

**Thesis:** Bright paint / toy-city territory battle. Cream ground, saturated team colors, playful city dressing outside collision-critical paint. The capture wave is the spectacle. High-key, never a dark grid.

---

## 07 — Sky Stack

**Current:** closest to shippable. Still a dark-bottom stack screen with generic bars.

**References**
1. Monument Valley — architectural calm, pastel materials.
2. Alto's Odyssey — sky progression as the reward for height.
3. Stack / Stacktris — one-action physical readability.
4. Ceramic / stone architectural models — frosted edges, quiet highlights.

**Borrow:** evolving sky (dawn → day → gold → lavender dusk); ceramic/stone slabs; horizon.
**Do not copy:** sacred geometry puzzles, Alto's sandboarder, specific monuments.

**Thesis:** Serene vertical architecture / sky ritual. Keep one-tap clarity. Slabs feel ceramic/stone. Sky stays high-key even at height (lavender dusk, not a black void). Minimal HUD: height + streak.

---

## 08 — Crowd Control

**Current:** orange pills on a dark brown road. Gates are thin green bars. Peak mass is wider than before but still a graphic cluster.

**References**
1. Count Masters / crowd runners — arithmetic gates as the composition.
2. Arcade toy-runners — bright boulevard, plaza, park, finish arena.
3. Festival photography — banners, barriers, mixed crowd colors, daylight.
4. Browser runner readability — huge saturated +N / ×N signs.

**Borrow:** light road + grass + warm buildings + blue sky; multi-color pack; gates that dominate the decision.
**Do not copy:** specific gate art, character models, level layouts.

**Thesis:** Bright city-festival toy runner. Light concrete, park green, warm facades, blue sky. Crowd colors vary. 10 / 30 / 80 / 120 must look like different physical masses. A +30 gate must photograph as a before/after.

---

## Diversity lock

| Game | Key | Light | Warm | Forms |
| --- | --- | --- | --- | --- |
| Neon Drift | dark | no | sodium amber | hard road / architecture |
| Velocity Run | light | yes | safety orange | hard rooftop architecture |
| Swarm Protocol | dark | no | rust | organic infestation |
| Knockout Circuit | light | yes | yellow / coral | hard toy-mechanical |
| Pocket Striker | mid-key | yes | wood / felt | organic-rounded tactile |
| Territory Rush | light | yes | paint + cream | toy-city blocks |
| Sky Stack | light | yes (peach/gold) | ceramic pastel | architectural calm |
| Crowd Control | light | yes | festival warm | organic crowd + hard gates |

Dark: 2 (Neon, Swarm). Light/high-key: 6. Warm families: Pocket, Knockout, Crowd, Neon sodium, Territory paint. Organic: Swarm, Pocket, Crowd. Architectural/mechanical: Neon, Velocity, Knockout, Sky.

No two adjacent launcher titles share a palette family:
Neon (night asphalt) → Velocity (day roof) → Swarm (organic dark) → Knockout (toy show) → Pocket (table) → Territory (paint city) → Sky (pastel zen) → Crowd (festival).
