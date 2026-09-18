import type { Build, Enemy, EnemyKind } from "./sim";
import { spawnEnemy } from "./sim";

export type ProjectileKind = "gun" | "missile" | "rail" | "drone" | "hostile" | "sweep";

export type Missile = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  damage: number;
  r: number;
  turn: number;
  aoe: number;
};

export function emptyMissile(): Missile {
  return { active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, damage: 0, r: 5, turn: 2.4, aoe: 36 };
}

export function missileCooldown(level: number) {
  return Math.max(1.35, 3.15 - level * 0.55);
}

export function missileVolleyCount(level: number) {
  return Math.max(0, 2 + level);
}

export function missileSpeed() {
  return 280;
}

export const BOSS_CLOCK_SEC = 75;

export function shouldSpawnBoss(elapsedSec: number, kills: number, level: number) {
  return elapsedSec >= BOSS_CLOCK_SEC || kills >= 50 || level >= 6;
}

export function stepMissile(
  m: Missile,
  dt: number,
  target: { x: number; y: number } | null,
): void {
  if (!m.active) return;
  m.life -= dt;
  if (target) {
    const desired = Math.atan2(target.y - m.y, target.x - m.x);
    const cur = Math.atan2(m.vy, m.vx);
    let diff = desired - cur;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const maxTurn = m.turn * dt;
    const next = cur + Math.max(-maxTurn, Math.min(maxTurn, diff));
    const spd = Math.hypot(m.vx, m.vy) || missileSpeed();
    m.vx = Math.cos(next) * spd;
    m.vy = Math.sin(next) * spd;
  }
  m.x += m.vx * dt;
  m.y += m.vy * dt;
  if (m.life <= 0) m.active = false;
}

export function aoeHits(
  cx: number,
  cy: number,
  r: number,
  enemies: Array<{ active: boolean; x: number; y: number; r: number }>,
) {
  return enemies.filter((e) => e.active && (e.x - cx) ** 2 + (e.y - cy) ** 2 < (r + e.r) ** 2);
}

export function bladeRadius(orbital: number, blade: number) {
  return 48 + blade * 22 + orbital * 4;
}

export function bladeLength(blade: number) {
  return 18 + blade * 12;
}

export function bladePose(i: number, n: number, angle: number, px: number, py: number, orbital: number, blade: number) {
  const a = angle + (i * Math.PI * 2) / Math.max(1, n);
  const r = bladeRadius(orbital, blade);
  const len = bladeLength(blade);
  const x = px + Math.cos(a) * r;
  const y = py + Math.sin(a) * r;
  return { x, y, a, r, len, tipX: px + Math.cos(a) * (r + len * 0.55), tipY: py + Math.sin(a) * (r + len * 0.55) };
}

export function bladeHitsEnemy(
  pose: { x: number; y: number; tipX: number; tipY: number; len: number },
  e: { x: number; y: number; r: number },
) {
  const dx = pose.tipX - pose.x;
  const dy = pose.tipY - pose.y;
  const t = Math.max(0, Math.min(1, ((e.x - pose.x) * dx + (e.y - pose.y) * dy) / (dx * dx + dy * dy || 1)));
  const px = pose.x + dx * t;
  const py = pose.y + dy * t;
  return (e.x - px) ** 2 + (e.y - py) ** 2 < (e.r + 7) ** 2;
}

export function plasmaPulseRadius(pulse: number, plasma: number) {
  return 70 + pulse * 12 + plasma * 28;
}

export function novaRadius(nova: number, plasma: number) {
  return 58 + nova * 16 + plasma * 22;
}

export function plasmaBurns(plasma: number) {
  return plasma;
}

export type Drone = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fireT: number;
  slot: number;
};

export function emptyDrone(): Drone {
  return { active: false, x: 0, y: 0, vx: 0, vy: 0, fireT: 0, slot: 0 };
}

export function droneCount(level: number) {
  return Math.max(0, level);
}

export function stepDrone(
  d: Drone,
  dt: number,
  px: number,
  py: number,
  n: number,
  t: number,
): { fire: boolean } {
  const orbit = 86 + d.slot * 6;
  const a = t * 1.15 + (d.slot * Math.PI * 2) / Math.max(1, n);
  const tx = px + Math.cos(a) * orbit;
  const ty = py + Math.sin(a) * orbit * 0.72 - 10;
  d.vx += (tx - d.x) * 6.2 * dt;
  d.vy += (ty - d.y) * 6.2 * dt;
  d.vx *= 0.86;
  d.vy *= 0.86;
  d.x += d.vx;
  d.y += d.vy;
  d.fireT -= dt;
  if (d.fireT <= 0) {
    d.fireT = 0.72 + d.slot * 0.08;
    return { fire: true };
  }
  return { fire: false };
}

export type ArenaId = "core-chamber" | "fracture-zone";

export function arenaIdFor(endless: boolean, bossDown: boolean): ArenaId {
  return endless || bossDown ? "fracture-zone" : "core-chamber";
}

export type ArenaSolid = {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "column" | "reactor" | "rail" | "fissure" | "debris" | "hazard";
  damage?: number;
};

export function arenaSolids(id: ArenaId): ArenaSolid[] {
  if (id === "core-chamber") {
    return [
      { x: 210, y: 210, w: 54, h: 140, kind: "column" },
      { x: 1130, y: 210, w: 54, h: 140, kind: "column" },
      { x: 210, y: 1050, w: 54, h: 140, kind: "column" },
      { x: 1130, y: 1050, w: 54, h: 140, kind: "column" },
      { x: 620, y: 180, w: 160, h: 90, kind: "reactor" },
      { x: 620, y: 1130, w: 160, h: 90, kind: "reactor" },
      { x: 80, y: 680, w: 240, h: 22, kind: "rail" },
      { x: 1080, y: 680, w: 240, h: 22, kind: "rail" },
    ];
  }
  return [
    { x: 160, y: 360, w: 220, h: 36, kind: "fissure", damage: 4 },
    { x: 980, y: 980, w: 260, h: 36, kind: "fissure", damage: 4 },
    { x: 420, y: 720, w: 90, h: 70, kind: "debris" },
    { x: 860, y: 420, w: 110, h: 80, kind: "debris" },
    { x: 1080, y: 180, w: 80, h: 80, kind: "debris" },
    { x: 240, y: 1080, w: 100, h: 70, kind: "debris" },
    { x: 680, y: 240, w: 40, h: 160, kind: "hazard", damage: 6 },
  ];
}

export function resolveCircleVsSolids(x: number, y: number, r: number, solids: ArenaSolid[]) {
  let nx = x;
  let ny = y;
  let hazard = 0;
  for (const s of solids) {
    const inside = nx > s.x && nx < s.x + s.w && ny > s.y && ny < s.y + s.h;
    const cx = Math.max(s.x, Math.min(nx, s.x + s.w));
    const cy = Math.max(s.y, Math.min(ny, s.y + s.h));
    let dx = nx - cx;
    let dy = ny - cy;
    if (inside) {
      const left = nx - s.x;
      const right = s.x + s.w - nx;
      const top = ny - s.y;
      const bottom = s.y + s.h - ny;
      const m = Math.min(left, right, top, bottom);
      if (m === left) dx = -1;
      else if (m === right) dx = 1;
      else if (m === top) dy = -1;
      else dy = 1;
    }
    const d2 = dx * dx + dy * dy;
    if (!inside && d2 >= r * r) continue;
    if (s.kind === "fissure" || s.kind === "hazard") {
      hazard = Math.max(hazard, s.damage ?? 0);
      continue;
    }
    const d = Math.sqrt(d2) || 1;
    const push = inside ? r + 0.5 : r - d + 0.5;
    nx += (dx / d) * push;
    ny += (dy / d) * push;
  }
  return { x: nx, y: ny, hazard };
}

export type BossPattern = "charge" | "radial" | "summon" | "zones" | "sweep" | "chase";

export function protocolPattern(cycle: number): BossPattern {
  return (["charge", "radial", "summon"] as const)[cycle % 3];
}

export function wardenPattern(cycle: number, hpRatio: number): BossPattern {
  if (hpRatio < 0.4) return (["zones", "sweep", "chase"] as const)[cycle % 3];
  return (["zones", "sweep", "chase"] as const)[cycle % 3];
}

export function stepProtocolCore(
  e: Enemy,
  dt: number,
  player: { x: number; y: number },
  spawn: (kind: EnemyKind, x: number, y: number) => void,
  spit: (angle: number, speed: number) => void,
) {
  e.patternT += dt;
  const a = Math.atan2(player.y - e.y, player.x - e.x);
  if (e.pattern === 0) {
    e.telegraph = Math.min(1, e.patternT / 0.7);
    if (e.patternT > 0.7 && e.patternT < 1.25) {
      e.x += Math.cos(a) * 260 * dt;
      e.y += Math.sin(a) * 260 * dt;
    }
    if (e.patternT > 1.7) {
      e.pattern = 1;
      e.patternT = 0;
      e.telegraph = 0;
    }
  } else if (e.pattern === 1) {
    e.telegraph = Math.min(1, e.patternT / 0.55);
    if (e.patternT > 0.55 && e.patternT < 0.68) {
      for (let i = 0; i < 12; i += 1) spit((i / 12) * Math.PI * 2, 210);
    }
    if (e.patternT > 1.5) {
      e.pattern = 2;
      e.patternT = 0;
      e.telegraph = 0;
    }
  } else {
    e.x += Math.cos(a) * e.speed * 0.35 * dt;
    e.y += Math.sin(a) * e.speed * 0.35 * dt;
    if (e.patternT > 0.35 && e.patternT < 0.42) {
      spawn("swarmling", e.x + 40, e.y);
      spawn("spitter", e.x - 40, e.y + 20);
    }
    if (e.patternT > 1.6) {
      e.pattern = 0;
      e.patternT = 0;
    }
  }
}

export function stepWarden(
  e: Enemy,
  dt: number,
  player: { x: number; y: number },
  spit: (angle: number, speed: number, kind?: "sweep") => void,
) {
  e.patternT += dt;
  const enraged = e.hp / e.max < 0.4;
  const a = Math.atan2(player.y - e.y, player.x - e.x);
  if (e.pattern === 0) {
    e.telegraph = Math.min(1, e.patternT / 0.9);
    e.x += Math.cos(e.patternT * 1.4) * 40 * dt;
    e.y += Math.sin(e.patternT * 1.4) * 40 * dt;
    if (e.patternT > 1.2) {
      e.pattern = 1;
      e.patternT = 0;
      e.telegraph = 0;
    }
  } else if (e.pattern === 1) {
    e.telegraph = Math.min(1, e.patternT / 0.4);
    if (e.patternT > 0.4 && e.patternT < 1.1) {
      const sweep = e.patternT * (enraged ? 14 : 9);
      spit(sweep, enraged ? 260 : 200, "sweep");
    }
    if (e.patternT > 1.5) {
      e.pattern = 2;
      e.patternT = 0;
      e.telegraph = 0;
    }
  } else {
    const spd = e.speed * (enraged ? 3.1 : 2.2);
    e.x += Math.cos(a) * spd * dt;
    e.y += Math.sin(a) * spd * dt;
    if (e.patternT > (enraged ? 1.05 : 1.45)) {
      e.pattern = 0;
      e.patternT = 0;
    }
  }
}

export function wardenZoneHits(e: Enemy, x: number, y: number, t: number) {
  if (e.kind !== "warden" || e.pattern !== 0) return false;
  for (let i = 0; i < 3; i += 1) {
    const a = t * 1.1 + (i * Math.PI * 2) / 3;
    const zx = e.x + Math.cos(a) * 110;
    const zy = e.y + Math.sin(a) * 110;
    if ((x - zx) ** 2 + (y - zy) ** 2 < 38 * 38) return true;
  }
  return false;
}

export function spawnSupport(slot: Enemy | undefined, kind: EnemyKind, x: number, y: number) {
  if (!slot) return false;
  spawnEnemy(slot, kind, x, y, 0.85);
  return true;
}

export type UpgradeEffect = {
  id: string;
  gameplay: string;
  visual: string;
  audio: string;
};

export function upgradeEffects(): UpgradeEffect[] {
  return [
    { id: "projectiles", gameplay: "extra gun projectile", visual: "more bolts", audio: "higher pitch" },
    { id: "fire-rate", gameplay: "faster fireRate", visual: "denser bolts", audio: "faster cadence" },
    { id: "split", gameplay: "fork after first hit", visual: "two child bolts", audio: "gun" },
    { id: "chain", gameplay: "hop to nearest foe", visual: "bolt redirects", audio: "gun" },
    { id: "pierce", gameplay: "pass through N enemies", visual: "bolt continues", audio: "gun" },
    { id: "overcharge", gameplay: "every 5th shot oversized", visual: "fat bolt", audio: "higher gain" },
    { id: "orbital", gameplay: "orbit shards collide", visual: "orbiting shards or blades", audio: "impact" },
    { id: "nova", gameplay: "burst on player hit", visual: "shock ring", audio: "hit" },
    { id: "dash-burn", gameplay: "dash trail damages", visual: "ember trail", audio: "dash" },
    { id: "execution", gameplay: "bonus vs low HP", visual: "same bolt, bigger numbers", audio: "crit" },
    { id: "magnet", gameplay: "wider orb pull", visual: "orbs curve in", audio: "pickup" },
    { id: "berserk", gameplay: "fireRate scales with missing HP", visual: "faster bolts at low HP", audio: "faster cadence" },
    { id: "crit", gameplay: "chance 2x damage", visual: "white burst", audio: "hit-stop" },
    { id: "dash", gameplay: "shorter dash cooldown", visual: "more afterimages", audio: "dash" },
    { id: "pulse", gameplay: "periodic shockwave", visual: "ring tick", audio: "pulse" },
    { id: "twin", gameplay: "side bolts every shot", visual: "two angled bolts", audio: "gun" },
    { id: "rail", gameplay: "faster / longer / harder shots", visual: "thin long rail line", audio: "sawtooth" },
    { id: "missile", gameplay: "timed homing volley + AoE", visual: "slow chevron missiles + blast", audio: "whoosh + boom" },
    { id: "blade", gameplay: "orbiters become melee blades", visual: "rotating blades, longer radius", audio: "slice" },
    { id: "plasma", gameplay: "pulse/nova larger + burn ticks", visual: "hot magenta ring", audio: "buzz" },
    { id: "drone", gameplay: "autonomous escorts fire", visual: "small hulls that follow", audio: "chirp" },
    { id: "shield-wall", gameplay: "+22 max HP", visual: "plate ring", audio: "level-up" },
    { id: "lifesteal", gameplay: "kills restore HP", visual: "HP bar ticks up", audio: "pickup" },
    { id: "coolant", gameplay: "dash cooldown * 0.9", visual: "more dashes", audio: "dash" },
    { id: "focus", gameplay: "damage up, fireRate down", visual: "harder hits", audio: "lower cadence" },
    { id: "spread", gameplay: "wider shot fan", visual: "bolts fan", audio: "gun" },
  ];
}

export function measurableAfter(id: keyof Build | string, before: Build, after: Build) {
  if (id === "missile") return after.missile > before.missile;
  if (id === "blade") return after.blade > before.blade;
  if (id === "plasma") return after.plasma > before.plasma;
  if (id === "drone") return after.drone > before.drone && after.orbital === before.orbital;
  return JSON.stringify(after) !== JSON.stringify(before);
}
