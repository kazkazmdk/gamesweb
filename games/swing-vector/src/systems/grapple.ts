/** Pure pendulum / grapple stepper. No Phaser, no clock, no randomness. */

export type AnchorNode = { id: number; x: number; y: number; r: number };

export type BoostRing = { id: number; x: number; y: number; r: number; hit?: boolean };

export type HazardBar = { x: number; y: number; w: number; h: number };

export type SwingCourse = {
  id: string;
  name: string;
  subtitle: string;
  length: number;
  ceilingY: number;
  floorY: number;
  medals: { platinum: number; gold: number; silver: number; bronze: number };
  anchors: AnchorNode[];
  rings: BoostRing[];
  hazards: HazardBar[];
};

export type PilotState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  attachedId: number | null;
  ropeLen: number;
  angleAccum: number;
  prevAngle: number;
  slingshotReady: boolean;
  boostTimer: number;
};

const SWING_GRAVITY = 1120;
const FREE_GRAVITY = 920;
const AIR_ACCEL = 260;
const BOTTOM_PUMP = 1.04;
const SNAP_ARC = Math.PI * 1.35;
const MAX_TANGENT = 720;

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function wrapDelta(next: number, prev: number) {
  let d = next - prev;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function anchorNode(id: number, x: number, y: number, r = 26): AnchorNode {
  return { id, x, y, r };
}

function boostRing(id: number, x: number, y: number, r = 36): BoostRing {
  return { id, x, y, r, hit: false };
}

function hazard(x: number, y: number, w: number, h: number): HazardBar {
  return { x, y, w, h };
}

export const COURSES: SwingCourse[] = [
  {
    id: "canyon-1",
    name: "Ion Gorge",
    subtitle: "Warm the cable. Trust the gold.",
    length: 3400,
    ceilingY: 72,
    floorY: 668,
    medals: { platinum: 16000, gold: 20000, silver: 26000, bronze: 34000 },
    anchors: [
      anchorNode(1, 280, 148),
      anchorNode(2, 620, 186),
      anchorNode(3, 960, 132),
      anchorNode(4, 1300, 198),
      anchorNode(5, 1660, 140),
      anchorNode(6, 2020, 176),
      anchorNode(7, 2380, 126),
      anchorNode(8, 2740, 188),
      anchorNode(9, 3080, 142),
    ],
    rings: [
      boostRing(1, 460, 430),
      boostRing(2, 800, 468),
      boostRing(3, 1480, 452),
      boostRing(4, 2200, 476),
      boostRing(5, 2920, 444),
    ],
    hazards: [
      hazard(500, 622, 30, 46),
      hazard(980, 618, 34, 50),
      hazard(1460, 624, 30, 44),
      hazard(1980, 620, 36, 48),
      hazard(2500, 626, 32, 42),
      hazard(3020, 620, 30, 48),
      hazard(1120, 214, 150, 14),
      hazard(2360, 206, 160, 14),
    ],
  },
  {
    id: "canyon-2",
    name: "Pendulum Vault",
    subtitle: "Charge the snap. Clear the vault teeth.",
    length: 3800,
    ceilingY: 64,
    floorY: 688,
    medals: { platinum: 18000, gold: 22500, silver: 29000, bronze: 38000 },
    anchors: [
      anchorNode(1, 260, 136),
      anchorNode(2, 560, 198),
      anchorNode(3, 900, 124),
      anchorNode(4, 1240, 206),
      anchorNode(5, 1580, 132),
      anchorNode(6, 1940, 192),
      anchorNode(7, 2300, 118),
      anchorNode(8, 2660, 204),
      anchorNode(9, 3020, 128),
      anchorNode(10, 3380, 188),
      anchorNode(11, 3680, 140),
    ],
    rings: [
      boostRing(1, 420, 470, 38),
      boostRing(2, 1080, 500),
      boostRing(3, 1760, 460),
      boostRing(4, 2480, 510),
      boostRing(5, 3200, 468),
      boostRing(6, 3560, 420),
    ],
    hazards: [
      hazard(480, 642, 32, 46),
      hazard(1040, 638, 36, 50),
      hazard(1620, 646, 30, 42),
      hazard(2200, 640, 38, 48),
      hazard(2780, 648, 32, 40),
      hazard(3340, 642, 36, 46),
      hazard(1280, 228, 140, 14),
      hazard(2560, 216, 150, 14),
    ],
  },
  {
    id: "canyon-3",
    name: "Hyperion Trench",
    subtitle: "Three rivals. One gold cable.",
    length: 4200,
    ceilingY: 58,
    floorY: 700,
    medals: { platinum: 20000, gold: 25000, silver: 32000, bronze: 42000 },
    anchors: [
      anchorNode(1, 240, 128),
      anchorNode(2, 540, 196),
      anchorNode(3, 840, 112),
      anchorNode(4, 1160, 204),
      anchorNode(5, 1480, 120),
      anchorNode(6, 1820, 190),
      anchorNode(7, 2140, 108),
      anchorNode(8, 2480, 200),
      anchorNode(9, 2820, 118),
      anchorNode(10, 3160, 194),
      anchorNode(11, 3500, 124),
      anchorNode(12, 3840, 188),
      anchorNode(13, 4100, 136),
    ],
    rings: [
      boostRing(1, 400, 456),
      boostRing(2, 1000, 492),
      boostRing(3, 1660, 448),
      boostRing(4, 2320, 500),
      boostRing(5, 2980, 452),
      boostRing(6, 3620, 486),
      boostRing(7, 3980, 420),
    ],
    hazards: [
      hazard(460, 654, 32, 46),
      hazard(1080, 650, 36, 50),
      hazard(1680, 656, 30, 44),
      hazard(2300, 652, 38, 48),
      hazard(2920, 658, 32, 42),
      hazard(3520, 652, 36, 48),
      hazard(1400, 220, 150, 14),
      hazard(2680, 208, 160, 14),
      hazard(3920, 226, 120, 14),
    ],
  },
];

export function findNearestAnchor(px: number, py: number, anchors: AnchorNode[], maxDist = 360): AnchorNode | null {
  let best: AnchorNode | null = null;
  let bestD = maxDist;
  for (const anchor of anchors) {
    const d = Math.hypot(px - anchor.x, py - anchor.y);
    if (d <= bestD) {
      best = anchor;
      bestD = d;
    }
  }
  return best;
}

function stepAttached(pilot: PilotState, anchor: AnchorNode, dt: number, airNudge: number) {
  const fresh = pilot.attachedId !== anchor.id || pilot.ropeLen < 8;
  if (fresh) {
    const dist0 = Math.hypot(pilot.x - anchor.x, pilot.y - anchor.y);
    pilot.ropeLen = clamp(dist0, 78, 336);
    const ang0 = Math.atan2(pilot.x - anchor.x, pilot.y - anchor.y);
    pilot.prevAngle = ang0;
    pilot.angleAccum = 0;
    pilot.slingshotReady = false;
    pilot.attachedId = anchor.id;
    pilot.x = anchor.x + Math.sin(ang0) * pilot.ropeLen;
    pilot.y = anchor.y + Math.cos(ang0) * pilot.ropeLen;
  }

  const length = pilot.ropeLen;
  const theta = Math.atan2(pilot.x - anchor.x, pilot.y - anchor.y);
  const tx = Math.cos(theta);
  const ty = -Math.sin(theta);
  let vt = pilot.vx * tx + pilot.vy * ty;
  // Tangential gravity. θ = 0 hangs straight down; the bob accelerates back toward it.
  vt += -SWING_GRAVITY * Math.sin(theta) * dt;
  vt += airNudge * 180 * dt;
  vt = clamp(vt, -MAX_TANGENT, MAX_TANGENT);

  let next = theta + (vt / length) * dt;
  const crossingBottom = theta * next < 0 && Math.abs(theta) < 1.2 && Math.abs(next) < 1.2;
  if (crossingBottom) {
    vt = clamp(vt * BOTTOM_PUMP, -MAX_TANGENT, MAX_TANGENT);
    next = theta + (vt / length) * dt;
  }
  next = Math.atan2(Math.sin(next), Math.cos(next));

  // Swing travel (absolute), so a real arc charges Sonic Snap instead of cancelling on the return.
  pilot.angleAccum += Math.abs(wrapDelta(next, theta));
  pilot.prevAngle = next;
  if (Math.abs(pilot.angleAccum) >= SNAP_ARC) pilot.slingshotReady = true;

  // Rigid ring at ropeLen, with a few pixels of elastic give under centripetal load.
  const stretch = clamp((vt * vt) / (length * 140000), 0, 0.045);
  const radius = length * (1 + stretch);
  pilot.x = anchor.x + Math.sin(next) * radius;
  pilot.y = anchor.y + Math.cos(next) * radius;
  const tx2 = Math.cos(next);
  const ty2 = -Math.sin(next);
  pilot.vx = tx2 * vt;
  pilot.vy = ty2 * vt;
  pilot.attachedId = anchor.id;
}

export function stepSwing(
  pilot: PilotState,
  anchor: AnchorNode | null,
  dt: number,
  holding: boolean,
  airNudge = 0,
): { released: boolean; sonicSnap: boolean; speed: number } {
  const step = Number.isFinite(dt) && dt > 0 ? dt : 0;
  let released = false;
  let sonicSnap = false;

  if (holding && anchor) {
    stepAttached(pilot, anchor, step, airNudge);
    if (pilot.boostTimer > 0) pilot.boostTimer = Math.max(0, pilot.boostTimer - step);
  } else if (!holding && pilot.attachedId != null) {
    released = true;
    sonicSnap = pilot.slingshotReady;
    pilot.vx = Math.max(pilot.vx + 85, 290);
    pilot.vy -= 65;
    if (sonicSnap) {
      pilot.vx += 190;
      pilot.vy -= 90;
      pilot.boostTimer = 0.65;
    }
    pilot.attachedId = null;
    pilot.ropeLen = 0;
    pilot.angleAccum = 0;
    pilot.prevAngle = 0;
    pilot.slingshotReady = false;
    pilot.x += pilot.vx * step;
    pilot.y += pilot.vy * step;
  } else {
    if (pilot.attachedId != null) {
      pilot.attachedId = null;
      pilot.ropeLen = 0;
      pilot.angleAccum = 0;
      pilot.prevAngle = 0;
      pilot.slingshotReady = false;
    }
    pilot.vy += FREE_GRAVITY * step;
    pilot.vx += airNudge * AIR_ACCEL * step;
    if (pilot.boostTimer > 0) pilot.boostTimer = Math.max(0, pilot.boostTimer - step);
    pilot.x += pilot.vx * step;
    pilot.y += pilot.vy * step;
  }

  return { released, sonicSnap, speed: Math.hypot(pilot.vx, pilot.vy) };
}

/** Magnetic floor / ceiling cushions. Minimum forward speed only applies on a bounce. */
export function applyMagneticCushions(pilot: PilotState, ceilingY: number, floorY: number): "ceiling" | "floor" | null {
  if (pilot.attachedId != null) return null;
  const pad = 26;
  if (pilot.y <= ceilingY + pad) {
    pilot.y = ceilingY + pad;
    pilot.vy = Math.abs(pilot.vy) * 0.55 + 36;
    pilot.vx = Math.max(pilot.vx, 250);
    return "ceiling";
  }
  if (pilot.y >= floorY - pad) {
    pilot.y = floorY - pad;
    pilot.vy = -Math.abs(pilot.vy) * 0.55 - 72;
    pilot.vx = Math.max(pilot.vx, 250);
    return "floor";
  }
  return null;
}

export function medalFor(course: SwingCourse, timeMs: number): "platinum" | "gold" | "silver" | "bronze" | null {
  if (timeMs <= course.medals.platinum) return "platinum";
  if (timeMs <= course.medals.gold) return "gold";
  if (timeMs <= course.medals.silver) return "silver";
  if (timeMs <= course.medals.bronze) return "bronze";
  return null;
}
