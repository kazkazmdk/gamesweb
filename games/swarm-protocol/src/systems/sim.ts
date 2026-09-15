export type EnemyKind = "chaser" | "dart" | "tank" | "spitter" | "splitter" | "elite" | "boss";

export type Enemy = {
  active: boolean;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  max: number;
  r: number;
  speed: number;
  damage: number;
  xp: number;
  flash: number;
  split: boolean;
  telegraph: number;
  pattern: number;
  patternT: number;
};

export const KIND: Record<
  EnemyKind,
  { hp: number; r: number; speed: number; damage: number; xp: number; color: number }
> = {
  chaser: { hp: 12, r: 12, speed: 78, damage: 8, xp: 4, color: 0xe8b089 },
  dart: { hp: 6, r: 8, speed: 168, damage: 6, xp: 3, color: 0xf0d27a },
  tank: { hp: 58, r: 24, speed: 42, damage: 16, xp: 12, color: 0xc45c3a },
  spitter: { hp: 18, r: 13, speed: 58, damage: 8, xp: 6, color: 0xd98a4a },
  splitter: { hp: 22, r: 16, speed: 70, damage: 9, xp: 8, color: 0xf07a3a },
  elite: { hp: 110, r: 28, speed: 86, damage: 18, xp: 32, color: 0xffd4a8 },
  boss: { hp: 680, r: 46, speed: 52, damage: 22, xp: 80, color: 0xffc18a },
};

export function emptyEnemy(): Enemy {
  return {
    active: false,
    kind: "chaser",
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    hp: 0,
    max: 1,
    r: 8,
    speed: 0,
    damage: 0,
    xp: 0,
    flash: 0,
    split: false,
    telegraph: 0,
    pattern: 0,
    patternT: 0,
  };
}

export function spawnEnemy(e: Enemy, kind: EnemyKind, x: number, y: number, scale = 1) {
  const k = KIND[kind];
  e.active = true;
  e.kind = kind;
  e.x = x;
  e.y = y;
  e.vx = 0;
  e.vy = 0;
  e.hp = k.hp * scale;
  e.max = e.hp;
  e.r = k.r;
  e.speed = k.speed * (0.94 + Math.random() * 0.12);
  e.damage = k.damage;
  e.xp = k.xp;
  e.flash = 0;
  e.split = kind === "splitter";
  e.telegraph = 0;
  e.pattern = 0;
  e.patternT = 0;
}

export type Bullet = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  damage: number;
  r: number;
  chain: number;
  pierce: number;
  split: number;
  over: boolean;
  hostile: boolean;
};

export type Orb = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
};

export type Trail = { x: number; y: number; life: number; r: number };

export type UpgradeId =
  | "projectiles"
  | "fire-rate"
  | "split"
  | "chain"
  | "pierce"
  | "overcharge"
  | "orbital"
  | "nova"
  | "dash-burn"
  | "execution"
  | "magnet"
  | "berserk"
  | "crit"
  | "dash"
  | "pulse";

export type UpgradeDef = {
  id: UpgradeId;
  name: string;
  desc: string;
  max: number;
};

export const UPGRADES: UpgradeDef[] = [
  { id: "projectiles", name: "Split Fire", desc: "Fire an extra projectile.", max: 4 },
  { id: "fire-rate", name: "Protocol Tempo", desc: "Attack faster.", max: 5 },
  { id: "split", name: "Fracture", desc: "Projectiles split after the first hit.", max: 3 },
  { id: "chain", name: "Chain Surge", desc: "Hits jump to nearby foes, weaker each hop.", max: 4 },
  { id: "pierce", name: "Pierce", desc: "Pass through the first enemy.", max: 2 },
  { id: "overcharge", name: "Overcharge", desc: "Every 5th shot is oversized.", max: 3 },
  { id: "orbital", name: "Orbital Collision", desc: "Orbiting shards damage nearby hosts.", max: 3 },
  { id: "nova", name: "Shield Nova", desc: "Taking a hit detonates a burst.", max: 2 },
  { id: "dash-burn", name: "Dash Burn", desc: "Dash leaves a burning trail.", max: 3 },
  { id: "execution", name: "Execution", desc: "Low-health enemies take bonus damage.", max: 3 },
  { id: "magnet", name: "Magnetic Core", desc: "Pull cores from much further.", max: 3 },
  { id: "berserk", name: "Berserk", desc: "Attack faster as health drops.", max: 2 },
  { id: "crit", name: "Fault Line", desc: "Critical hits hit harder.", max: 4 },
  { id: "dash", name: "Afterimage", desc: "Shorter dash cooldown.", max: 3 },
  { id: "pulse", name: "Pulse Ring", desc: "A shockwave ticks around you.", max: 3 },
];

export type Build = {
  projectiles: number;
  fireRate: number;
  damage: number;
  move: number;
  orbital: number;
  chain: number;
  crit: number;
  dashCd: number;
  split: number;
  pierce: number;
  execution: number;
  magnet: number;
  berserk: number;
  dashBurn: number;
  overcharge: number;
  nova: number;
  pulse: number;
};

export const BASE_BUILD: Build = {
  projectiles: 1,
  fireRate: 2.35,
  damage: 8,
  move: 218,
  orbital: 0,
  chain: 0,
  crit: 0.04,
  dashCd: 1100,
  split: 0,
  pierce: 0,
  execution: 0,
  magnet: 0,
  berserk: 0,
  dashBurn: 0,
  overcharge: 0,
  nova: 0,
  pulse: 0,
};

export function applyUpgrade(b: Build, id: UpgradeId) {
  if (id === "projectiles") b.projectiles += 1;
  if (id === "fire-rate") b.fireRate *= 1.16;
  if (id === "split") b.split += 1;
  if (id === "chain") b.chain += 2;
  if (id === "pierce") b.pierce += 1;
  if (id === "overcharge") b.overcharge += 1;
  if (id === "orbital") b.orbital += 1;
  if (id === "nova") b.nova += 1;
  if (id === "dash-burn") b.dashBurn += 1;
  if (id === "execution") b.execution += 0.35;
  if (id === "magnet") b.magnet += 1;
  if (id === "berserk") b.berserk += 1;
  if (id === "crit") b.crit += 0.1;
  if (id === "dash") b.dashCd *= 0.82;
  if (id === "pulse") b.pulse += 1;
}

export function ownedCount(owned: UpgradeId[], id: UpgradeId) {
  return owned.filter((x) => x === id).length;
}

export function pickUpgrades(owned: UpgradeId[], n = 3): UpgradeDef[] {
  const pool = UPGRADES.filter((u) => ownedCount(owned, u.id) < u.max);
  const out: UpgradeDef[] = [];
  while (out.length < n && pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

export function xpToLevel(level: number) {
  return Math.floor(22 + level * 14 + Math.pow(level, 1.38) * 5);
}

export function chainDamage(damage: number, hopsLeft: number, totalHops: number) {
  const hopsDone = totalHops - hopsLeft;
  return damage * Math.pow(0.85, hopsDone);
}

export function executionMul(build: Build, hp: number, max: number) {
  if (build.execution <= 0) return 1;
  if (hp / max > 0.35) return 1;
  return 1 + build.execution;
}

export function critMul(build: Build) {
  const chainBonus = build.chain > 0 && Math.random() < build.crit ? 0.15 : 0;
  if (Math.random() < build.crit) return 2 + chainBonus;
  return 1;
}

export function magnetRange(build: Build) {
  return 140 + build.magnet * 90;
}

export function fireRateNow(build: Build, hp: number, maxHp: number) {
  const missing = 1 - hp / maxHp;
  return build.fireRate * (1 + build.berserk * 0.45 * missing);
}

export function recommendBuild(owned: UpgradeId[]): string {
  if (owned.includes("chain") && !owned.includes("crit")) return "Try Chain + Fault Line next?";
  if (owned.includes("dash-burn") && !owned.includes("dash")) return "Try Dash Burn + Afterimage next?";
  if (owned.includes("orbital") && !owned.includes("nova")) return "Try Orbital + Shield Nova next?";
  if (owned.includes("split") && ownedCount(owned, "projectiles") < 2) return "Try Fracture + extra projectiles next?";
  if (owned.includes("pierce") && !owned.includes("execution")) return "Try Pierce + Execution next?";
  if (owned.includes("overcharge") && !owned.includes("split")) return "Try Overcharge + Fracture next?";
  if (owned.length === 0) return "Build toward Chain or Fracture.";
  return "";
}

export type WavePhase = "learn" | "build" | "pressure" | "fantasy" | "boss";

export function phaseFor(elapsedSec: number): WavePhase {
  if (elapsedSec < 60) return "learn";
  if (elapsedSec < 180) return "build";
  if (elapsedSec < 300) return "pressure";
  if (elapsedSec < 390) return "fantasy";
  return "boss";
}

export function desiredCount(elapsedSec: number): number {
  const p = phaseFor(elapsedSec);
  if (p === "learn") return 8;
  if (p === "build") return 14;
  if (p === "pressure") return 22;
  if (p === "fantasy") return 20;
  return 16;
}

export function pickKind(elapsedSec: number, eliteOk: boolean): EnemyKind {
  const p = phaseFor(elapsedSec);
  const roll = Math.random();
  if (p === "learn") return roll < 0.75 ? "chaser" : "dart";
  if (p === "build") {
    if (roll < 0.45) return "chaser";
    if (roll < 0.7) return "dart";
    if (roll < 0.88) return "spitter";
    return "tank";
  }
  if (p === "pressure") {
    if (eliteOk && roll < 0.08) return "elite";
    if (roll < 0.3) return "chaser";
    if (roll < 0.5) return "dart";
    if (roll < 0.7) return "spitter";
    if (roll < 0.85) return "tank";
    return "splitter";
  }
  if (eliteOk && roll < 0.1) return "elite";
  if (roll < 0.28) return "dart";
  if (roll < 0.5) return "chaser";
  if (roll < 0.7) return "splitter";
  if (roll < 0.86) return "spitter";
  return "tank";
}
