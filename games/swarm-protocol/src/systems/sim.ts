export type EnemyKind = "chaser" | "dart" | "tank" | "spitter" | "splitter" | "elite";

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
};

export const KIND: Record<
  EnemyKind,
  { hp: number; r: number; speed: number; damage: number; xp: number; color: number }
> = {
  chaser: { hp: 12, r: 12, speed: 78, damage: 8, xp: 4, color: 0xe8b089 },
  dart: { hp: 6, r: 8, speed: 150, damage: 6, xp: 3, color: 0xf0d27a },
  tank: { hp: 46, r: 22, speed: 46, damage: 14, xp: 10, color: 0xc45c3a },
  spitter: { hp: 16, r: 13, speed: 62, damage: 8, xp: 6, color: 0xd98a4a },
  splitter: { hp: 20, r: 16, speed: 70, damage: 9, xp: 8, color: 0xf07a3a },
  elite: { hp: 90, r: 26, speed: 88, damage: 18, xp: 28, color: 0xffd4a8 },
};

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
  e.speed = k.speed * (0.92 + Math.random() * 0.16);
  e.damage = k.damage;
  e.xp = k.xp;
  e.flash = 0;
  e.split = kind === "splitter";
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
};

export type Orb = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
};

export type UpgradeId =
  | "projectiles"
  | "fire-rate"
  | "damage"
  | "move"
  | "shield"
  | "chain"
  | "crit"
  | "dash";

export type UpgradeDef = {
  id: UpgradeId;
  name: string;
  desc: string;
};

export const UPGRADES: UpgradeDef[] = [
  { id: "projectiles", name: "Split Fire", desc: "+1 projectile" },
  { id: "fire-rate", name: "Protocol Tempo", desc: "Attack faster" },
  { id: "damage", name: "Heavier Core", desc: "+damage" },
  { id: "move", name: "Stride", desc: "+move speed" },
  { id: "shield", name: "Orbit", desc: "Orbiting shard" },
  { id: "chain", name: "Cascade", desc: "Hits jump to a nearby foe" },
  { id: "crit", name: "Fault Line", desc: "Critical chance" },
  { id: "dash", name: "Afterimage", desc: "Shorter dash cooldown" },
];

export type Build = {
  projectiles: number;
  fireRate: number;
  damage: number;
  move: number;
  shield: number;
  chain: number;
  crit: number;
  dashCd: number;
};

export const BASE_BUILD: Build = {
  projectiles: 1,
  fireRate: 2.4,
  damage: 8,
  move: 210,
  shield: 0,
  chain: 0,
  crit: 0.04,
  dashCd: 1100,
};

export function applyUpgrade(b: Build, id: UpgradeId) {
  if (id === "projectiles") b.projectiles += 1;
  if (id === "fire-rate") b.fireRate *= 1.18;
  if (id === "damage") b.damage *= 1.22;
  if (id === "move") b.move *= 1.12;
  if (id === "shield") b.shield += 1;
  if (id === "chain") b.chain += 1;
  if (id === "crit") b.crit += 0.1;
  if (id === "dash") b.dashCd *= 0.82;
}

export function pickUpgrades(owned: UpgradeId[], n = 3): UpgradeDef[] {
  const pool = [...UPGRADES];
  const out: UpgradeDef[] = [];
  while (out.length < n && pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  void owned;
  return out;
}

export function xpToLevel(level: number) {
  return Math.floor(18 + level * 12 + Math.pow(level, 1.35) * 4);
}
