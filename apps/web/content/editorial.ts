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
  },
];

export function editorialFor(slug: string): GameEditorial {
  const row = GAME_EDITORIAL.find((g) => g.slug === slug);
  if (!row) throw new Error(`Missing editorial for ${slug}`);
  return row;
}
