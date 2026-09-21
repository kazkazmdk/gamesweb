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
  sector: number;
};

export type TrackTheme = {
  sky: number;
  asphalt: number;
  asphaltHi: number;
  barrier: number;
  accent: number;
  grass: number;
  mark: number;
  building: number;
  pole: number;
};

export type TrackDef = {
  id: "foundation" | "technical" | "velocity";
  name: string;
  subtitle: string;
  worldW: number;
  worldH: number;
  theme: TrackTheme;
  points: Vec[];
  widthAt: (t: number) => number;
  boostAt: number[];
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

export const TRACKS: TrackDef[] = [
  {
    id: "foundation",
    name: "Harbour Loop",
    subtitle: "Learn the slide",
    worldW: 3600,
    worldH: 2400,
    theme: {
      sky: 0x1c1408,
      asphalt: 0x2c2824,
      asphaltHi: 0x4a4236,
      barrier: 0xa88848,
      accent: 0xe35aa0,
      grass: 0x0e2430,
      mark: 0xf6e2b0,
      building: 0x1a1820,
      pole: 0xffc14a,
    },
    points: [
      { x: 780, y: 1280 },
      { x: 1040, y: 820 },
      { x: 1480, y: 620 },
      { x: 1980, y: 560 },
      { x: 2460, y: 720 },
      { x: 2780, y: 1040 },
      { x: 2860, y: 1420 },
      { x: 2620, y: 1760 },
      { x: 2140, y: 1920 },
      { x: 1640, y: 1980 },
      { x: 1180, y: 1860 },
      { x: 860, y: 1620 },
    ],
    widthAt: (t) => {
      if (t > 0.16 && t < 0.28) return 210;
      if (t > 0.58 && t < 0.72) return 198;
      return 268;
    },
    boostAt: [0.22, 0.63],
  },
  {
    id: "technical",
    name: "Hairpin District",
    subtitle: "Commit, switch, recover",
    worldW: 2600,
    worldH: 2800,
    theme: {
      sky: 0x08140e,
      asphalt: 0x222820,
      asphaltHi: 0x334034,
      barrier: 0x4a3824,
      accent: 0xff8a3a,
      grass: 0x143018,
      mark: 0xe8f0d8,
      building: 0x0c1810,
      pole: 0xff9a3a,
    },
    points: [
      { x: 520, y: 1680 },
      { x: 680, y: 980 },
      { x: 980, y: 560 },
      { x: 1380, y: 720 },
      { x: 1520, y: 1280 },
      { x: 1240, y: 1640 },
      { x: 1560, y: 1980 },
      { x: 1980, y: 1860 },
      { x: 2140, y: 2280 },
      { x: 1860, y: 2520 },
      { x: 1320, y: 2580 },
      { x: 860, y: 2360 },
      { x: 580, y: 2060 },
      { x: 500, y: 1860 },
    ],
    widthAt: (t) => {
      if (t > 0.2 && t < 0.38) return 122;
      if (t > 0.48 && t < 0.62) return 108;
      if (t > 0.74 && t < 0.86) return 128;
      return 158;
    },
    boostAt: [0.34, 0.79],
  },
  {
    id: "velocity",
    name: "Ridge Sweep",
    subtitle: "Hold the long corner",
    worldW: 4200,
    worldH: 2100,
    theme: {
      sky: 0x061018,
      asphalt: 0x1c242c,
      asphaltHi: 0x2c3844,
      barrier: 0x8aa0a8,
      accent: 0x7ad0ff,
      grass: 0x0c1c18,
      mark: 0xd8e8f0,
      building: 0x0e1820,
      pole: 0x9ad8ff,
    },
    points: [
      { x: 640, y: 1080 },
      { x: 1180, y: 620 },
      { x: 1860, y: 480 },
      { x: 2620, y: 540 },
      { x: 3280, y: 780 },
      { x: 3680, y: 1120 },
      { x: 3520, y: 1480 },
      { x: 2920, y: 1680 },
      { x: 2280, y: 1760 },
      { x: 1640, y: 1680 },
      { x: 1080, y: 1480 },
      { x: 720, y: 1280 },
    ],
    widthAt: (t) => {
      if (t > 0.08 && t < 0.42) return 236;
      if (t > 0.55 && t < 0.78) return 208;
      return 276;
    },
    boostAt: [0.18, 0.7],
  },
];

export function buildTrack(def: TrackDef, reverse = false): TrackSample[] {
  const pts = reverse ? [...def.points].reverse() : def.points;
  const n = pts.length;
  const samples: TrackSample[] = [];
  const steps = 16;
  for (let i = 0; i < n; i += 1) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    for (let s = 0; s < steps; s += 1) {
      const a = catmull(p0, p1, p2, p3, s / steps);
      const t = samples.length / (n * steps);
      samples.push({
        x: a.x,
        y: a.y,
        tx: 1,
        ty: 0,
        nx: 0,
        ny: 1,
        width: def.widthAt(t),
        boost: false,
        sector: Math.min(2, Math.floor(t * 3)),
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
  for (const t of def.boostAt) {
    const i = Math.floor(t * samples.length);
    for (let k = -2; k <= 3; k += 1) {
      const s = samples[(i + k + samples.length) % samples.length];
      if (s) s.boost = true;
    }
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
  index: number;
  lateral: number;
};

export function queryTrack(samples: TrackSample[], x: number, y: number): TrackQuery {
  let best = 1e9;
  let idx = 0;
  const n = samples.length;
  for (let i = 0; i < n; i += 1) {
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
  if (s.boost && dist < half * 0.42) surface = "boost";
  else if (dist > half) surface = "grass";
  return {
    dist,
    half,
    nx: Math.sign(lateral || 1) * s.nx,
    ny: Math.sign(lateral || 1) * s.ny,
    surface,
    nearest: s,
    progress: idx / n,
    index: idx,
    lateral,
  };
}

export function startPose(samples: TrackSample[]) {
  const s = samples[10] ?? samples[0];
  return { x: s.x, y: s.y, angle: Math.atan2(s.ty, s.tx) };
}

export function loadTrackIndex(): number {
  if (typeof localStorage === "undefined") return 0;
  const n = Number(localStorage.getItem("gw:neon-track") ?? 0);
  return Number.isFinite(n) ? Math.max(0, Math.min(2, n | 0)) : 0;
}

export function saveTrackIndex(i: number) {
  try {
    localStorage.setItem("gw:neon-track", String(i));
  } catch {
    /* private mode */
  }
}
