import { GAME_MODES, defaultMode, lowerIsBetter as gameLowerIsBetter } from "@gamesweb/database";

export type ModeOption = {
  id: string;
  label: string;
  hint?: string;
};

export const NEON_TRACKS: ModeOption[] = [
  { id: "0", label: "Harbour Loop", hint: "Learn the slide" },
  { id: "1", label: "Hairpin District", hint: "Commit, switch, recover" },
  { id: "2", label: "Ridge Sweep", hint: "Hold the long corner" },
];

export const VELOCITY_COURSES: ModeOption[] = [
  { id: "0", label: "Gate A", hint: "Course 1" },
  { id: "1", label: "Needle", hint: "Course 2" },
  { id: "2", label: "Rushline", hint: "Course 3" },
];

export const KNOCKOUT_MAPS: ModeOption[] = [
  { id: "0", label: "Starter Gates", hint: "Map A" },
  { id: "1", label: "Liftwell", hint: "Map B" },
  { id: "2", label: "Risk Line", hint: "Map C" },
];

export const POCKET_TABLES: ModeOption[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i),
  label: `Table ${i + 1}`,
}));

const BOARD_LABELS: Record<string, string> = {
  foundation: "Harbour Loop",
  technical: "Hairpin District",
  velocity: "Ridge Sweep",
  daily: "Daily",
  circuit: "Circuit",
  "course-1": "Gate A",
  "course-2": "Needle",
  "course-3": "Rushline",
  survival: "Survival",
  seed: "Seeded",
  climb: "Climb",
  "map-a": "Starter Gates",
  "map-b": "Liftwell",
  "map-c": "Risk Line",
  layout: "Table",
  arena: "Arena",
  rush: "Rush",
};

export const NEON_BOARD_MODES = ["foundation", "technical", "velocity"] as const;

export function neonBoardMode(index: number, daily = false) {
  if (daily) return "daily";
  return NEON_BOARD_MODES[index] ?? "foundation";
}

export function boardModeFromPlayIndex(gameId: string, index: number, daily = false) {
  if (gameId === "neon-drift") return neonBoardMode(index, daily);
  if (gameId === "velocity-run") return `course-${index + 1}`;
  if (gameId === "knockout-circuit") return (["map-a", "map-b", "map-c"][index] ?? "map-a");
  return defaultMode(gameId);
}

export function playIndexFromBoardMode(gameId: string, mode: string) {
  if (gameId === "neon-drift") {
    const i = NEON_BOARD_MODES.indexOf(mode as (typeof NEON_BOARD_MODES)[number]);
    return i >= 0 ? i : 0;
  }
  if (gameId === "velocity-run") {
    const n = Number(mode.replace("course-", ""));
    return Number.isFinite(n) ? Math.max(0, n - 1) : 0;
  }
  if (gameId === "knockout-circuit") {
    const i = ["map-a", "map-b", "map-c"].indexOf(mode);
    return i >= 0 ? i : 0;
  }
  if (gameId === "pocket-striker") {
    const n = Number(mode.replace("layout-", "").replace("layout", ""));
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }
  return 0;
}

export function boardModeLabel(gameId: string, mode: string) {
  return BOARD_LABELS[mode] ?? playModeOptions(gameId)[playIndexFromBoardMode(gameId, mode)]?.label ?? mode;
}

export function playModeOptions(gameId: string): ModeOption[] {
  if (gameId === "neon-drift") return NEON_TRACKS;
  if (gameId === "velocity-run") return VELOCITY_COURSES;
  if (gameId === "knockout-circuit") return KNOCKOUT_MAPS;
  if (gameId === "pocket-striker") return POCKET_TABLES;
  if (gameId === "sky-stack") return [{ id: "0", label: "Climb", hint: "Place the slab" }];
  if (gameId === "territory-rush") return [{ id: "0", label: "Arena", hint: "90 seconds" }];
  if (gameId === "crowd-control") return [{ id: "0", label: "Rush", hint: "Steer the pack" }];
  return [{ id: "0", label: "Survival", hint: "One protocol" }];
}

export function boardModeOptions(gameId: string): ModeOption[] {
  const modes = GAME_MODES[gameId as keyof typeof GAME_MODES] ?? ["circuit"];
  return modes.map((id) => ({ id, label: BOARD_LABELS[id] ?? id }));
}

export function defaultBoardMode(gameId: string) {
  return defaultMode(gameId);
}

export function lowerIsBetter(gameId: string) {
  return gameLowerIsBetter(gameId);
}

export function playStorageKey(gameId: string) {
  if (gameId === "neon-drift") return "gw:neon-track";
  if (gameId === "velocity-run") return "gw:velocity-course";
  return `gw:play-index:${gameId}`;
}

export function loadPlayIndex(gameId: string) {
  if (typeof window === "undefined") return 0;
  const raw = Number(localStorage.getItem(playStorageKey(gameId)) ?? 0);
  const max = playModeOptions(gameId).length - 1;
  if (!Number.isFinite(raw) || raw < 0) return 0;
  return Math.min(max, Math.round(raw));
}

export function savePlayIndex(gameId: string, index: number) {
  if (typeof window === "undefined") return;
  const max = playModeOptions(gameId).length - 1;
  const next = Math.max(0, Math.min(max, index));
  localStorage.setItem(playStorageKey(gameId), String(next));
}

export const COMPACT_CATALOG_LIMIT = 6;

export function isCompactCatalog(count: number) {
  return count <= COMPACT_CATALOG_LIMIT;
}
