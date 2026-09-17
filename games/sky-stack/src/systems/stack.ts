export type Slab = { x: number; w: number; y: number };

export type PlaceKind = "perfect" | "near" | "ok" | "miss";

export type PlaceResult = {
  kind: PlaceKind;
  next: Slab | null;
  leftover: number;
  overlap: number;
};

export function placeSlab(moving: Slab, top: Slab, perfectRatio = 0.96, nearRatio = 0.82): PlaceResult {
  const left = Math.max(moving.x, top.x);
  const right = Math.min(moving.x + moving.w, top.x + top.w);
  const overlap = right - left;
  if (overlap <= 6) return { kind: "miss", next: null, leftover: 0, overlap };
  const ratio = overlap / Math.max(1, moving.w);
  const y = top.y - 28;
  if (ratio >= perfectRatio) {
    return { kind: "perfect", next: { x: top.x, w: moving.w, y }, leftover: 0, overlap };
  }
  if (ratio >= nearRatio) {
    const w = Math.max(18, overlap);
    return { kind: "near", next: { x: left, w, y }, leftover: moving.w - w, overlap };
  }
  const w = Math.max(16, overlap);
  return { kind: "ok", next: { x: left, w, y }, leftover: moving.w - w, overlap };
}

export function slabScore(kind: PlaceKind, combo: number, fever: boolean) {
  const base = kind === "perfect" ? 220 : kind === "near" ? 140 : kind === "ok" ? 80 : 0;
  return Math.round(base * (1 + combo * 0.18) * (fever ? 2 : 1));
}
