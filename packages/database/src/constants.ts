export const GAME_IDS = ["neon-drift", "velocity-run", "swarm-protocol"] as const;
export type GameId = (typeof GAME_IDS)[number];

export const GAME_MODES: Record<GameId, readonly string[]> = {
  "neon-drift": ["foundation", "technical", "velocity", "daily", "circuit"],
  "velocity-run": ["course-1", "course-2", "course-3"],
  "swarm-protocol": ["survival"],
};

export const VELOCITY_MEDALS: Record<
  string,
  { platinum: number; gold: number; silver: number; bronze: number }
> = {
  "course-1": { platinum: 32000, gold: 38000, silver: 46000, bronze: 58000 },
  "course-2": { platinum: 48000, gold: 56000, silver: 68000, bronze: 84000 },
  "course-3": { platinum: 68000, gold: 80000, silver: 96000, bronze: 118000 },
};

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
  return "foundation";
}

export function lowerIsBetter(gameId: string): boolean {
  return gameId === "velocity-run";
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
