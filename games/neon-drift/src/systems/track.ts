import type { Surface } from "./vehicle";

export type Vec = { x: number; y: number };

export type TrackSample = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  nx: number;
  ny: number;
  width: number;
  boost: boolean;
};

function catmull(p0: Vec, p1: Vec, p2: Vec, p3: Vec, t: number): Vec {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
}

const LOOP: Vec[] = [
  { x: 720, y: 1180 },
  { x: 980, y: 740 },
  { x: 1480, y: 560 },
  { x: 1980, y: 620 },
  { x: 2420, y: 820 },
  { x: 2620, y: 1180 },
  { x: 2480, y: 1560 },
  { x: 2040, y: 1780 },
  { x: 1560, y: 1860 },
  { x: 1120, y: 1760 },
  { x: 820, y: 1500 },
];

function widthAt(i: number, n: number): number {
  const t = i / n;
  if (t > 0.18 && t < 0.3) return 176;
  if (t > 0.55 && t < 0.7) return 168;
  return 228;
}

export function buildTrack(reverse = false): TrackSample[] {
  const pts = reverse ? [...LOOP].reverse() : LOOP;
  const n = pts.length;
  const samples: TrackSample[] = [];
  const steps = 18;
  for (let i = 0; i < n; i += 1) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    for (let s = 0; s < steps; s += 1) {
      const a = catmull(p0, p1, p2, p3, s / steps);
      samples.push({
        x: a.x,
        y: a.y,
        tx: 1,
        ty: 0,
        nx: 0,
        ny: 1,
        width: widthAt(samples.length, n * steps),
        boost: false,
      });
    }
  }
  for (let i = 0; i < samples.length; i += 1) {
    const n1 = samples[(i + 1) % samples.length];
    const dx = n1.x - samples[i].x;
    const dy = n1.y - samples[i].y;
    const len = Math.hypot(dx, dy) || 1;
    samples[i].tx = dx / len;
    samples[i].ty = dy / len;
    samples[i].nx = -samples[i].ty;
    samples[i].ny = samples[i].tx;
  }
  for (const i of [40, 41, 42, 130, 131]) {
    if (samples[i]) samples[i].boost = true;
  }
  return samples;
}

export type TrackQuery = {
  dist: number;
  half: number;
  nx: number;
  ny: number;
  surface: Surface;
  nearest: TrackSample;
  progress: number;
};

export function queryTrack(samples: TrackSample[], x: number, y: number): TrackQuery {
  let best = 1e9;
  let idx = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const s = samples[i];
    const d = (s.x - x) * (s.x - x) + (s.y - y) * (s.y - y);
    if (d < best) {
      best = d;
      idx = i;
    }
  }
  const s = samples[idx];
  const lx = x - s.x;
  const ly = y - s.y;
  const lateral = lx * s.nx + ly * s.ny;
  const dist = Math.abs(lateral);
  const half = s.width * 0.5;
  let surface: Surface = "asphalt";
  if (s.boost && dist < half * 0.45) surface = "boost";
  else if (dist > half) surface = "grass";
  return {
    dist,
    half,
    nx: Math.sign(lateral || 1) * s.nx,
    ny: Math.sign(lateral || 1) * s.ny,
    surface,
    nearest: s,
    progress: idx / samples.length,
  };
}

export function startPose(samples: TrackSample[]) {
  const s = samples[8];
  return { x: s.x, y: s.y, angle: Math.atan2(s.ty, s.tx) };
}
