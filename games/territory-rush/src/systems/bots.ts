export type Dir = { x: number; y: number };

const CARD: Dir[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

function toward(x: number, y: number, tx: number, ty: number): Dir {
  const dx = tx - x;
  const dy = ty - y;
  if (Math.abs(dx) > Math.abs(dy)) return { x: Math.sign(dx), y: 0 };
  if (dy !== 0) return { x: 0, y: Math.sign(dy) };
  return { x: Math.sign(dx) || 1, y: 0 };
}

/** Short safe loops around a home cell. */
export function brickDir(step: number, x: number, y: number, homeX: number, homeY: number): Dir {
  const cycle = step % 12;
  if (cycle < 3) return { x: 1, y: 0 };
  if (cycle < 6) return { x: 0, y: 1 };
  if (cycle < 9) return { x: -1, y: 0 };
  if (cycle < 12) return { x: 0, y: -1 };
  return toward(x, y, homeX, homeY);
}

/** Long thin expansions toward a far corner. */
export function needleDir(step: number, x: number, y: number, tx: number, ty: number): Dir {
  if (step % 9 === 8) return toward(x, y, tx, ty);
  if (Math.abs(tx - x) > Math.abs(ty - y)) return { x: Math.sign(tx - x) || 1, y: 0 };
  return { x: 0, y: Math.sign(ty - y) || 1 };
}

/** Wide perimeter sweeps along the edges. */
export function sweepDir(step: number, x: number, y: number): Dir {
  const edge = step % 48;
  if (edge < 12) return { x: 1, y: 0 };
  if (edge < 24) return { x: 0, y: 1 };
  if (edge < 36) return { x: -1, y: 0 };
  return { x: 0, y: -1 };
}

export function clampDir(d: Dir): Dir {
  if (!d.x && !d.y) return { x: 1, y: 0 };
  if (d.x && d.y) return Math.abs(d.x) >= Math.abs(d.y) ? { x: Math.sign(d.x), y: 0 } : { x: 0, y: Math.sign(d.y) };
  return { x: Math.sign(d.x), y: Math.sign(d.y) };
}

export { CARD };
