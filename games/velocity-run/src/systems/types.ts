export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "solid" | "spike" | "start" | "finish" | "hazard" | "checkpoint" | "laser" | "bar" | "piston";
  route?: "safe" | "fast" | "expert";
  phase?: number;
};

export type Course = {
  id: string;
  name: string;
  subtitle: string;
  world: "training" | "transit" | "ascent";
  width: number;
  height: number;
  theme: { sky: number; ground: number; accent: number; danger: number; bg: number };
  medals: { platinum: number; gold: number; silver: number; bronze: number };
  solids: Rect[];
};

export function S(x: number, y: number, w: number, h: number, route?: Rect["route"]): Rect {
  return { x, y, w, h, kind: "solid", route };
}
export function K(x: number, y: number, w: number, h: number, look: Rect["kind"] = "spike"): Rect {
  return { x, y, w, h, kind: look === "solid" ? "spike" : look };
}
export function F(x: number, y: number, w: number, h: number): Rect {
  return { x, y, w, h, kind: "finish" };
}
export function T(x: number, y: number, w: number, h: number): Rect {
  return { x, y, w, h, kind: "start" };
}
export function C(x: number, y: number, w: number, h: number): Rect {
  return { x, y, w, h, kind: "checkpoint" };
}
