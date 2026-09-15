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

const BOARD_LABELS: Record<string, string> = {
  circuit: "Circuit",
  daily: "Daily",
  "course-1": "Gate A",
  "course-2": "Needle",
  "course-3": "Rushline",
  survival: "Survival",
};

export function playModeOptions(gameId: string): ModeOption[] {
  if (gameId === "neon-drift") return NEON_TRACKS;
  if (gameId === "velocity-run") return VELOCITY_COURSES;
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
  return "gw:swarm-mode";
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
