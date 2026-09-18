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
  { id: "0", label: "Gate A", hint: "Training" },
  { id: "1", label: "Scaffold Run", hint: "Training" },
  { id: "2", label: "Arrow Yard", hint: "Training" },
  { id: "3", label: "Skyline Drill", hint: "Training" },
  { id: "4", label: "Needle", hint: "Transit" },
  { id: "5", label: "Fan Corridor", hint: "Transit" },
  { id: "6", label: "Metro Core", hint: "Transit" },
  { id: "7", label: "Energy Gates", hint: "Transit" },
  { id: "8", label: "Rushline", hint: "Ascent" },
  { id: "9", label: "Wind Spine", hint: "Ascent" },
  { id: "10", label: "Drop Gallery", hint: "Ascent" },
  { id: "11", label: "Expert Ascent", hint: "Ascent" },
];

export const KNOCKOUT_MAPS: ModeOption[] = [
  { id: "0", label: "Starter Gates", hint: "Factory" },
  { id: "1", label: "Liftwell", hint: "Factory" },
  { id: "2", label: "Risk Line", hint: "Skyworks" },
  { id: "3", label: "Hammer Run", hint: "Factory" },
  { id: "4", label: "Disc Yard", hint: "Signal" },
  { id: "5", label: "Conveyor", hint: "Factory" },
  { id: "6", label: "Tile Drop", hint: "Skyworks" },
  { id: "7", label: "Bridge Rush", hint: "Signal" },
];

export const POCKET_TABLES: ModeOption[] = [
  { id: "0", label: "Bench Bank", hint: "Workshop" },
  { id: "1", label: "Vise Run", hint: "Workshop" },
  { id: "2", label: "Clamp Arm", hint: "Workshop" },
  { id: "3", label: "Crate Break", hint: "Workshop" },
  { id: "4", label: "Shelf Gate", hint: "Workshop" },
  { id: "5", label: "Anvil Corner", hint: "Workshop" },
  { id: "6", label: "Hedge Cut", hint: "Garden" },
  { id: "7", label: "Stone Islands", hint: "Garden" },
  { id: "8", label: "Trellis Gate", hint: "Garden" },
  { id: "9", label: "Fountain Spin", hint: "Garden" },
  { id: "10", label: "Bridge Break", hint: "Garden" },
  { id: "11", label: "Grove Corridor", hint: "Garden" },
  { id: "12", label: "Neon Bank", hint: "Arcade Lab" },
  { id: "13", label: "Portal Pair", hint: "Arcade Lab" },
  { id: "14", label: "Lab Bounce", hint: "Arcade Lab" },
  { id: "15", label: "Arc Gate", hint: "Arcade Lab" },
  { id: "16", label: "Coil Sweep", hint: "Arcade Lab" },
  { id: "17", label: "Pulse Circuit", hint: "Arcade Lab" },
];

export const CROWD_ROUTES: ModeOption[] = [
  { id: "0", label: "Multiplier Sprint", hint: "Gates" },
  { id: "1", label: "Shortcut Risk", hint: "Risk" },
  { id: "2", label: "Crate Burst", hint: "Destroy" },
  { id: "3", label: "Attrition Lane", hint: "Crowds" },
  { id: "4", label: "Split Gates", hint: "Choices" },
  { id: "5", label: "Break and Clash", hint: "Destroy" },
  { id: "6", label: "Greedy Side", hint: "Shortcut" },
  { id: "7", label: "Guardian Gate", hint: "Boss" },
  { id: "8", label: "Wear Down", hint: "Attrition" },
  { id: "9", label: "Payoff Setup", hint: "Crowd" },
  { id: "10", label: "Destroy Corridor", hint: "Destroy" },
  { id: "11", label: "Late Guardian", hint: "Boss" },
  { id: "12", label: "Risky Sides", hint: "Risk" },
  { id: "13", label: "Break After Mult", hint: "Destroy" },
  { id: "14", label: "Reactor Finish", hint: "Boss payoff" },
];

export const TERRITORY_ARENAS: ModeOption[] = [
  { id: "0", label: "Circuit Floor", hint: "Clean geometry" },
  { id: "1", label: "Shatter Field", hint: "Broken channels" },
];

const BOARD_LABELS: Record<string, string> = {
  foundation: "Harbour Loop",
  technical: "Hairpin District",
  velocity: "Ridge Sweep",
  daily: "Daily",
  circuit: "Circuit",
  "course-1": "Gate A",
  "course-1b": "Scaffold Run",
  "course-1c": "Arrow Yard",
  "course-1d": "Skyline Drill",
  "course-2": "Needle",
  "course-2b": "Fan Corridor",
  "course-2c": "Metro Core",
  "course-2d": "Energy Gates",
  "course-3": "Rushline",
  "course-3b": "Wind Spine",
  "course-3c": "Drop Gallery",
  "course-3d": "Expert Ascent",
  survival: "Survival",
  seed: "Seeded",
  climb: "Climb",
  "map-a": "Starter Gates",
  "map-b": "Liftwell",
  "map-c": "Risk Line",
  "map-d": "Hammer Run",
  "map-e": "Disc Yard",
  "map-f": "Conveyor",
  "map-g": "Tile Drop",
  "map-h": "Bridge Rush",
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
  if (gameId === "velocity-run") return GAME_MODES["velocity-run"][index] ?? "course-1";
  if (gameId === "knockout-circuit") return GAME_MODES["knockout-circuit"][index] ?? "map-a";
  if (gameId === "pocket-striker") return "layout";
  if (gameId === "territory-rush") return "arena";
  if (gameId === "crowd-control") return "rush";
  return defaultMode(gameId);
}

export function playIndexFromBoardMode(gameId: string, mode: string) {
  if (gameId === "neon-drift") {
    const i = NEON_BOARD_MODES.indexOf(mode as (typeof NEON_BOARD_MODES)[number]);
    return i >= 0 ? i : 0;
  }
  if (gameId === "velocity-run") {
    const i = GAME_MODES["velocity-run"].indexOf(mode);
    return i >= 0 ? i : 0;
  }
  if (gameId === "knockout-circuit") {
    const i = GAME_MODES["knockout-circuit"].indexOf(mode);
    return i >= 0 ? i : 0;
  }
  if (gameId === "pocket-striker") {
    const n = Number(mode.replace("layout-", "").replace("layout", ""));
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }
  if (gameId === "territory-rush") return mode === "1" || mode === "shatter" ? 1 : 0;
  if (gameId === "crowd-control") {
    const n = Number(mode.replace("route-", "").replace("rush", ""));
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }
  return 0;
}

export function resolvePlayIndex(gameId: string, search = typeof window === "undefined" ? "" : window.location.search) {
  const q = new URLSearchParams(search.startsWith("?") || search.length === 0 ? search : `?${search}`);
  const raw = q.get("play") ?? q.get("mode");
  if (raw !== null && raw !== "") {
    if (Number.isFinite(Number(raw))) {
      const n = Number(raw);
      const max = playModeOptions(gameId).length - 1;
      return Math.max(0, Math.min(max, Math.round(n)));
    }
    return playIndexFromBoardMode(gameId, raw);
  }
  return loadPlayIndex(gameId);
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
  if (gameId === "territory-rush") return TERRITORY_ARENAS;
  if (gameId === "crowd-control") return CROWD_ROUTES;
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
