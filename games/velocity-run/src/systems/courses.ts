import { WORLD_1 } from "../levels/world-1";
import { WORLD_2 } from "../levels/world-2";
import { WORLD_3 } from "../levels/world-3";
import type { Course, Rect } from "./types";

export type { Course, Rect } from "./types";

export const COURSES: Course[] = [...WORLD_1, ...WORLD_2, ...WORLD_3];

export function medalFor(course: Course, timeMs: number): "platinum" | "gold" | "silver" | "bronze" | null {
  if (timeMs <= course.medals.platinum) return "platinum";
  if (timeMs <= course.medals.gold) return "gold";
  if (timeMs <= course.medals.silver) return "silver";
  if (timeMs <= course.medals.bronze) return "bronze";
  return null;
}

export function nextMedalTarget(course: Course, timeMs: number): { name: string; target: number; gap: number } | null {
  const order = [
    ["bronze", course.medals.bronze],
    ["silver", course.medals.silver],
    ["gold", course.medals.gold],
    ["platinum", course.medals.platinum],
  ] as const;
  for (const [name, target] of order) {
    if (timeMs > target) return { name, target, gap: timeMs - target };
  }
  return null;
}

export function checkpoints(course: Course): Rect[] {
  return course.solids.filter((s) => s.kind === "checkpoint");
}
