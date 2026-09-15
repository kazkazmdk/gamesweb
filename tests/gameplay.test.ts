import { describe, expect, it } from "vitest";
import { driftGain } from "../games/neon-drift/src/systems/scoring.ts";
import { TRACKS, buildTrack, queryTrack, startPose } from "../games/neon-drift/src/systems/track.ts";
import { readDriveInput } from "../games/neon-drift/src/systems/input.ts";
import { Car, smoothstep } from "../games/neon-drift/src/systems/vehicle.ts";
import { COURSES, medalFor, nextMedalTarget } from "../games/velocity-run/src/systems/courses.ts";
import { MOVE, Runner } from "../games/velocity-run/src/systems/movement.ts";
import { VELOCITY_MEDALS } from "../packages/database/src/constants.ts";
import {
  applyUpgrade,
  BASE_BUILD,
  chainDamage,
  pickUpgrades,
  phaseFor,
  recommendBuild,
  UPGRADES,
} from "../games/swarm-protocol/src/systems/sim.ts";

describe("neon drift scoring", () => {
  it("rewards angle and speed together", () => {
    const slow = driftGain({ slip: 0.4, speed: 200, combo: 1, near: false, boost: false, dt: 1 });
    const fast = driftGain({ slip: 0.4, speed: 500, combo: 1, near: false, boost: false, dt: 1 });
    const angled = driftGain({ slip: 0.9, speed: 500, combo: 1, near: false, boost: false, dt: 1 });
    expect(fast).toBeGreaterThan(slow);
    expect(angled).toBeGreaterThan(fast);
  });

  it("applies near-miss and combo multipliers", () => {
    const base = driftGain({ slip: 0.5, speed: 400, combo: 1, near: false, boost: false, dt: 1 });
    const near = driftGain({ slip: 0.5, speed: 400, combo: 1, near: true, boost: false, dt: 1 });
    const combo = driftGain({ slip: 0.5, speed: 400, combo: 4, near: false, boost: false, dt: 1 });
    expect(near).toBeGreaterThan(base);
    expect(combo).toBeCloseTo(base * 4, 5);
  });

  it("ignores parking-lot speeds", () => {
    expect(driftGain({ slip: 1, speed: 40, combo: 8, near: true, boost: true, dt: 1 })).toBe(0);
  });
});

describe("neon tracks", () => {
  it("builds three closed circuits with sectors and a start pose", () => {
    expect(TRACKS).toHaveLength(3);
    for (const def of TRACKS) {
      const samples = buildTrack(def);
      expect(samples.length).toBeGreaterThan(80);
      expect(new Set(samples.map((s) => s.sector)).size).toBe(3);
      const pose = startPose(samples);
      const q = queryTrack(samples, pose.x, pose.y);
      expect(q.dist).toBeLessThan(q.half);
    }
  });
});

describe("neon vehicle grip", () => {
  it("builds drift amount smoothly instead of as a boolean step", () => {
    expect(smoothstep(0.15, 0.54, 0.15)).toBe(0);
    expect(smoothstep(0.15, 0.54, 0.54)).toBe(1);
    expect(smoothstep(0.15, 0.54, 0.3)).toBeGreaterThan(0.1);
    expect(smoothstep(0.15, 0.54, 0.3)).toBeLessThan(0.9);
  });

  it("does not spin in place with steer at rest", () => {
    const car = new Car();
    car.reset(0, 0, 0);
    car.vx = 0;
    car.vy = 0;
    car.steer = 1;
    car.throttle = 0;
    const angle = car.angle;
    car.step(0.016);
    expect(Math.abs(car.angle - angle)).toBeLessThan(0.05);
  });

  it("moves and yaws under throttle and steer", () => {
    const car = new Car();
    car.reset(100, 100, 0);
    const x = car.x;
    const a = car.angle;
    car.throttle = 1;
    car.steer = 1;
    for (let i = 0; i < 45; i += 1) car.step(0.016);
    expect(Math.abs(car.x - x) + Math.abs(car.angle - a)).toBeGreaterThan(2);
  });
});

describe("neon drive input", () => {
  it("does not crash when extra pointers are missing", () => {
    const keys = {
      up: { isDown: true },
      right: { isDown: false },
      left: { isDown: false },
      down: { isDown: false },
      space: { isDown: false },
    } as unknown as Record<string, { isDown: boolean }>;
    const input = {
      activePointer: { isDown: false, wasTouch: false, x: 0, y: 0 },
      pointer1: undefined,
      pointer2: undefined,
    };
    const drive = readDriveInput(keys as never, input as never, 1280, 720);
    expect(drive.throttle).toBe(1);
    expect(drive.touch).toBe(false);
  });
});

describe("velocity jump", () => {
  it("jumps when grounded is cleared the same frame", () => {
    const r = new Runner();
    r.reset(80, 672);
    r.grounded = true;
    const now = 400;
    const wasGround = r.grounded;
    r.grounded = false;
    if (wasGround) r.coyote = now + MOVE.coyoteMs;
    r.input(0.016, 0, true, true, false, false, now);
    expect(r.vy).toBeLessThan(0);
  });
});

describe("velocity medals", () => {
  it("keeps course thresholds aligned with the score contract", () => {
    for (const course of COURSES) {
      expect(course.medals).toEqual(VELOCITY_MEDALS[course.id]);
      expect(medalFor(course, course.medals.platinum)).toBe("platinum");
      expect(medalFor(course, course.medals.gold)).toBe("gold");
      expect(medalFor(course, course.medals.bronze + 1)).toBeNull();
    }
  });

  it("points at the next medal with a positive gap", () => {
    const course = COURSES[0];
    const next = nextMedalTarget(course, course.medals.gold + 620);
    expect(next?.name).toBe("gold");
    expect(next?.gap).toBe(620);
  });
});

describe("swarm upgrades", () => {
  it("ships 15 behavioral upgrades", () => {
    expect(UPGRADES).toHaveLength(15);
  });

  it("changes combat behavior instead of only adding flat stats", () => {
    const b = { ...BASE_BUILD };
    applyUpgrade(b, "split");
    applyUpgrade(b, "chain");
    applyUpgrade(b, "pierce");
    applyUpgrade(b, "magnet");
    expect(b.split).toBe(1);
    expect(b.chain).toBe(2);
    expect(b.pierce).toBe(1);
    expect(b.magnet).toBe(1);
    expect(chainDamage(100, 1, 2)).toBeLessThan(100);
  });

  it("recommends a real synergy from the current build", () => {
    expect(recommendBuild(["chain"])).toMatch(/Fault Line/);
    expect(recommendBuild(["split"])).toMatch(/projectile/i);
  });

  it("offers three cards from the remaining pool", () => {
    const cards = pickUpgrades(["chain", "chain", "chain", "chain"], 3);
    expect(cards).toHaveLength(3);
    expect(cards.every((c) => c.id !== "chain")).toBe(true);
  });

  it("uses a late-run boss phase", () => {
    expect(phaseFor(30)).toBe("learn");
    expect(phaseFor(120)).toBe("build");
    expect(phaseFor(240)).toBe("pressure");
    expect(phaseFor(400)).toBe("boss");
  });
});
