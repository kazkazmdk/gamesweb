import type { GameEditorial } from "./types";

export const GAME_EDITORIAL: GameEditorial[] = [
  {
    slug: "neon-drift",
    kind: "Drift Game",
    hubTitle: "Neon Drift — Free Online Drift Game",
    hubDescription:
      "Arcade drift score-attack on three authored circuits. Hold the slide, skim the apex, and cash the combo before the grip comes back.",
    whyDistinct:
      "Neon is the only Gamesweb title that scores a live slip angle. Straightening out or dropping below drift speed fades the combo — there is no lap-time clock to hide behind.",
    run: [
      "A run is two laps on Harbour Loop, Hairpin District, or Ridge Sweep. Keys 1/2/3 switch tracks; G toggles the ghost.",
      "Score accrues only while you are sliding above the drift-speed floor. Angle, speed, near-misses, and boost ribbons multiply the bank.",
      "Combo steps up about every 0.62s of held drift, caps at 12×, and decays as soon as the car straightens.",
    ],
    guideLead:
      "Neon Drift is a two-lap arcade slide, not a sim. The useful skill is keeping the car sideways through authored sectors so the combo never resets.",
    howToLead:
      "Accelerate into the first corner, hold the slide, then countersteer so the angle stays alive through the apex.",
    controlsLead:
      "Keyboard or on-screen stick. Space is a handbrake, not a boost — it dumps grip so the next corner can enter drift.",
    strategy: [
      "Enter Harbour Loop wide, then tighten on the inner curb. The near-miss multiplier (1.48×) is worth more than a safe middle line.",
      "Do not mash the handbrake mid-combo. A short tap sets yaw; holding it kills speed below the 128 drift-speed floor and dumps Heat.",
      "Hairpin District is a commit/switch/recover track. If the combo dies in a hairpin, restart — a 1× second lap will not catch a clean ghost.",
      "Ridge Sweep pays for long held corners. Ride the boost ribbons at 0.22 and 0.63 of the lap so the 1.18× boost stack sits on top of combo.",
      "Ghosts are recorded lines, not live racers. Use G to learn where the previous PB straightened out.",
    ],
    scoring: {
      lead: "Score is a live drift bank, not a lap timer. Higher is better. Two laps close the circuit.",
      rules: [
        "Base bank is 860 points per second of valid drift, scaled by slip angle (capped) and speed versus a 390 reference.",
        "Near-miss the inner curb for a 1.48× multiplier. Boost ribbons add 1.18× while you are in the ribbon.",
        "Combo steps every 0.62s of held drift and caps at 12×. Straighten out or drop under speed 128 and the combo decays at 1.55/s.",
        "Achievements watch Heat 5 (5×), 25,000, 60,000, a near-miss bank, a grass rejoin, a boost ribbon, and a wall-free lap.",
      ],
    },
    tracks: [
      {
        id: "foundation",
        name: "Harbour Loop",
        subtitle: "Learn the slide",
        note: "Wide night harbour with sodium service bays. The teaching circuit — two boost ribbons and room to hold a first combo.",
      },
      {
        id: "technical",
        name: "Hairpin District",
        subtitle: "Commit, switch, recover",
        note: "Tighter mountain touge with vegetation pinching the camera. Combo dies if you hesitate in a switchback.",
      },
      {
        id: "velocity",
        name: "Ridge Sweep",
        subtitle: "Hold the long corner",
        note: "Long ridge with tunnel and underpass beats. Built for carrying 8×+ through one continuous slide.",
      },
    ],
  },
  {
    slug: "velocity-run",
    kind: "Parkour Game",
    hubTitle: "Velocity Run — Free Browser Parkour Game",
    hubDescription:
      "Twelve authored rooftop courses across HVAC training, crane transit, and comms ascent. Coyote time, jump buffering, and a restart that never argues.",
    whyDistinct:
      "Velocity is a time-attack rooftop parkour game. Checkpoints print split deltas; they do not save you. A death closes the attempt so the clock stays honest.",
    run: [
      "Reach the beacon. Lower time wins. Medals are bronze / silver / gold / platinum against authored targets.",
      "Safe ledges sit low. Fast ledges sit high. Expert skips skip the stairs. Keys 1/2/3 jump the first three courses; the hub lists all twelve.",
      "G toggles a ghost. R retries instantly. Fast-fall (S / ↓) is a commit, not a cancel.",
    ],
    guideLead:
      "Velocity Run is millisecond parkour on ivory/cobalt rooftops. The sport is routing — safe, fast, or expert — not surviving a clock that keeps running after a death.",
    howToLead:
      "Move, jump, and fast-fall to the beacon. First finishes usually land bronze or silver. Gold needs a line. Platinum is a clean ghost.",
    controlsLead:
      "A/D or arrows move. Space or Up jumps with coyote time and jump buffering. Down fast-falls. R is the real verb.",
    strategy: [
      "Learn Gate A on the safe low ledges, then take the high fast pads. The expert skip at the mid gap is the platinum tell.",
      "Checkpoints are split printers. If a split is already red, restart — the remaining course will not buy the medal back.",
      "Transit courses (Needle, Fan Corridor, Metro Core, Energy Gates) punish early jumps into movers. Wait for the phase, then commit.",
      "Ascent courses (Rushline, Wind Spine, Drop Gallery, Expert Ascent) are vertical. Fast-fall onto a pad; do not float past it.",
      "Deaths are designed. The retry loop is the skill surface, not a punishment screen.",
    ],
    scoring: {
      lead: "Lower time is better. Medals are authored per course, not a global curve.",
      rules: [
        "Gate A medals: platinum 32.00s, gold 38.00s, silver 46.00s, bronze 58.00s. Other courses have their own targets.",
        "A death closes the attempt. There is no checkpoint respawn.",
        "Splits compare against the loaded ghost. Beating a course PB twice unlocks Split Hunter.",
        "Course 1 under 40s unlocks Rush. Finishing all three worlds unlocks Three Gates.",
      ],
    },
    courses: [
      { id: "course-1", name: "Gate A", world: "training", subtitle: "Read the line", medals: "32.00 / 38.00 / 46.00 / 58.00" },
      { id: "course-1b", name: "Scaffold Run", world: "training", subtitle: "Up and across", medals: "28.00 / 34.00 / 42.00 / 52.00" },
      { id: "course-1c", name: "Arrow Yard", world: "training", subtitle: "Timing pads", medals: "authored rooftop HVAC" },
      { id: "course-1d", name: "Skyline Drill", world: "training", subtitle: "Long jumps", medals: "authored rooftop HVAC" },
      { id: "course-2", name: "Needle", world: "transit", subtitle: "Switchbacks", medals: "crane-transit corridor" },
      { id: "course-2b", name: "Fan Corridor", world: "transit", subtitle: "Push through", medals: "crane-transit corridor" },
      { id: "course-2c", name: "Metro Core", world: "transit", subtitle: "Moving walls", medals: "crane-transit corridor" },
      { id: "course-2d", name: "Energy Gates", world: "transit", subtitle: "Wait, then go", medals: "crane-transit corridor" },
      { id: "course-3", name: "Rushline", world: "ascent", subtitle: "Commit the gap", medals: "comms ascent" },
      { id: "course-3b", name: "Wind Spine", world: "ascent", subtitle: "Thin holds", medals: "comms ascent" },
      { id: "course-3c", name: "Drop Gallery", world: "ascent", subtitle: "Don't look down", medals: "comms ascent" },
      { id: "course-3d", name: "Expert Ascent", world: "ascent", subtitle: "One line", medals: "comms ascent" },
    ],
  },
  {
    slug: "swarm-protocol",
    kind: "Survival Game",
    hubTitle: "Swarm Protocol — Free Arena Survival Game",
    hubDescription:
      "Compact arena survival with auto-fire, readable silhouettes, and upgrades that rewrite the sixth minute. The Core ends the run.",
    whyDistinct:
      "Swarm is the long session. Five to eight minutes, a build that changes the gun, and a late Core — not a 60-second score attack.",
    run: [
      "Move. The weapon tracks the nearest hostiles. Cores level you; pick one of three upgrades.",
      "Dash has visible i-frames. Elites telegraph dashes. Splitters divide. The Core arrives late.",
      "Killing the Core is victory. Endless after the result screen is optional, not the ranking run.",
    ],
    guideLead:
      "Swarm Protocol is a six-minute arena. Skill lives in positioning, dash timing, and which three-of-many upgrades you stack — not in aiming.",
    howToLead:
      "WASD to move, Shift to dash. Auto-fire handles the rest so you can read silhouettes and leave a contrast pocket around the player.",
    controlsLead:
      "Move and dash are the only in-run verbs. 1/2/3 pick an upgrade when a core levels you. R restarts after death.",
    strategy: [
      "First two minutes are density, not damage. Take Magnetic Core or Protocol Tempo so cores and fire rate keep the pocket clear.",
      "Dash i-frames are a weapon. Through (dash-kill) is a real achievement — clip an elite during the white flash, do not panic-dash into a wall.",
      "Chain Surge and Fracture scale better than raw damage into the peak horde. Split Fire helps early, then plateaus.",
      "Orbital Collision and Pulse Ring buy space when the silhouette wall closes. Keep the player readable; do not stand in your own nova.",
      "The Core is the win condition. Do not spend the last minute kiting trash if the boss clock has started.",
    ],
    scoring: {
      lead: "Swarm Protocol's ranked salvage is kills times twelve, plus survival time divided by twenty, plus raw damage, plus a four-thousand bounty when the Core drops.",
      rules: [
        "Every hostile you drop adds exactly 12 salvage. The Clearance trophy at 200 kills is a separate badge and does not multiply this term.",
        "Elapsed survival is divided by 20 before it joins the bank, so a minute of kiting is a small add next to the bodies you actually drop.",
        "damageDone is summed unscaled. An upgrade raises this term only by the hits it lands, and a nova that misses the horde adds nothing.",
        "The Core bounty is a flat 4000, stamped once when the boss falls. Endless play after the result screen is not folded into that ranked salvage.",
      ],
    },
  },
  {
    slug: "sky-stack",
    kind: "Stacking Game",
    hubTitle: "Sky Stack — Free Stacking Game",
    hubDescription:
      "One-thumb climbing. Place the moving slab, keep the overlap, ride fever. A miss ends the climb.",
    whyDistinct:
      "Sky is the one-action game. No routing, no dash, no aim vector — only the moment you place the slab.",
    run: [
      "Tap, click, or press Space to place the moving slab on the tower.",
      "Perfect overlap keeps the full width and feeds the streak. Leftover overhang is sliced off.",
      "A miss ends the climb. Fever starts on a long perfect streak: pitch rises, score multiplies, the sky warms.",
    ],
    guideLead:
      "Sky Stack is a portrait climb. The only decision is when to place. Perfects keep width; misses are instant retries.",
    howToLead:
      "Watch the slab pass over the tower and place it. Perfects are full overlaps. Fever is a long perfect streak, not a separate mode.",
    controlsLead:
      "One action: Space, click, or tap places the slab. R retries. That is the whole map.",
    strategy: [],
    scoring: {
      lead: "Sky Stack pays the placement itself: 220 for a full-width perfect, 140 for a near cut, 80 for a thin keep, then a combo slope and a fever double.",
      rules: [
        "A perfect is an overlap of at least 96 percent of the moving width. The next rung keeps that full width and the sliced leftover is zero.",
        "A near cut sits between 82 and 96 percent. The overhang falls away, the combo still climbs, and the tower gets narrower.",
        "The combo slope is 0.18 per step: bank equals base times (1 + combo × 0.18). An ordinary 'ok' placement drops that combo by one.",
        "Fever begins on an eight-perfect streak and doubles the whole placement. A miss scores zero and ends the climb. Floor 30 and floor 67 are height badges, not extra multipliers.",
      ],
    },
  },
  {
    slug: "knockout-circuit",
    kind: "Obstacle Game",
    hubTitle: "Knockout Circuit — Free Obstacle Race Game",
    hubDescription:
      "Eight modular obstacle maps across Factory, Skyworks, and Signal Core. Move, jump, dash. Ghosts are recorded rivals, not live players.",
    whyDistinct:
      "Knockout is a toy-show obstacle race — saturated foam, hammers, discs, inflating gates. It is not rooftop parkour and not a live multiplayer lobby.",
    run: [
      "Reach the banner. Faster is better. Keys 1/2/3 switch the first maps; the hub lists all eight.",
      "Factory maps teach hammers and inflating gates. Skyworks adds movers and beams. Signal Core is the greedy shortcut world.",
      "Ghosts replay as position markers. They are recorded runs, labeled as ghosts.",
    ],
    guideLead:
      "Knockout Circuit is an obstacle race with eight authored maps. The verb set is move, jump, dash — and taking the expert shortcut when the ghost already committed.",
    howToLead:
      "Sprint to the finish banner. Dash (Shift) is a burst, not i-frames. A hazard hit costs time; Untouched is finishing without one.",
    controlsLead:
      "Same move/jump grammar as Velocity, plus Shift dash. The dash is why the two games still play differently on similar keys.",
    strategy: [
      "Starter Gates is a read of hammer / mover / inflate. Wait the inflate, then dash the landing — do not jump into a rising gate.",
      "Liftwell and Conveyor are vertical factory climbs. Dash only after a mover lines up; a wasted dash drops you onto a beam.",
      "Risk Line and Hammer Run pay for greedy high routes. If the ghost took the low safe line, you only win by taking the expert pad.",
      "Disc Yard, Tile Drop, and Bridge Rush are event maps. Silhouettes are large on purpose — route around the toy, do not thread it like Velocity spikes.",
    ],
    scoring: {
      lead: "Knockout Circuit ranks the banner clock in whole milliseconds. A shorter crossing wins, and a hazard scrape matters only because the clock never stops.",
      rules: [
        "The submitted score is the floored millisecond total. These eight maps have no point bank, no lap counter, and no stroke column.",
        "Hammers, beams, and inflating gates do not subtract a style score. They shove you off the foam, and recovery time stays on the clock.",
        "Shift dash is a speed burst, not a shield. Throwing it into a rising gate usually adds more milliseconds than the burst removes.",
        "A ghost is a position tape of a recorded run. Beating it means a lower millisecond total on that same map, not a higher trick score.",
      ],
    },
    courses: [
      {
        id: "map-a",
        name: "Starter Gates",
        world: "Factory",
        subtitle: "A 2800-wide factory floor: hammer spinner, sliding mover, inflating gate, then a disc before the finish banner.",
        medals: "Teaching clock. Lower milliseconds win.",
      },
      {
        id: "map-b",
        name: "Liftwell",
        world: "Factory",
        subtitle: "A vertical 2200-tall shaft of movers and beams. The banner sits near the top of the well, not at the right edge.",
        medals: "Climb clock. A wasted dash drops you a floor.",
      },
      {
        id: "map-c",
        name: "Risk Line",
        world: "Skyworks",
        subtitle: "A 3200-wide skyworks span with a high expert shelf over a safe floor line and a falling pad before the banner.",
        medals: "Greedy high line versus the low safe clock.",
      },
      {
        id: "map-d",
        name: "Hammer Run",
        world: "Factory",
        subtitle: "Pink factory lane packed with two large hammer spinners and a mid beam. The fast pads sit late, after the second spinner.",
        medals: "Spinner lane. Touching a hammer only costs time.",
      },
      {
        id: "map-e",
        name: "Disc Yard",
        world: "Signal Core",
        subtitle: "Signal-core yard of discs, one mover, and a narrow gate. The fast shelf is short and sits just before the last disc.",
        medals: "Disc yard clock across the signal floor.",
      },
      {
        id: "map-f",
        name: "Conveyor",
        world: "Factory",
        subtitle: "Paired movers back to back, then a beam, a spinner, and a late gate. The belt is the read, not a jump puzzle.",
        medals: "Belt clock. Wait for the second mover's phase.",
      },
      {
        id: "map-g",
        name: "Tile Drop",
        world: "Skyworks",
        subtitle: "Three falling tiles in a row over a skyworks floor, then a spinner. The fast pad is the only shelf that skips a drop.",
        medals: "Falling-tile clock. Standing on a tile as it goes is a time loss.",
      },
      {
        id: "map-h",
        name: "Bridge Rush",
        world: "Signal Core",
        subtitle: "The longest signal span: mover, beam, spinner, a fast shelf, an expert bridge, a falling pad, and a final gate.",
        medals: "Bridge clock. The expert pad is optional pace.",
      },
    ],
  },
  {
    slug: "pocket-striker",
    kind: "Physics Sports Game",
    hubTitle: "Pocket Striker — Free Physics Sports Game",
    hubDescription:
      "Eighteen authored tables across Workshop, Garden, and Arcade Lab. Pull back to aim, release to strike. Fewer strokes win.",
    whyDistinct:
      "Pocket is physics, not a runner. The sport is aim, power, and banks. A perfect is hole-out in one stroke.",
    run: [
      "Drag back from the striker to set aim and power. Release to shoot. The ball rides cushions until it stops or pockets.",
      "Fewer strokes win. A bank is cushion-then-pocket on the same stroke. Par is authored per table.",
      "Layouts run Workshop (Bench Bank, Vise Run, Clamp Arm…), Garden, then Arcade Lab (Neon Bank, Portal Pair, Pulse Circuit).",
    ],
    guideLead:
      "Pocket Striker is a short physics table. You do not time a gate or hold a drift — you pick a vector and live with the cushions.",
    howToLead:
      "Pull back, release, watch the bank. Retry is instant because the interesting decision is the next stroke, not a long life bar.",
    controlsLead:
      "Pointer only for the shot: drag to aim and set power, release to strike. R retries the table. Keyboard is not a movement map.",
    strategy: [
      "Bench Bank is a two-stroke par. The first shot should set a cushion; chasing a hero ace here is how you go three over.",
      "Moving blockers (Vise Run, Fountain Spin) want a late release so the window is opening, not closing.",
      "Garden tables (Hedge Cut, Trellis Gate, Grove Corridor) punish thin gaps. Soft power that dies near the hole beats a hard miss.",
      "Arcade Lab adds portals and pulse pads. Aim at the portal pair, not the hole, when Pulse Circuit is the daily.",
      "Aces unlock Ace. Banks unlock Cushion. Par or better unlocks Table Manners. None of those require a long combo.",
    ],
    scoring: {
      lead: "Pocket Striker ranks strokes on the table in front of you. Fewer putts beat par, a one-stroke hole-out is an ace, and twelve strokes without a pocket ends the attempt.",
      rules: [
        "The stored result is the stroke count, and lower wins. Bench Bank and Neon Bank print par 2, Vise Run and Fountain Spin print par 3, and Pulse Circuit prints par 4.",
        "A bank is cushion contact and then the pocket on that same stroke. It flags the Cushion badge; it does not multiply a point total.",
        "An ace is a hole-out with strokes equal to 1. It still posts as one on the lower-is-better board.",
        "If the striker is still loose after 12 strokes and has slowed under speed 8, the table closes as a miss. No clock bonus rescues it.",
      ],
    },
    courses: [
      {
        id: "l1",
        name: "Bench Bank",
        world: "Workshop",
        subtitle: "Par-2 workshop bench. The striker starts low-left, the pocket sits high-left, and a bumper plus an upward pad fill the middle.",
        medals: "Par 2. One stroke is an ace.",
      },
      {
        id: "l2",
        name: "Vise Run",
        world: "Workshop",
        subtitle: "Par-3 horizontal vise. A blocker slides on the vertical axis between two walls, so the window opens and closes on a timer.",
        medals: "Par 3. Late release, not a harder hit.",
      },
      {
        id: "l7",
        name: "Hedge Cut",
        world: "Garden",
        subtitle: "Par-2 garden gap. Two hedge posts leave a narrow mouth, and a round bumper sits on the line between striker and pocket.",
        medals: "Par 2. Soft pace dies nearer the hole.",
      },
      {
        id: "l10",
        name: "Fountain Spin",
        world: "Garden",
        subtitle: "Par-3 garden fountain. A long rotator sweeps the open green around a center bumper, with no wall to hide a hero line.",
        medals: "Par 3. Wait until the arm is leaving the mouth.",
      },
      {
        id: "l13",
        name: "Neon Bank",
        world: "Arcade Lab",
        subtitle: "Par-2 arcade bank. The pocket mirrors the striker on the left rail, with a bumper and a strong upward pad under the shelf.",
        medals: "Par 2. The pad is the bank, not the pocket.",
      },
      {
        id: "l14",
        name: "Portal Pair",
        world: "Arcade Lab",
        subtitle: "Par-2 arcade portals. A wall blocks the straight line, and the paired rings are the only path from the top-left start to the bottom-right pocket.",
        medals: "Par 2. Aim the ring, then the hole.",
      },
    ],
  },
  {
    slug: "territory-rush",
    kind: "Territory Game",
    hubTitle: "Territory Rush — Free Territory Capture Game",
    hubDescription:
      "A 90-second geometric arena. Leave a trail, close the loop, claim the fill. Bots are seeded opponents with tells — never fake humans.",
    whyDistinct:
      "Territory is area control. The spectacle is the fill wave when a loop closes, not a finish banner or a drift combo.",
    run: [
      "Move with WASD. Your trail is a claim in progress. Return to your color to close the loop and fill.",
      "Cut a bot trail to eliminate them. They can cut you the same way. Exposed trail is the risk.",
      "The clock is about 90 seconds. Majority is holding 50% of the arena. Bots are labeled bots in metadata.",
    ],
    guideLead:
      "Territory Rush is a paint-the-floor arena. The useful screenshot is a closed loop turning into owned color — not a toy city grid.",
    howToLead:
      "Leave your color, draw a loop, come home. Small safe bites early. Larger claims when bots are committed to their own trails.",
    controlsLead:
      "WASD or stick moves the claimant. There is no jump, dash, or aim. R retries the 90-second arena.",
    strategy: [
      "First claims should be shallow U-turns along your own border. Long diagonals across mid are how bots cut you.",
      "Watch bot tells: brick, needle, and sweep have different commit cadences. Cut while they are stretched, not while they are home.",
      "After a fill wave, sit on the new border for a beat. The next trail start is safest from freshly owned color.",
      "Majority (50%) is an achievement, not the only win. A 30% clean map with two cuts can still beat a greedy 45% death.",
    ],
    scoring: {
      lead: "Territory Rush turns the floor into a sum: owned percent times 400, plus 250 for each trail you cut, plus 8 times your largest fill, plus 40 for every closed loop in the chain.",
      rules: [
        "Owned percent is measured after each fill and scaled by 400. Half the arena is 200 points from this term before any cut is counted.",
        "Severing a bot trail adds 250. Getting your own exposed trail cut adds nothing and ends the claim.",
        "Only the single largest fill is multiplied by 8. Three timid bites lose this term to one deep loop.",
        "Each loop you close without being cut adds 40 to the chain term. The roughly ninety-second horn stops the sum; the horn itself is not the score.",
      ],
    },
  },
  {
    slug: "crowd-control",
    kind: "Crowd Runner",
    hubTitle: "Crowd Control — Free Crowd Runner Game",
    hubDescription:
      "A skill runner with a living count. Steer the pack through +N, ×N, and TAX gates, then cash a finish multiplier.",
    whyDistinct:
      "Crowd is arithmetic made physical. The pack compresses into a gate and re-expands after — a +30 or ×2 is readable from the mass, not a HUD toast.",
    run: [
      "Forward motion is automatic. You steer (A/D or drag) and dash (Shift).",
      "Gates add, multiply, or tax the crowd. Hidden left routes can be faster; right routes can be richer.",
      "Fights spend bodies. The finish multiplies whatever is still in the pack. Ghosts remember which route they took.",
    ],
    guideLead:
      "Crowd Control is a one-thumb runner whose score is the pack. The decision is which saturated gate you enter, not a lane of coins.",
    howToLead:
      "Steer into the gate you can afford. A ×4 on ten bodies beats a +30 on three. A TAX gate you cannot pay empties the parade.",
    controlsLead:
      "A/D or drag steers. Shift dashes. There is no jump. R retries the 45–75s rush.",
    strategy: [
      "Read the sign, not the road. Huge +N / ×N / TAX art is the composition — if you need the HUD, you are already late.",
      "×N gates want a fat pack. Do not take a ×4 at 6 bodies when a +20 sits on the other side.",
      "TAX is a filter. Take it only when the remaining count still clears the next fight.",
      "Hidden left cuts unlock Cut In. They are shorter, not always richer. Ghosts that finish with 80+ usually mixed a rich right with one cut.",
      "Dash is for compressing into a gate and for fights, not for skipping the arithmetic.",
    ],
    scoring: {
      lead: "Crowd Control cashes the pack that survives the boulevard: headcount times 120, times a finish tier from the remaining bodies, plus the distance the rush actually traveled.",
      rules: [
        "Finish tiers read the final headcount only: 12 bodies pay 1.5×, 24 pay 2×, 48 pay 3×, and 96 or more pay 4×. Under 12 the tier stays 1×.",
        "The posted number is finalPack × 120 × that tier, then plus traveled distance. A fat pack that dies in the last fight cashes the smaller headcount.",
        "A clash removes the smaller squad. Equal squads wipe both sides, so a fair fight posts a zero toward the finish tier.",
        "A boss drains bodies over time before the tier is chosen: 18 per second under 16 bodies, 10 under 28, and 4 once the pack is already fat.",
      ],
    },
  },
  {
    slug: "prism-drop",
    kind: "Merge Puzzle Game",
    hubTitle: "Prism Drop — Free Online Merge Puzzle Game",
    hubDescription:
      "Drop numbered neon prisms into a containment well, fuse equals from 2 through 2048, and spend Pulse Tilt before the stack crosses the lip.",
    whyDistinct:
      "Prism Drop is the only Gamesweb well where equal values synthesize and a shockwave can keep the reaction going. It is not a slab climb and not a stroke table.",
    run: [
      "A 2, 4, or 8 waits in the cradle. Slide it, then commit the drop so it lands beside its twin instead of sealing the mouth.",
      "Contact between equals replaces both with the next rung. The shockwave can bump a third pair before the pile goes still.",
      "Pulse Tilt leans the whole well. Overflow — any prism over the containment line — banks the ladder and ends the attempt.",
    ],
    guideLead:
      "Prism Drop is a vertical synthesis puzzle. Leave a matching neighbor under the cradle, and save the lean for a buried pair that gravity will not finish.",
    howToLead:
      "Slide the cradle, drop the prism, and lean the well only when two equals are one shove apart.",
    controlsLead:
      "The cradle slides sideways, the drop commits the prism, and Pulse Tilt leans the containment well. Clearing the pile does not change which rungs can fuse.",
    strategy: [
      "Keep crumbs of 2, 4, and 8 along one wall and park every 32-and-up rung in the opposite corner, or the next shockwave synthesizes the wrong pair.",
      "Do not lean on the first drops. An early Pulse Tilt opens a gap under the lip and the following prism has nowhere safe to sit.",
      "Line up a 16 merging into a 32 so the shockwave completes a second 32 beside it. Four fuses from one drop are the cascade the well is built to pay.",
      "The 512 and 1024 rungs are wide. Feed them with a vertical half-ladder, as a corner build would, except this pile can spill over the containment line.",
    ],
    scoring: {
      lead: "Prism Drop banks the rung you synthesize: values from 2 through 2048 pay when created, a fusion shockwave adds a bump, and an open chain multiplies the unsettled reaction.",
      rules: [
        "Creating a prism scores its face — 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, or 2048 — when a fusion synthesizes that rung, not when the cradle merely drops it.",
        "A fusion shockwave shoves neighbors. If it starts another equal-value contact before the pile sleeps, that next fusion joins the same chain.",
        "The chain multiplier climbs with each extra fusion from the unsettled shockwave, and it resets when the well goes still. Cascade Reactor is four or more merges from a single drop.",
        "Overflow across the containment lip banks the total and ends the attempt. The 2048 core is the top rung. Prisms that never fused do not pay a second time.",
      ],
    },
  },
  {
    slug: "swing-vector",
    kind: "Grapple Physics Game",
    hubTitle: "Swing Vector — Free Online Grapple Physics Game",
    hubDescription:
      "Latch a magnetic pylon, ride the pendulum, and release a charged Sonic Snap through the canyon's boost rings. Three gates, and a lower time wins.",
    whyDistinct:
      "Swing Vector is a tethered pendulum. Pace is stored by orbiting a pylon, then spent as a slingshot. It is not a drift car and not a rooftop jump.",
    run: [
      "Hold to latch the nearest magnetic pylon and stay on the arc. Air nudges only exist after you detach.",
      "Sonic Snap arms after the pendulum travels π × 1.35 radians. Release as that arc comes around so the exit threads a boost ring.",
      "Ion Gorge, Pendulum Vault, and Hyperion Trench each end at a finish gate. A fall keeps the millisecond clock running and scraps the clean run.",
    ],
    guideLead:
      "Swing Vector is a three-canyon grapple. The useful read is the release angle: a charged Sonic Snap should leave through a boost ring, not into the wall.",
    howToLead:
      "Hold the latch, finish the orbit when the roof allows the circle, then release toward the next pylon or ring.",
    controlsLead:
      "Holding keeps the tether on the magnetic pylon. Releasing spends the arc as a launch. Left and right are air nudges after you detach, not steering while you are latched.",
    strategy: [
      "Pump the pendulum through the bottom of the arc before you release. A Sonic Snap arms only after the bob has traveled π × 1.35 radians, and the top of a tired swing has already given that pace back.",
      "Pendulum Vault hides teeth under the cable. Stay attached through the charge, then leave before a hazard bar clips the rising bob.",
      "Boost rings sit on the exit, not on the anchor. Thread the slingshot through the ring while the 0.65s snap window is still open.",
      "Ion Gorge's nine pylons forgive a late latch. Hyperion Trench is 4200 long with thirteen anchors, so a short hop between rings falls to the floor.",
    ],
    scoring: {
      lead: "Swing Vector ranks each canyon clock in milliseconds. Platinum through bronze are authored per gate, and a charged Sonic Snap is a slingshot rather than a point multiplier.",
      rules: [
        "Lower finish time wins. Ion Gorge medals are platinum 16.00s, gold 20.00s, silver 26.00s, and bronze 34.00s.",
        "Pendulum Vault medals are 18.00 / 22.50 / 29.00 / 38.00. Hyperion Trench medals are 20.00 / 25.00 / 32.00 / 42.00. A fast gorge does not move the other two clocks.",
        "Sonic Snap arms when absolute pendulum travel reaches π × 1.35 radians. Releasing then adds about 190 horizontal pace and a 0.65s boost window. An early release is only the plain launch.",
        "Boost rings mark the exits: five in Ion Gorge, six in the Vault, seven in the Trench. The posted result is still the gate clock. Hypersonic is Ion Gorge under 24 seconds, between that canyon's gold and silver.",
      ],
    },
    courses: [
      {
        id: "canyon-1",
        name: "Ion Gorge",
        world: "Gorge",
        subtitle: "Warm the cable. Nine low pylons and five boost rings across 3400 of open gorge, with room to charge one Sonic Snap before the gate.",
        medals: "16.00 / 20.00 / 26.00 / 34.00",
      },
      {
        id: "canyon-2",
        name: "Pendulum Vault",
        world: "Vault",
        subtitle: "Charge the snap. Eleven anchors, six boost rings, and vault teeth across 3800. Clear the hazard bars while the orbit is still attached.",
        medals: "18.00 / 22.50 / 29.00 / 38.00",
      },
      {
        id: "canyon-3",
        name: "Hyperion Trench",
        world: "Trench",
        subtitle: "Three rivals, one gold cable. Thirteen pylons and seven boost rings across 4200. The gaps after each ring are longer than a timid hop.",
        medals: "20.00 / 25.00 / 32.00 / 42.00",
      },
    ],
  },
];

export function editorialFor(slug: string): GameEditorial {
  const row = GAME_EDITORIAL.find((g) => g.slug === slug);
  if (!row) throw new Error(`Missing editorial for ${slug}`);
  return row;
}
