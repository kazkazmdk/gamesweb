import type { Layout, MovingBlocker } from "./layouts";

export type BallState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  portalCd: number;
  broke?: number;
};

function bounceRect(s: BallState, x: number, y: number, w: number, h: number, rest = 0.72) {
  const nx = Math.max(x, Math.min(s.x, x + w));
  const ny = Math.max(y, Math.min(s.y, y + h));
  const dx = s.x - nx;
  const dy = s.y - ny;
  if (dx * dx + dy * dy > 12 * 12) return false;
  if (Math.abs(dx) > Math.abs(dy)) {
    s.vx *= -rest;
    s.x += Math.sign(dx || 1) * 3;
  } else {
    s.vy *= -rest;
    s.y += Math.sign(dy || 1) * 3;
  }
  return true;
}

export function stepMover(m: MovingBlocker, dt: number) {
  m.t += dt;
  const span = m.max - m.min;
  const u = (Math.sin(m.t * m.speed * 0.05) + 1) / 2;
  if (m.axis === "x") m.x = m.min + u * span;
  else m.y = m.min + u * span;
}

export function stepBall(state: BallState, layout: Layout, dt: number): BallState {
  const s: BallState = { ...state, portalCd: Math.max(0, state.portalCd - dt) };
  s.x += s.vx * dt;
  s.y += s.vy * dt;
  s.vx *= Math.pow(0.985, dt * 60);
  s.vy *= Math.pow(0.985, dt * 60);

  for (const w of layout.walls) bounceRect(s, w.x, w.y, w.w, w.h);
  for (const b of layout.bumpers ?? []) {
    const dx = s.x - b.x;
    const dy = s.y - b.y;
    const d = Math.hypot(dx, dy);
    if (d > b.r + 11 || d < 0.1) continue;
    const nx = dx / d;
    const ny = dy / d;
    const vn = s.vx * nx + s.vy * ny;
    if (vn < 0) {
      s.vx -= 2.1 * vn * nx;
      s.vy -= 2.1 * vn * ny;
    }
    s.x = b.x + nx * (b.r + 12);
    s.y = b.y + ny * (b.r + 12);
  }
  for (const m of layout.movingBlockers ?? []) {
    stepMover(m, dt);
    bounceRect(s, m.x, m.y, m.w, m.h, 0.8);
  }
  for (const r of layout.rotators ?? []) {
    r.a += r.speed * dt;
    const tx = r.x + Math.cos(r.a) * r.len;
    const ty = r.y + Math.sin(r.a) * r.len;
    const dx = s.x - r.x;
    const dy = s.y - r.y;
    const t = Math.max(0, Math.min(1, (dx * Math.cos(r.a) + dy * Math.sin(r.a)) / r.len));
    const px = r.x + Math.cos(r.a) * r.len * t;
    const py = r.y + Math.sin(r.a) * r.len * t;
    if ((s.x - px) ** 2 + (s.y - py) ** 2 < 14 * 14) {
      const nx = (s.x - px) / 14;
      const ny = (s.y - py) / 14;
      s.vx += nx * 80;
      s.vy += ny * 80;
      s.x = px + nx * 15;
      s.y = py + ny * 15;
    }
    void tx;
    void ty;
  }
  for (const g of layout.gates ?? []) {
    g.open = Math.sin((g.t ?? 0) + (g.phase ?? 0)) > 0.15;
    g.t = (g.t ?? 0) + dt * (g.speed ?? 1.4);
    if (!g.open) bounceRect(s, g.x, g.y, g.w, g.h, 0.7);
  }
  for (const p of layout.forcePads ?? []) {
    if (s.x > p.x && s.x < p.x + p.w && s.y > p.y && s.y < p.y + p.h) {
      s.vx += p.ax * dt * 8;
      s.vy += p.ay * dt * 8;
    }
  }
  for (const b of layout.breakables ?? []) {
    if (b.hp <= 0) continue;
    if (bounceRect(s, b.x, b.y, b.w, b.h, 0.55)) {
      b.hp -= 1;
      s.broke = (s.broke ?? 0) + 1;
    }
  }
  const portals = layout.portals ?? [];
  if (s.portalCd <= 0 && portals.length >= 2) {
    for (let i = 0; i < portals.length; i += 1) {
      const p = portals[i];
      if ((s.x - p.x) ** 2 + (s.y - p.y) ** 2 > (p.r + 10) ** 2) continue;
      const dest = portals[p.pair] ?? portals[(i + 1) % portals.length];
      const spd = Math.hypot(s.vx, s.vy);
      const a = Math.atan2(s.vy, s.vx);
      s.x = dest.x + Math.cos(a) * (dest.r + 14);
      s.y = dest.y + Math.sin(a) * (dest.r + 14);
      s.vx = Math.cos(a) * spd * 0.92;
      s.vy = Math.sin(a) * spd * 0.92;
      s.portalCd = 0.45;
      break;
    }
  }
  return s;
}
