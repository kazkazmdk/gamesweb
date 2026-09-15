export type GhostSample = { t: number; x: number; y: number; a?: number };

export type GhostTape = {
  courseId: string;
  timeMs: number;
  splits: number[];
  samples: GhostSample[];
};

function key(courseId: string) {
  return `gw:velocity-ghost:${courseId}`;
}

export function loadGhost(courseId: string): GhostTape | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(key(courseId));
    if (!raw) return null;
    return JSON.parse(raw) as GhostTape;
  } catch {
    return null;
  }
}

export function saveGhost(tape: GhostTape) {
  try {
    localStorage.setItem(key(tape.courseId), JSON.stringify(tape));
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
  tick(dt: number, t: number, x: number, y: number) {
    this.acc += dt;
    if (this.acc < 0.08) return;
    this.acc = 0;
    this.samples.push({ t, x, y });
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
  return { t, x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
}

export function ghostEnabled() {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem("gw:velocity-ghost-on") !== "0";
}

export function setGhostEnabled(on: boolean) {
  try {
    localStorage.setItem("gw:velocity-ghost-on", on ? "1" : "0");
  } catch {
    /* noop */
  }
}
