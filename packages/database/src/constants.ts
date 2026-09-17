export const GAME_IDS = [
  "neon-drift",
  "velocity-run",
  "swarm-protocol",
  "sky-stack",
  "knockout-circuit",
  "pocket-striker",
  "territory-rush",
  "crowd-control",
] as const;
export type GameId = (typeof GAME_IDS)[number];

export const GAME_MODES: Record<GameId, readonly string[]> = {
  "neon-drift": ["foundation", "technical", "velocity", "daily", "circuit"],
  "velocity-run": [
    "course-1",
    "course-1b",
    "course-1c",
    "course-1d",
    "course-2",
    "course-2b",
    "course-2c",
    "course-2d",
    "course-3",
    "course-3b",
    "course-3c",
    "course-3d",
  ],
  "swarm-protocol": ["survival", "seed"],
  "sky-stack": ["climb", "daily"],
  "knockout-circuit": ["map-a", "map-b", "map-c", "map-d", "map-e", "map-f", "map-g", "map-h", "daily"],
  "pocket-striker": ["layout", "daily"],
  "territory-rush": ["arena", "daily"],
  "crowd-control": ["rush", "daily"],
};

export const VELOCITY_MEDALS: Record<
  string,
  { platinum: number; gold: number; silver: number; bronze: number }
> = {
  "course-1": { platinum: 32000, gold: 38000, silver: 46000, bronze: 58000 },
  "course-1b": { platinum: 28000, gold: 34000, silver: 42000, bronze: 52000 },
  "course-1c": { platinum: 30000, gold: 36000, silver: 44000, bronze: 54000 },
  "course-1d": { platinum: 34000, gold: 40000, silver: 48000, bronze: 60000 },
  "course-2": { platinum: 48000, gold: 56000, silver: 68000, bronze: 84000 },
  "course-2b": { platinum: 42000, gold: 50000, silver: 62000, bronze: 76000 },
  "course-2c": { platinum: 46000, gold: 54000, silver: 66000, bronze: 80000 },
  "course-2d": { platinum: 40000, gold: 48000, silver: 60000, bronze: 74000 },
  "course-3": { platinum: 68000, gold: 80000, silver: 96000, bronze: 118000 },
  "course-3b": { platinum: 62000, gold: 74000, silver: 90000, bronze: 110000 },
  "course-3c": { platinum: 58000, gold: 70000, silver: 86000, bronze: 104000 },
  "course-3d": { platinum: 72000, gold: 86000, silver: 104000, bronze: 126000 },
};

export const LOWER_IS_BETTER_GAMES = ["velocity-run", "knockout-circuit", "pocket-striker"] as const;

export const PRESENCE_STALE_MS = 2 * 60 * 1000;
export const MAX_SAVE_BYTES = 48_000;
export const MAX_METADATA_KEYS = 24;
export const MAX_SCORE_HISTORY = 400;
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const DISPLAY_NAME_MAX = 32;

export function isGameId(value: string): value is GameId {
  return (GAME_IDS as readonly string[]).includes(value);
}

export function defaultMode(gameId: string): string {
  if (gameId === "velocity-run") return "course-1";
  if (gameId === "swarm-protocol") return "survival";
  if (gameId === "sky-stack") return "climb";
  if (gameId === "knockout-circuit") return "map-a";
  if (gameId === "pocket-striker") return "layout";
  if (gameId === "territory-rush") return "arena";
  if (gameId === "crowd-control") return "rush";
  return "foundation";
}

export function lowerIsBetter(gameId: string): boolean {
  return (LOWER_IS_BETTER_GAMES as readonly string[]).includes(gameId);
}

export function medalForTime(mode: string, timeMs: number): "platinum" | "gold" | "silver" | "bronze" | null {
  const medals = VELOCITY_MEDALS[mode];
  if (!medals) return null;
  if (timeMs <= medals.platinum) return "platinum";
  if (timeMs <= medals.gold) return "gold";
  if (timeMs <= medals.silver) return "silver";
  if (timeMs <= medals.bronze) return "bronze";
  return null;
}
