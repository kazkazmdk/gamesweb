import { NEON } from "../config";

export type GhostSample = { t: number; x: number; y: number; a: number };

export type GhostTape = {
  trackId: string;
  score: number;
  duration: number;
  sectors: number[];
  samples: GhostSample[];
};

function key(trackId: string, mode: string) {
  return `${NEON.ghostKey}:${trackId}:${mode}`;
}

export function loadGhost(trackId: string, mode: string): GhostTape | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(key(trackId, mode));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GhostTape;
    if (!parsed?.samples?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveGhost(tape: GhostTape, mode: string) {
  try {
    const slim: GhostTape = {
      ...tape,
      samples: tape.samples.length > 2400 ? tape.samples.filter((_, i) => i % 2 === 0) : tape.samples,
    };
    localStorage.setItem(key(tape.trackId, mode), JSON.stringify(slim));
  } catch {
    /* quota */
  }
}

export class GhostRecorder {
  samples: GhostSample[] = [];
  private acc = 0;

  reset() {
    this.samples = [];
    this.acc = 0;
  }

  tick(dt: number, t: number, x: number, y: number, a: number) {
    this.acc += dt;
    if (this.acc < 1 / NEON.ghostHz) return;
    this.acc = 0;
    this.samples.push({ t, x, y, a });
  }
}

export function ghostPose(samples: GhostSample[], t: number): GhostSample | null {
  if (!samples.length) return null;
  if (t <= samples[0].t) return samples[0];
  const last = samples[samples.length - 1];
  if (t >= last.t) return last;
  let lo = 0;
  let hi = samples.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].t < t) lo = mid;
    else hi = mid;
  }
  const a = samples[lo];
  const b = samples[hi];
  const u = (t - a.t) / Math.max(0.0001, b.t - a.t);
  return {
    t,
    x: a.x + (b.x - a.x) * u,
    y: a.y + (b.y - a.y) * u,
    a: a.a + (b.a - a.a) * u,
  };
}

export function ghostEnabled(): boolean {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem(NEON.ghostToggleKey) !== "0";
}

export function setGhostEnabled(on: boolean) {
  try {
    localStorage.setItem(NEON.ghostToggleKey, on ? "1" : "0");
  } catch {
    /* noop */
  }
}
