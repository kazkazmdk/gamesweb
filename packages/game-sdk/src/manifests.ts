import type { AchievementDefinition, GameManifest } from "./types";

const platformAchievements: AchievementDefinition[] = [
  { key: "first-run", name: "First Run", description: "Finish any game once.", xp: 20 },
  { key: "three-worlds", name: "Three Worlds", description: "Play all three launch games.", xp: 80 },
  { key: "on-fire", name: "On Fire", description: "Beat a personal record three times.", xp: 60 },
  { key: "night-shift", name: "Night Shift", description: "Play after midnight.", xp: 25 },
  { key: "explorer", name: "Explorer", description: "Play two genres in one session.", xp: 40 },
  { key: "return-tomorrow", name: "Return Tomorrow", description: "Keep a 2-day streak.", xp: 35 },
  { key: "weekender", name: "Weekender", description: "Reach a 7-day streak.", xp: 90 },
  { key: "social-spark", name: "Social Spark", description: "Copy an invite link.", xp: 15 },
];

export const neonDriftManifest: GameManifest = {
  id: "neon-drift",
  slug: "neon-drift",
  title: "Neon Drift",
  tagline: "Hold the slide. Bank the score.",
  description:
    "Arcade drift score-attack. Keep the angle, skim the apex, and cash the combo before the grip comes back.",
  genre: "Driving",
  tags: ["drift", "score-attack", "arcade", "solo"],
  accent: "#e35aa0",
  accentSoft: "#3a1428",
  orientation: "landscape",
  inputMethods: ["keyboard", "touch"],
  thumbnail: "/art/neon-drift-card.svg",
  hero: "/art/neon-drift-hero.svg",
  heroImage: "/art/neon-drift-hero.svg",
  tileImage: "/art/neon-drift-card.svg",
  backdropImage: "/art/neon-drift-hero.svg",
  media: {
    backdrop: "/art/neon-drift-hero.svg",
    tile: "/art/neon-drift-card.svg",
    hero: "/art/neon-drift-hero.svg",
  },
  version: "1.1.0",
  supportedDevices: ["desktop", "laptop", "tablet", "mobile"],
  minPlayers: 1,
  maxPlayers: 1,
  sessionHint: "60–90 sec runs",
  howToPlay: [
    "Accelerate into the first corner and hold a slide.",
    "Steer into the drift, then countersteer to keep the angle alive.",
    "Near-miss the inner curb and chain sectors to beat your ghost.",
    "Two laps finish the circuit. R retries instantly. 1/2/3 switch tracks.",
  ],
  controls: [
    { input: "W / ↑", action: "Accelerate" },
    { input: "S / ↓", action: "Brake" },
    { input: "A D / ← →", action: "Steer" },
    { input: "Space", action: "Handbrake" },
    { input: "1 2 3", action: "Switch track" },
    { input: "G", action: "Toggle ghost" },
    { input: "R", action: "Restart" },
  ],
  faq: [
    { q: "Why did my combo drop?", a: "The combo fades when you straighten out or drop below drift speed." },
    { q: "Is this a simulator?", a: "No. It is an arcade slide with weight, grip transitions, and a retry loop." },
  ],
  achievements: [
    { key: "first-slide", name: "First Slide", description: "Enter a drift.", xp: 15 },
    { key: "combo-5", name: "Heat 5", description: "Reach a 5x combo.", xp: 25 },
    { key: "score-25k", name: "Pink Line", description: "Score 25,000 in one run.", xp: 30 },
    { key: "score-60k", name: "Night Apex", description: "Score 60,000 in one run.", xp: 50 },
    { key: "two-laps", name: "Clean Circuit", description: "Finish two laps.", xp: 25 },
    { key: "near-miss", name: "Paint Swap", description: "Bank a near-miss bonus.", xp: 20 },
    { key: "grass-survive", name: "Dirt Warning", description: "Rejoin asphalt after grass.", xp: 15 },
    { key: "boost-gate", name: "Gatekeeper", description: "Hit a boost ribbon.", xp: 15 },
    { key: "no-crash-lap", name: "Quiet Hands", description: "Complete a lap without a wall hit.", xp: 35 },
    { key: "daily-drift", name: "Evening Line", description: "Finish the daily drift target.", xp: 30 },
  ],
};

export const velocityRunManifest: GameManifest = {
  id: "velocity-run",
  slug: "velocity-run",
  title: "Velocity Run",
  tagline: "Milliseconds are the sport.",
  description:
    "Precision parkour. Three short courses, coyote time, jump buffering, and a restart that never argues.",
  genre: "Platformer",
  tags: ["parkour", "time-attack", "precision", "solo"],
  accent: "#3ec6e8",
  accentSoft: "#0c2430",
  orientation: "landscape",
  inputMethods: ["keyboard", "touch"],
  thumbnail: "/art/velocity-run-card.svg",
  hero: "/art/velocity-run-hero.svg",
  heroImage: "/art/velocity-run-hero.svg",
  tileImage: "/art/velocity-run-card.svg",
  backdropImage: "/art/velocity-run-hero.svg",
  media: {
    backdrop: "/art/velocity-run-hero.svg",
    tile: "/art/velocity-run-card.svg",
    hero: "/art/velocity-run-hero.svg",
  },
  version: "1.1.0",
  supportedDevices: ["desktop", "laptop", "tablet", "mobile"],
  minPlayers: 1,
  maxPlayers: 1,
  sessionHint: "30–90 sec",
  howToPlay: [
    "Reach the beacon. Faster is better.",
    "Safe ledges sit low. Fast ledges sit high. Expert skips skip the stairs.",
    "Checkpoints print split deltas against your ghost. Death restarts instantly.",
    "R retries. 1/2/3 switch courses. G toggles ghost.",
  ],
  controls: [
    { input: "A D / ← →", action: "Move" },
    { input: "Space / ↑", action: "Jump" },
    { input: "S / ↓", action: "Fast fall" },
    { input: "1 2 3", action: "Switch course" },
    { input: "G", action: "Toggle ghost" },
    { input: "R", action: "Restart" },
  ],
  faq: [
    { q: "What are medals?", a: "Bronze, Silver, Gold, Platinum — first finishes land bronze/silver. Gold needs a line. Platinum is a clean ghost." },
    { q: "Do checkpoints save me?", a: "No. They print splits. A death is a full reset so the clock stays honest." },
  ],
  achievements: [
    { key: "first-finish", name: "Beacon", description: "Finish any course.", xp: 15 },
    { key: "bronze", name: "Bronze Pulse", description: "Earn a bronze medal.", xp: 15 },
    { key: "gold", name: "Gold Line", description: "Earn a gold medal.", xp: 35 },
    { key: "platinum", name: "Author", description: "Earn a platinum medal.", xp: 70 },
    { key: "all-courses", name: "Three Gates", description: "Finish all three courses.", xp: 40 },
    { key: "no-death", name: "Clean Air", description: "Finish a course without dying.", xp: 30 },
    { key: "sub-40", name: "Rush", description: "Finish Course 1 under 40s.", xp: 25 },
    { key: "fast-fall", name: "Commit", description: "Use a fast fall mid-run.", xp: 10 },
    { key: "retry-10", name: "One More", description: "Retry a course 10 times in a session.", xp: 20 },
    { key: "pb-twice", name: "Split Hunter", description: "Beat a course PB twice.", xp: 30 },
  ],
};

export const swarmProtocolManifest: GameManifest = {
  id: "swarm-protocol",
  slug: "swarm-protocol",
  title: "Swarm Protocol",
  tagline: "Survive the protocol. Break the swarm.",
  description:
    "Compact arena survival. Auto-fire, readable silhouettes, and upgrades that rewrite the sixth minute.",
  genre: "Survival",
  tags: ["survival", "arena", "roguelite", "solo"],
  accent: "#f07a3a",
  accentSoft: "#2a140c",
  orientation: "landscape",
  inputMethods: ["keyboard", "mouse", "touch"],
  thumbnail: "/art/swarm-protocol-card.svg",
  hero: "/art/swarm-protocol-hero.svg",
  heroImage: "/art/swarm-protocol-hero.svg",
  tileImage: "/art/swarm-protocol-card.svg",
  backdropImage: "/art/swarm-protocol-hero.svg",
  media: {
    backdrop: "/art/swarm-protocol-hero.svg",
    tile: "/art/swarm-protocol-card.svg",
    hero: "/art/swarm-protocol-hero.svg",
  },
  version: "1.1.0",
  supportedDevices: ["desktop", "laptop", "tablet", "mobile"],
  minPlayers: 1,
  maxPlayers: 1,
  sessionHint: "6–8 min",
  howToPlay: [
    "Move. The weapon tracks the nearest hostiles.",
    "Cores level you up. Pick one of three upgrades — builds rewrite the run.",
    "Dash has visible i-frames. Elite dashes telegraph. The Core arrives late.",
    "R retries after death. 1/2/3 pick upgrades.",
  ],
  controls: [
    { input: "WASD / arrows", action: "Move" },
    { input: "Shift", action: "Dash" },
    { input: "1 2 3", action: "Pick upgrade" },
    { input: "Esc", action: "Pause" },
    { input: "R", action: "Restart after death" },
  ],
  faq: [
    { q: "Is aiming required?", a: "Not at first. Auto-fire keeps the skill in positioning, dash timing, and builds." },
    { q: "How long is a run?", a: "Most runs resolve between five and eight minutes." },
  ],
  achievements: [
    { key: "first-blood", name: "First Blood", description: "Defeat 10 hostiles.", xp: 10 },
    { key: "survive-2", name: "Warm Protocol", description: "Survive 2 minutes.", xp: 20 },
    { key: "survive-5", name: "Deep Protocol", description: "Survive 5 minutes.", xp: 40 },
    { key: "level-8", name: "Rewritten", description: "Reach player level 8 in a run.", xp: 35 },
    { key: "elite", name: "Marked", description: "Defeat an elite.", xp: 25 },
    { key: "splitter", name: "Division", description: "Defeat a splitter.", xp: 15 },
    { key: "dash-kill", name: "Through", description: "Defeat an enemy during dash i-frames.", xp: 20 },
    { key: "kills-200", name: "Clearance", description: "Defeat 200 hostiles in one run.", xp: 40 },
    { key: "shield", name: "Orbit", description: "Pick the orbiting shield.", xp: 15 },
    { key: "chain", name: "Cascade", description: "Pick chain.", xp: 15 },
  ],
};

export const GAME_MANIFESTS: GameManifest[] = [
  neonDriftManifest,
  velocityRunManifest,
  swarmProtocolManifest,
];

export const PLATFORM_ACHIEVEMENTS = platformAchievements;

export function getManifest(slug: string): GameManifest | undefined {
  return GAME_MANIFESTS.find((game) => game.slug === slug || game.id === slug);
}

export function allAchievements(): Array<AchievementDefinition & { gameId: string | null }> {
  const list: Array<AchievementDefinition & { gameId: string | null }> = platformAchievements.map(
    (a) => ({ ...a, gameId: null }),
  );
  for (const game of GAME_MANIFESTS) {
    for (const a of game.achievements) list.push({ ...a, gameId: game.id });
  }
  return list;
}
