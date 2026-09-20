import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import type { SeoEntry } from "./types";

const DAY = "2026-09-20";

const HUB_COPY: Record<
  string,
  { title: string; h1: string; description: string; intent: string; summary: string; sections: SeoEntry["sections"]; faqs: SeoEntry["faqs"]; collections: string[]; guides: string[]; related: string[] }
> = {
  "neon-drift": {
    title: "Neon Drift — Free Browser Drift Game | Gamesweb",
    h1: "Neon Drift",
    description: "Midnight touge score-attack. Hold the slide, grow LIVE, bank the combo. Harbour, District, and Ridge in the browser.",
    intent: "Play or learn the only Gamesweb drift title.",
    summary: "Arcade drift. Magenta is race identity. The world is asphalt, sodium, and a real roadside.",
    collections: ["score-attack-games", "skill-games", "ghost-race-games"],
    guides: ["guide:neon-drift:how-to-drift", "guide:neon-drift:live-vs-banked", "guide:neon-drift:scoring", "guide:neon-drift:tracks"],
    related: ["velocity-run", "knockout-circuit"],
    sections: [
      { heading: "What kind of game is it?", body: "A 60–90 second drift score-attack. Higher is better. Ghosts and dailies are on. It is not a sim and not a night-neon abstract." },
      { heading: "How to play", body: "Accelerate into the first corner and hold a slide. Countersteer to keep the angle. Near-miss the inner curb. Straighten on a straight to bank. Two laps finish the circuit." },
      { heading: "Scoring", body: "LIVE is the pot. BANKED is the score. Combo multiplies the pot. A zero result says No score banked — only on this title." },
      { heading: "Tracks", body: "Harbour is service/industrial. District is tunnel/urban edge. Ridge is mountain touge. 1 / 2 / 3 switch them." },
      { heading: "What makes it different", body: "The expensive decision is when to bank. A pretty LIVE that never cashes is a hollow run." },
    ],
    faqs: [
      { q: "Why did my combo drop?", a: "You straightened, dropped below drift speed, or hit a wall." },
      { q: "I already played once. Why is the tutorial back?", a: "The key is now gw:neon-tutorial-v2 so returning players see HOLD → COMBO → BANK." },
    ],
  },
  "velocity-run": {
    title: "Velocity Run — Free Browser Parkour Game | Gamesweb",
    h1: "Velocity Run",
    description: "Rooftop parkour time-attack. Coyote time, medals, HVAC roofs, construction, and comms towers. Death closes the attempt.",
    intent: "Play or learn the parkour time-attack.",
    summary: "Milliseconds are the sport. Three course families that should photograph as three places.",
    collections: ["time-attack-games", "precision-games", "ghost-race-games"],
    guides: ["guide:velocity-run:beginner-movement", "guide:velocity-run:coyote-time", "guide:velocity-run:medals", "guide:velocity-run:courses"],
    related: ["knockout-circuit", "neon-drift"],
    sections: [
      { heading: "What kind of game is it?", body: "A 30–90 second platformer. Lower time is better. Twelve authored courses in three kits." },
      { heading: "How to play", body: "Run, jump, fast-fall. Safe ledges sit low. Fast ledges sit high. Expert skips are optional. R retries." },
      { heading: "Scoring", body: "The clock. Medals are Bronze through Platinum on each course. A zero result says No finish recorded." },
      { heading: "Courses", body: "Training = HVAC roofs and ivory concrete. Transit = amber construction and cranes. Ascent = indigo comms towers." },
      { heading: "What makes it different", body: "Checkpoints print splits. They do not save you. That is why the clock is honest." },
    ],
    faqs: [
      { q: "What are medals?", a: "Time gates per course. Platinum is a clean ghost." },
      { q: "Do checkpoints save me?", a: "No. A death closes the attempt." },
    ],
  },
  "swarm-protocol": {
    title: "Swarm Protocol — Free Browser Survivor | Gamesweb",
    h1: "Swarm Protocol",
    description: "Organic sci-fi arena survivor. Auto-fire, dash i-frames, upgrades, then the Core. Six to eight minutes.",
    intent: "Play or learn the only survivor we ship.",
    summary: "Salvage deck, not a night road. Peak should feel crowded.",
    collections: ["survival-and-arena", "score-attack-games", "competitive-browser-games"],
    guides: ["guide:swarm-protocol:beginner-survival", "guide:swarm-protocol:upgrades", "guide:swarm-protocol:enemy-types", "guide:swarm-protocol:core-boss"],
    related: ["territory-rush", "crowd-control"],
    sections: [
      { heading: "What kind of game is it?", body: "A compact arena survivor. Higher is better. Same-seed challenges compare builds." },
      { heading: "How to play", body: "Move. The gun tracks. Pick one of three upgrades. Dash has visible i-frames. Kill the Core." },
      { heading: "Scoring", body: "Kills, time, elites, Core. A zero result says No survival score." },
      { heading: "Enemies", body: "Skitterers, darts, swarmers, spores, shell tanks, splitters, elites, warden, Core." },
      { heading: "What makes it different", body: "It is the only predominantly dark game besides Neon, and it must not look like a road." },
    ],
    faqs: [
      { q: "Is aiming required?", a: "Not at first. Skill is positioning, dash, and the build." },
      { q: "How long is a run?", a: "Usually five to eight minutes." },
    ],
  },
  "knockout-circuit": {
    title: "Knockout Circuit — Free Browser Obstacle Race | Gamesweb",
    h1: "Knockout Circuit",
    description: "Toy industrial game-show. Foam arms, rollers, pistons, eight maps, recorded ghosts. Faster is better.",
    intent: "Play or learn the obstacle race.",
    summary: "A child should see the spinning thing. Ghosts make a solo heat look like a race.",
    collections: ["arcade-games", "time-attack-games", "ghost-race-games"],
    guides: ["guide:knockout-circuit:obstacles", "guide:knockout-circuit:timing", "guide:knockout-circuit:routes", "guide:knockout-circuit:ghosts"],
    related: ["velocity-run", "crowd-control"],
    sections: [
      { heading: "What kind of game is it?", body: "A 45–120 second obstacle race. Lower time is better. Eight authored maps." },
      { heading: "How to play", body: "Move, jump, dash. Reach the banner. 1 / 2 / 3 switch early maps." },
      { heading: "Scoring", body: "Finish time. A zero result says Eliminated before scoring." },
      { heading: "Obstacles", body: "Giant arms, foam rollers, punch pistons, conveyors, crushers, fans, finish gate." },
      { heading: "What makes it different", body: "It shares daylight with Velocity but not the architecture. This is a toy show. Velocity is rooftop parkour." },
    ],
    faqs: [{ q: "Are the other runners live?", a: "No. They are ghosts of recorded runs." }],
  },
  "pocket-striker": {
    title: "Pocket Striker — Free Browser Tabletop Game | Gamesweb",
    h1: "Pocket Striker",
    description: "Warm tabletop physics. Aim, power, bank. Eighteen tables. Fewer strokes win.",
    intent: "Play or learn the table game.",
    summary: "Wood, felt, lamp. Incompatible with Neon and Swarm on purpose.",
    collections: ["precision-games", "quick-games", "arcade-games"],
    guides: ["guide:pocket-striker:aiming", "guide:pocket-striker:rebounds", "guide:pocket-striker:scoring", "guide:pocket-striker:precision"],
    related: ["sky-stack", "territory-rush"],
    sections: [
      { heading: "What kind of game is it?", body: "A 30–90 second physics table. Lower strokes win. Workshop, Garden, Arcade Lab." },
      { heading: "How to play", body: "Drag back to aim. Release to strike. Ride cushions. R retries." },
      { heading: "Scoring", body: "Strokes. Ace is one. Bank is cushion then pocket. A zero result says No points scored." },
      { heading: "Tables", body: "18 authored layouts. Themes change furniture, not the hole rule." },
      { heading: "What makes it different", body: "The desk is the world. The shot is the spectacle." },
    ],
    faqs: [
      { q: "What is a perfect?", a: "Hole-out in one stroke." },
      { q: "What is a bank?", a: "Cushion, then pocket, on that stroke." },
    ],
  },
  "territory-rush": {
    title: "Territory Rush — Free Browser Territory Game | Gamesweb",
    h1: "Territory Rush",
    description: "90-second paint arena. Draw a loop, take the floor. Bots are labeled. Paint is the sport.",
    intent: "Play or learn the territory loop.",
    summary: "Cream ground, saturated ownership, a fill wave you can photograph.",
    collections: ["survival-and-arena", "score-attack-games"],
    guides: ["guide:territory-rush:how-territory-works", "guide:territory-rush:trail-risk", "guide:territory-rush:percentage", "guide:territory-rush:opponents"],
    related: ["crowd-control", "swarm-protocol"],
    sections: [
      { heading: "What kind of game is it?", body: "A ~90 second arena. Higher paint percent is better. Toy City and Plaza." },
      { heading: "How to play", body: "Leave your color, trail, return, fill. Cut a bot trail to eliminate them." },
      { heading: "Scoring", body: "Percent, cuts, largest capture, combo. A zero result says No territory secured." },
      { heading: "Opponents", body: "BRICK, NEEDLE, SWEEP — deterministic bots, never fake humans." },
      { heading: "What makes it different", body: "The capture wave is the spectacle. Houses are context." },
    ],
    faqs: [{ q: "Are the others players?", a: "No. They are labeled bots." }],
  },
  "sky-stack": {
    title: "Sky Stack — Free Browser Stacking Game | Gamesweb",
    h1: "Sky Stack",
    description: "One-tap zen stacker. Perfect overlap, fever streaks, dawn-to-dusk sky. 20–90 seconds.",
    intent: "Play or learn the one-button climb.",
    summary: "Ceramic slabs. Height is a place. Dusk never goes black.",
    collections: ["one-thumb-games", "quick-games", "score-attack-games"],
    guides: ["guide:sky-stack:perfect-placement", "guide:sky-stack:streaks", "guide:sky-stack:high-stack", "guide:sky-stack:atmosphere"],
    related: ["pocket-striker", "crowd-control"],
    sections: [
      { heading: "What kind of game is it?", body: "A one-thumb high-score. Higher floors win. Daily and challenges share seeds." },
      { heading: "How to play", body: "Tap, click, or Space to place. Perfect keeps width. A miss ends the climb." },
      { heading: "Scoring", body: "Floors and streak. A zero result says No stack score." },
      { heading: "Atmosphere", body: "Dawn, day, gold, lavender dusk. Materials shift as you climb." },
      { heading: "What makes it different", body: "It is the calm title. The skill is still one expensive tap." },
    ],
    faqs: [{ q: "What is fever?", a: "A long perfect streak. Pitch rises, score multiplies, the sky warms." }],
  },
  "crowd-control": {
    title: "Crowd Control — Free Browser Crowd Runner | Gamesweb",
    h1: "Crowd Control",
    description: "Festival toy runner. Steer the pack, pick huge +N / ×N gates, cash a finish multiplier. 45–75 seconds.",
    intent: "Play or learn the crowd runner.",
    summary: "If you pass there, the crowd grows. The sign has to say so.",
    collections: ["arcade-games", "one-thumb-games", "score-attack-games"],
    guides: ["guide:crowd-control:gates", "guide:crowd-control:multipliers", "guide:crowd-control:preservation", "guide:crowd-control:high-population"],
    related: ["knockout-circuit", "territory-rush"],
    sections: [
      { heading: "What kind of game is it?", body: "A skill runner. Higher pack × finish multiplier is better. Ghosts remember the lane." },
      { heading: "How to play", body: "Forward is automatic. Steer. Take a gate. Avoid a 0 pack. Dash is Shift." },
      { heading: "Scoring", body: "Pack size and finish buckets. A zero result says Run ended before scoring." },
      { heading: "Gates", body: "Add, multiply, subtract, divide. Green versus red. Left versus right." },
      { heading: "What makes it different", body: "10 / 30 / 80 / 120 must look like different physical masses." },
    ],
    faqs: [{ q: "Is it auto-run?", a: "Forward motion is automatic. Lane, gate, fight, and dash are on you." }],
  },
};

export function gameHubEntries(): SeoEntry[] {
  return GAME_MANIFESTS.map((game) => {
    const copy = HUB_COPY[game.id];
    return {
      id: `game:${game.id}`,
      kind: "game-hub" as const,
      path: `/games/${game.slug}`,
      slug: game.slug,
      title: copy.title,
      description: copy.description,
      h1: copy.h1,
      intent: copy.intent,
      summary: copy.summary,
      sections: copy.sections,
      faqs: copy.faqs,
      relatedGameIds: copy.related,
      relatedGuideIds: copy.guides,
      relatedCollectionIds: copy.collections,
      publishedAt: DAY,
      updatedAt: DAY,
      indexable: true,
      image: game.hero,
      gameId: game.id,
    };
  });
}

export function hubCopy(gameId: string) {
  return HUB_COPY[gameId];
}
