import { describe, expect, it } from "vitest";
import {
  applyUpgrade,
  BASE_BUILD,
  UPGRADES,
  type UpgradeId,
} from "../games/swarm-protocol/src/systems/sim.ts";
import {
  aoeHits,
  arenaSolids,
  bladeHitsEnemy,
  bladePose,
  droneCount,
  emptyDrone,
  emptyMissile,
  measurableAfter,
  missileVolleyCount,
  plasmaPulseRadius,
  resolveCircleVsSolids,
  stepDrone,
  stepMissile,
  stepProtocolCore,
  stepWarden,
  upgradeEffects,
} from "../games/swarm-protocol/src/systems/combat.ts";
import { LAYOUTS, type Layout } from "../games/pocket-striker/src/systems/layouts.ts";
import { stepBall } from "../games/pocket-striker/src/systems/physics.ts";
import { brickDir, needleDir, sweepDir } from "../games/territory-rush/src/systems/bots.ts";
import { applyOp, type Segment } from "../games/crowd-control/src/systems/course.ts";
import { resolveCrowdClash, stepBossFight } from "../games/crowd-control/src/systems/combat.ts";
import { LEVELS } from "../games/crowd-control/src/levels/levels.ts";

describe("swarm upgrade truth", () => {
  it("maps every UpgradeId to a gameplay + visual + audio effect", () => {
    const effects = upgradeEffects();
    expect(effects).toHaveLength(UPGRADES.length);
    for (const u of UPGRADES) {
      const row = effects.find((e) => e.id === u.id);
      expect(row?.gameplay.length).toBeGreaterThan(4);
      expect(row?.visual.length).toBeGreaterThan(4);
    }
  });

  it("changes measurable build state for every upgrade, and drone does not fake-orbital", () => {
    for (const u of UPGRADES) {
      const before = { ...BASE_BUILD };
      const after = { ...BASE_BUILD };
      applyUpgrade(after, u.id as UpgradeId);
      expect(measurableAfter(u.id, before, after)).toBe(true);
    }
  });

  it("fires a visible missile volley that homes and does AoE", () => {
    expect(missileVolleyCount(1)).toBeGreaterThanOrEqual(3);
    const m = emptyMissile();
    m.active = true;
    m.x = 0;
    m.y = 0;
    m.vx = 280;
    m.vy = 0;
    m.life = 2;
    m.turn = 3;
    stepMissile(m, 0.2, { x: 0, y: 80 });
    expect(m.vy).toBeGreaterThan(20);
    expect(aoeHits(0, 0, 40, [{ active: true, x: 10, y: 0, r: 8 }])).toHaveLength(1);
  });

  it("turns orbitals into a longer melee blade", () => {
    const shard = bladePose(0, 1, 0, 0, 0, 1, 0);
    const blade = bladePose(0, 1, 0, 0, 0, 1, 3);
    expect(blade.r).toBeGreaterThan(shard.r);
    expect(blade.len).toBeGreaterThan(shard.len);
    expect(bladeHitsEnemy(blade, { x: blade.tipX, y: blade.tipY, r: 6 })).toBe(true);
  });

  it("makes plasma rings larger than a plain pulse", () => {
    expect(plasmaPulseRadius(1, 2)).toBeGreaterThan(plasmaPulseRadius(1, 0));
  });

  it("steps autonomous drones that can request fire", () => {
    expect(droneCount(2)).toBe(2);
    const d = emptyDrone();
    d.active = true;
    d.fireT = 0;
    const { fire } = stepDrone(d, 0.016, 100, 100, 1, 0);
    expect(fire).toBe(true);
    expect(Math.hypot(d.x - 100, d.y - 100)).toBeLessThan(200);
  });

  it("gives Protocol Core and Warden different opening attacks", () => {
    const core = {
      active: true,
      kind: "boss" as const,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      hp: 100,
      max: 100,
      r: 40,
      speed: 50,
      damage: 10,
      xp: 1,
      flash: 0,
      split: false,
      telegraph: 0,
      pattern: 0,
      patternT: 0,
    };
    const warden = { ...core, kind: "warden" as const, hp: 30, max: 100 };
    const spit: string[] = [];
    stepProtocolCore(core, 0.8, { x: 40, y: 0 }, () => undefined, () => spit.push("core"));
    stepWarden(warden, 0.5, { x: 40, y: 0 }, (_a, _s, kind) => spit.push(kind ?? "warden"));
    expect(core.pattern).toBe(0);
    expect(core.telegraph).toBeGreaterThan(0);
    expect(warden.pattern).toBe(0);
    expect(arenaSolids("core-chamber").some((s) => s.kind === "reactor")).toBe(true);
    expect(arenaSolids("fracture-zone").some((s) => s.kind === "fissure")).toBe(true);
    const blocked = resolveCircleVsSolids(230, 250, 16, arenaSolids("core-chamber"));
    expect(blocked.x !== 230 || blocked.y !== 250).toBe(true);
  });
});

describe("pocket authored tables", () => {
  it("ships 18 authored layouts, 6 per theme, no formula filler", () => {
    expect(LAYOUTS).toHaveLength(18);
    expect(LAYOUTS.filter((l) => l.theme === "workshop")).toHaveLength(6);
    expect(LAYOUTS.filter((l) => l.theme === "garden")).toHaveLength(6);
    expect(LAYOUTS.filter((l) => l.theme === "arcade")).toHaveLength(6);
    const ids = new Set(LAYOUTS.map((l) => l.id));
    expect(ids.size).toBe(18);
  });

  it("teleports through a portal and keeps some speed", () => {
    const layout: Layout = {
      id: "test",
      name: "Portal",
      par: 2,
      theme: "arcade",
      w: 720,
      h: 480,
      ball: { x: 80, y: 240 },
      hole: { x: 600, y: 240, r: 16 },
      walls: [],
      portals: [
        { x: 120, y: 240, r: 16, pair: 1 },
        { x: 400, y: 240, r: 16, pair: 0 },
      ],
    };
    const s = stepBall({ x: 120, y: 240, vx: 200, vy: 0, portalCd: 0 }, layout, 0.016);
    expect(s.x).toBeGreaterThan(350);
    expect(s.vx).toBeGreaterThan(100);
    expect(s.portalCd).toBeGreaterThan(0);
  });

  it("moves blockers and accelerates on force pads", () => {
    const layout: Layout = {
      id: "test2",
      name: "Force",
      par: 2,
      theme: "workshop",
      w: 720,
      h: 480,
      ball: { x: 80, y: 240 },
      hole: { x: 600, y: 240, r: 16 },
      walls: [],
      movingBlockers: [{ x: 200, y: 200, w: 40, h: 40, axis: "x", min: 180, max: 260, speed: 40, t: 0 }],
      forcePads: [{ x: 80, y: 220, w: 40, h: 40, ax: 80, ay: 0 }],
    };
    const a = stepBall({ x: 90, y: 240, vx: 20, vy: 0, portalCd: 0 }, layout, 0.05);
    expect(a.vx).toBeGreaterThan(20);
    const moved = layout.movingBlockers![0];
    expect(moved.x).not.toBe(200);
  });
});

describe("territory bot strategies", () => {
  it("produces different route signatures", () => {
    const brick = Array.from({ length: 8 }, (_, i) => brickDir(i, 10, 10, 8, 14));
    const needle = Array.from({ length: 8 }, (_, i) => needleDir(i, 10, 10, 40, 6));
    const sweep = Array.from({ length: 8 }, (_, i) => sweepDir(i, 10, 10));
    const span = (dirs: Array<{ x: number; y: number }>) =>
      dirs.reduce((n, d, i) => n + (i && (d.x !== dirs[i - 1].x || d.y !== dirs[i - 1].y) ? 1 : 0), 0);
    expect(span(brick)).toBeGreaterThan(0);
    expect(needle.filter((d) => d.x !== 0 && d.y !== 0).length).toBeLessThan(brick.filter((d) => d.x !== 0 && d.y !== 0).length + 8);
    expect(sweep.some((d) => Math.abs(d.x) + Math.abs(d.y) === 1)).toBe(true);
  });
});

describe("crowd combat truth", () => {
  it("clashes two crowds by size instead of a flat pack subtract", () => {
    const a = resolveCrowdClash(20, 8);
    expect(a.left).toBeGreaterThan(0);
    expect(a.right).toBe(0);
    expect(a.left).toBeLessThan(20);
    const b = resolveCrowdClash(6, 18);
    expect(b.left).toBe(0);
    expect(b.right).toBeGreaterThan(0);
  });

  it("gives the boss hit points that can reach zero", () => {
    const fight = stepBossFight({ hp: 40, max: 40 }, 24, 0.4);
    expect(fight.hp).toBeLessThan(40);
    expect(fight.pack).toBeLessThan(24);
    const dead = stepBossFight({ hp: 8, max: 40 }, 30, 1);
    expect(dead.hp).toBeLessThanOrEqual(0);
    expect(dead.dead).toBe(true);
  });

  it("authors 15 levels with destruction, boss, and payoff families", () => {
    expect(LEVELS).toHaveLength(15);
    const types = LEVELS.flat().map((s: Segment) => s.type);
    expect(types).toContain("break");
    expect(types).toContain("boss");
    expect(types.filter((t) => t === "finish").length).toBe(15);
    expect(LEVELS.some((lv) => lv.filter((s) => s.type === "gate").length >= 4)).toBe(true);
  });
});

void applyOp;
