export const WELL_W = 360;
export const WELL_H = 520;
export const DANGER_Y = 88;

const COLORS = [
  0x38bdf8, // 2
  0x34d399, // 4
  0xa3e635, // 8
  0xfacc15, // 16
  0xfb923c, // 32
  0xf87171, // 64
  0xf472b6, // 128
  0xa78bfa, // 256
  0x60a5fa, // 512
  0xe879f9, // 1024
  0xfef08a, // 2048
] as const;

export const TIERS: ReadonlyArray<{ tier: number; value: number }> = Array.from({ length: 11 }, (_, i) => {
  const tier = i + 1;
  return { tier, value: 2 ** tier };
});

export type PrismPiece = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  tier: number;
  rot: number;
  vr: number;
  age: number;
  flash: number;
};

export type MergeEvent = {
  x: number;
  y: number;
  newTier: number;
  value: number;
  chain: number;
};

type ChainMemory = { chain: number; calm: number };

const chainMemory = new WeakMap<PrismPiece[], ChainMemory>();
const overflowTime = new WeakMap<PrismPiece, number>();

const GRAVITY = 880;
const SUBSTEPS = 4;
const MERGE_SLOP = 1.5;
const SHOCK_RADIUS = 130;
const SHOCK_PUSH = 420;
const MAX_SPEED = 900;

export function tierValue(tier: number): number {
  return Math.pow(2, Math.max(1, Math.min(11, tier)));
}

/** Linear radius from 16 (tier 1 / 2) to 68 (tier 11 / 2048). */
export function tierRadius(tier: number): number {
  const t = Math.max(1, Math.min(11, tier));
  return 16 + ((t - 1) * (68 - 16)) / 10;
}

export function tierColor(tier: number): number {
  const t = Math.max(1, Math.min(11, Math.round(tier)));
  return COLORS[t - 1] ?? COLORS[0];
}

function memoryOf(pieces: PrismPiece[]): ChainMemory {
  let memory = chainMemory.get(pieces);
  if (!memory) {
    memory = { chain: 0, calm: 0 };
    chainMemory.set(pieces, memory);
  }
  return memory;
}

function maxTierOf(pieces: PrismPiece[]) {
  let max = 0;
  for (const p of pieces) if (p.tier > max) max = p.tier;
  return max;
}

function clampSpeed(p: PrismPiece) {
  const sp = Math.hypot(p.vx, p.vy);
  if (sp > MAX_SPEED) {
    const k = MAX_SPEED / sp;
    p.vx *= k;
    p.vy *= k;
  }
}

function bounds(p: PrismPiece) {
  if (p.x < p.r) {
    p.x = p.r;
    if (p.vx < 0) p.vx = -p.vx * 0.32;
  } else if (p.x > WELL_W - p.r) {
    p.x = WELL_W - p.r;
    if (p.vx > 0) p.vx = -p.vx * 0.32;
  }
  if (p.y > WELL_H - p.r) {
    p.y = WELL_H - p.r;
    if (p.vy > 0) p.vy = -p.vy * (p.vy > 48 ? 0.16 : 0);
    p.vx *= 0.86;
  }
}

function collidePair(a: PrismPiece, b: PrismPiece) {
  let dx = b.x - a.x;
  let dy = b.y - a.y;
  let dist = Math.hypot(dx, dy);
  const min = a.r + b.r;
  const mergeable = a.tier === b.tier && a.tier < 11 && a.tier >= 1;
  if (mergeable && dist <= min + MERGE_SLOP) return;
  if (dist >= min) return;
  if (dist < 1e-4) {
    dx = 1;
    dy = 0;
    dist = 1;
  }
  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = min - dist;
  const invA = 1 / (a.r * a.r);
  const invB = 1 / (b.r * b.r);
  const inv = invA + invB;
  const shareA = invA / inv;
  const shareB = invB / inv;
  a.x -= nx * overlap * shareA;
  a.y -= ny * overlap * shareA;
  b.x += nx * overlap * shareB;
  b.y += ny * overlap * shareB;
  const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (rv < 0) {
    const e = rv < -36 ? 0.18 : 0;
    const j = -(1 + e) * rv / inv;
    a.vx -= j * nx * invA;
    a.vy -= j * ny * invA;
    b.vx += j * nx * invB;
    b.vy += j * ny * invB;
    const tx = -ny;
    const ty = nx;
    const tv = (b.vx - a.vx) * tx + (b.vy - a.vy) * ty;
    const jf = tv * 0.22;
    a.vx += tx * jf;
    a.vy += ty * jf;
    b.vx -= tx * jf;
    b.vy -= ty * jf;
    const spin = tv * 0.012;
    a.vr += spin / a.r;
    b.vr -= spin / b.r;
  }
}

function settle(pieces: PrismPiece[]) {
  for (const p of pieces) {
    let supported = p.y >= WELL_H - p.r - 0.9;
    let penetrating = false;
    for (const o of pieces) {
      if (o === p) continue;
      const dx = o.x - p.x;
      const dy = o.y - p.y;
      const dist = Math.hypot(dx, dy) || 0.0001;
      const min = p.r + o.r;
      if (dist < min - 1.6) penetrating = true;
      if (dy > 2 && dist <= min + 2.2 && Math.abs(dx) < min * 0.96) supported = true;
    }
    if (supported && !penetrating && Math.abs(p.vy) < 28 && Math.abs(p.vx) < 20) {
      if (p.y > WELL_H - p.r) p.y = WELL_H - p.r;
      p.vy = 0;
      if (Math.abs(p.vx) < 8) p.vx = 0;
      else p.vx *= 0.45;
    }
  }
}

function integrate(pieces: PrismPiece[], sub: number) {
  for (const p of pieces) {
    p.vy += GRAVITY * sub;
    p.vx *= Math.exp(-1.05 * sub);
    p.vy *= Math.exp(-0.16 * sub);
    p.vr *= Math.exp(-1.8 * sub);
    p.x += p.vx * sub;
    p.y += p.vy * sub;
    p.rot += p.vr * sub;
    p.age += sub;
    p.flash = Math.max(0, p.flash - sub * 1.65);
    if (p.y < 0) p.vy += 520 * sub;
    bounds(p);
    clampSpeed(p);
  }
  for (let sweep = 0; sweep < 2; sweep += 1) {
    for (let i = 0; i < pieces.length; i += 1) {
      for (let j = i + 1; j < pieces.length; j += 1) {
        const a = pieces[i];
        const b = pieces[j];
        if (a && b) collidePair(a, b);
      }
    }
    for (const p of pieces) bounds(p);
  }
  settle(pieces);
}

function shockwave(pieces: PrismPiece[], x: number, y: number, skip: Set<number>) {
  for (const p of pieces) {
    if (skip.has(p.id)) continue;
    let dx = p.x - x;
    let dy = p.y - y;
    let dist = Math.hypot(dx, dy);
    if (dist > SHOCK_RADIUS) continue;
    if (dist < 1) {
      dx = 1;
      dy = 0;
      dist = 1;
    }
    const push = SHOCK_PUSH * (1 - dist / SHOCK_RADIUS);
    p.vx += (dx / dist) * push;
    p.vy += (dy / dist) * push;
    clampSpeed(p);
  }
}

function fuse(
  pieces: PrismPiece[],
  a: PrismPiece,
  b: PrismPiece,
  chain: number,
  nextIdRef: { id: number },
): { piece: PrismPiece; event: MergeEvent } {
  const newTier = a.tier + 1;
  const r = tierRadius(newTier);
  let x = (a.x + b.x) / 2;
  let y = (a.y + b.y) / 2;
  x = Math.max(r, Math.min(WELL_W - r, x));
  y = Math.min(WELL_H - r, y);
  const value = tierValue(newTier) * (1 + (chain - 1) * 0.5);
  const piece: PrismPiece = {
    id: ++nextIdRef.id,
    x,
    y,
    vx: (a.vx + b.vx) * 0.5,
    vy: -90,
    r,
    tier: newTier,
    rot: 0,
    vr: (a.vr + b.vr) * 0.25,
    age: 0,
    flash: 1,
  };
  const keep: PrismPiece[] = [];
  for (const p of pieces) if (p !== a && p !== b) keep.push(p);
  pieces.length = 0;
  for (const p of keep) pieces.push(p);
  pieces.push(piece);
  return { piece, event: { x, y, newTier, value, chain } };
}

export function stepWell(
  pieces: PrismPiece[],
  dt: number,
  nextIdRef: { id: number },
): { merges: MergeEvent[]; scoreGain: number; maxTier: number; overflowDanger: boolean; gameOver: boolean } {
  const memory = memoryOf(pieces);
  const awakeAtStart = memory.chain > 0;
  if (!(dt > 0)) {
    return {
      merges: [],
      scoreGain: 0,
      maxTier: maxTierOf(pieces),
      overflowDanger: false,
      gameOver: false,
    };
  }

  const merges: MergeEvent[] = [];
  const bornChain = new Map<number, number>();
  const bornState = new Map<number, Pick<PrismPiece, "x" | "y" | "vx" | "vy" | "flash" | "age" | "rot" | "vr">>();
  let cursor = memory.chain;

  const resolveContacts = (cascade: boolean) => {
    const shocks: Array<{ x: number; y: number }> = [];
    for (let pass = 0; pass < 8; pass += 1) {
      let best: { a: PrismPiece; b: PrismPiece; dist: number } | null = null;
      for (let i = 0; i < pieces.length; i += 1) {
        for (let j = i + 1; j < pieces.length; j += 1) {
          const a = pieces[i];
          const b = pieces[j];
          if (!a || !b || a.tier !== b.tier || a.tier >= 11 || a.tier < 1) continue;
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist <= a.r + b.r + MERGE_SLOP && (!best || dist < best.dist)) best = { a, b, dist };
        }
      }
      if (!best) break;
      const ca = bornChain.get(best.a.id) ?? 0;
      const cb = bornChain.get(best.b.id) ?? 0;
      let chain: number;
      if (ca || cb) chain = Math.max(ca, cb) + 1;
      else if (awakeAtStart || cascade) chain = Math.max(1, cursor + 1);
      else chain = 1;
      cursor = Math.max(cursor, chain);
      const fused = fuse(pieces, best.a, best.b, chain, nextIdRef);
      bornChain.set(fused.piece.id, chain);
      bornState.set(fused.piece.id, {
        x: fused.piece.x,
        y: fused.piece.y,
        vx: fused.piece.vx,
        vy: fused.piece.vy,
        flash: 1,
        age: 0,
        rot: 0,
        vr: fused.piece.vr,
      });
      merges.push(fused.event);
      shocks.push({ x: fused.event.x, y: fused.event.y });
    }
    const skip = new Set<number>(bornChain.keys());
    for (const shock of shocks) shockwave(pieces, shock.x, shock.y, skip);
  };

  // Fuse pairs that are already touching before collisions can shove them apart.
  resolveContacts(false);

  const sub = dt / SUBSTEPS;
  for (let i = 0; i < SUBSTEPS; i += 1) integrate(pieces, sub);

  for (const p of pieces) {
    const snap = bornState.get(p.id);
    if (!snap) continue;
    p.x = snap.x;
    p.y = snap.y;
    p.vx = snap.vx;
    p.vy = -90;
    p.flash = 1;
    p.age = 0;
    p.rot = snap.rot;
    p.vr = snap.vr;
  }

  // Pairs that landed on each other during this step fuse after the motion.
  resolveContacts(merges.length > 0);

  if (merges.length > 0) {
    memory.chain = cursor;
    memory.calm = 0;
  } else if (!pieces.some((p) => Math.hypot(p.vx, p.vy) > 26)) {
    memory.calm += dt;
    if (memory.calm > 0.18) memory.chain = 0;
  } else {
    memory.calm = 0;
  }

  let overflowDanger = false;
  let gameOver = false;
  for (const p of pieces) {
    const top = p.y - p.r;
    if (top < DANGER_Y) {
      const acc = (overflowTime.get(p) ?? 0) + dt;
      overflowTime.set(p, acc);
      if (p.age > 1.35) {
        overflowDanger = true;
        if (acc > 1.8) gameOver = true;
      }
      if (p.age > 1.5 && top < DANGER_Y - 28) gameOver = true;
    } else if (overflowTime.has(p)) {
      overflowTime.set(p, 0);
    }
  }

  let scoreGain = 0;
  for (const event of merges) scoreGain += event.value;
  return { merges, scoreGain, maxTier: maxTierOf(pieces), overflowDanger, gameOver };
}

export function applyPulseTilt(pieces: PrismPiece[], dir: -1 | 1) {
  for (const p of pieces) {
    p.vx += dir * 240;
    p.vy -= 195;
  }
}

/** Deterministic QA pile: three stable columns, 14 prisms from 2 through 512. */
export function buildShowcaseWell(nextIdRef: { id: number }): PrismPiece[] {
  const columns: Array<{ x: number; tiers: number[] }> = [
    { x: 66, tiers: [8, 5, 3, 1] },
    { x: 190, tiers: [9, 6, 4, 2, 1] },
    { x: 304, tiers: [7, 6, 4, 3, 2] },
  ];
  const pieces: PrismPiece[] = [];
  const gap = 0.8;
  for (const column of columns) {
    let y = WELL_H;
    column.tiers.forEach((tier, index) => {
      const r = tierRadius(tier);
      y = index === 0 ? WELL_H - r : y - r - gap;
      pieces.push({
        id: ++nextIdRef.id,
        x: column.x,
        y,
        vx: 0,
        vy: 0,
        r,
        tier,
        rot: tier * 0.37 + index,
        vr: 0,
        age: 4,
        flash: tier === 9 ? 1 : 0,
      });
      y -= r;
    });
  }
  return pieces;
}
