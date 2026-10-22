import { describe, expect, it } from "vitest";
import { levelFromXp, totalXpForLevel, xpRequiredForLevel } from "../packages/config/src/index.ts";
import { dailyQuests, recommend, utcDayKey } from "../packages/game-sdk/src/quests.ts";
import {
  achievementXp,
  medalForTime,
  mergeGuestIntoAccount,
  reconstructAchievementsFromScores,
  validateScore,
} from "../packages/database/src/index.ts";
import { computeRunRewards } from "../packages/database/src/rewards.ts";

describe("levelFromXp", () => {
  it("starts at level 1", () => {
    expect(levelFromXp(0).level).toBe(1);
  });
  it("advances using the same curve as totalXpForLevel", () => {
    const xp = totalXpForLevel(5);
    expect(levelFromXp(xp).level).toBe(5);
    expect(xpRequiredForLevel(2)).toBeGreaterThan(0);
  });
});

describe("dailyQuests", () => {
  it("returns three dated quests for a day", () => {
    const q = dailyQuests("2026-09-14");
    expect(q).toHaveLength(3);
    expect(q.every((item) => item.id.startsWith("2026-09-14:"))).toBe(true);
  });
  it("is stable for the same day", () => {
    expect(dailyQuests("2026-09-14").map((q) => q.id)).toEqual(dailyQuests("2026-09-14").map((q) => q.id));
  });
});

describe("recommend", () => {
  it("boosts unplayed games", () => {
    const ids = recommend({
      history: [],
      playedIds: ["neon-drift"],
      challengeGameIds: [],
      friendsPlaying: [],
    });
    expect(ids[0]).not.toBe("neon-drift");
  });
});

describe("validateScore", () => {
  const base = {
    sessionId: "11111111-1111-1111-1111-111111111111",
    gameVersion: "1.0.0",
    durationMs: 45000,
    startedAt: 1_000_000,
    endedAt: 1_045_000,
  };

  it("verifies a plausible neon-drift run", () => {
    const v = validateScore({
      ...base,
      gameId: "neon-drift",
      mode: "circuit",
      score: 18000,
      metadata: { laps: 1, combo: 3, wallHits: 1 },
    });
    expect(v.status).toBe("verified");
  });

  it("accepts neon track board modes", () => {
    const v = validateScore({
      ...base,
      gameId: "neon-drift",
      mode: "technical",
      score: 18000,
      metadata: { laps: 1, combo: 3, wallHits: 1 },
    });
    expect(v.status).toBe("verified");
  });

  it("flags an impossible neon-drift pace", () => {
    const v = validateScore({
      ...base,
      durationMs: 2000,
      startedAt: 1,
      endedAt: 2001,
      gameId: "neon-drift",
      mode: "circuit",
      score: 900000,
      metadata: { laps: 2, combo: 1, wallHits: 0 },
    });
    expect(v.status).toBe("flagged");
  });

  it("accepts authored Velocity and Knockout modes beyond the first three", () => {
    const vel = validateScore({
      ...base,
      gameId: "velocity-run",
      mode: "course-1b",
      score: 34000,
      metadata: { deaths: 0, medal: "none" },
    });
    expect(vel.status).toBe("verified");
    const ko = validateScore({
      ...base,
      gameId: "knockout-circuit",
      mode: "map-d",
      score: 42000,
      metadata: {},
    });
    expect(ko.status).toBe("verified");
  });

  it("rejects a negative velocity time", () => {
    const v = validateScore({
      ...base,
      gameId: "velocity-run",
      mode: "course-1",
      score: -12,
      metadata: { deaths: 0, medal: "none" },
    });
    expect(["flagged", "unverified"]).toContain(v.status);
  });

  it("flags swarm kill pace", () => {
    const v = validateScore({
      ...base,
      durationMs: 5000,
      startedAt: 1,
      endedAt: 5001,
      gameId: "swarm-protocol",
      mode: "survival",
      score: 50,
      metadata: { kills: 400, level: 2, damage: 10, surviveMs: 5000 },
    });
    expect(v.status).toBe("flagged");
  });

  it("accepts swarm-protocol in seed and daily modes", () => {
    const seedRun = validateScore({
      ...base,
      gameId: "swarm-protocol",
      mode: "seed",
      score: 12000,
      metadata: { kills: 80, level: 5, damage: 2400, surviveMs: 45000 },
    });
    expect(seedRun.status).toBe("verified");

    const dailyRun = validateScore({
      ...base,
      gameId: "swarm-protocol",
      mode: "daily",
      score: 12000,
      metadata: { kills: 80, level: 5, damage: 2400, surviveMs: 45000 },
    });
    expect(dailyRun.status).toBe("verified");
  });

  it("flags pocket-striker runs when metadata.failed is true or metadata.result is death", () => {
    const failedRun = validateScore({
      ...base,
      gameId: "pocket-striker",
      mode: "layout",
      score: 12,
      metadata: { strokes: 12, failed: true },
    });
    expect(failedRun.status).toBe("flagged");
    expect(failedRun.reasons).toContain("Pocket Striker table was not cleared");

    const deathRun = validateScore({
      ...base,
      gameId: "pocket-striker",
      mode: "layout",
      score: 12,
      metadata: { strokes: 12, result: "death" },
    });
    expect(deathRun.status).toBe("flagged");
    expect(deathRun.reasons).toContain("Pocket Striker table was not cleared");
  });
});

describe("medalForTime", () => {
  it("matches Velocity course-1 platinum", () => {
    expect(medalForTime("course-1", 31000)).toBe("platinum");
    expect(medalForTime("course-1", 40000)).toBe("silver");
  });
});

describe("mergeGuestIntoAccount", () => {
  it("ignores claimed achievements and reconstructs from verified scores", () => {
    const merged = mergeGuestIntoAccount(
      {
        xp: 800,
        achievements: ["platform:first-run"],
        scores: [],
        saves: {},
        questProgress: {},
        questCompleted: [],
        stats: {},
        streak: 2,
      },
      {
        xp: 1000,
        achievements: ["platform:first-run", "neon-drift:score-25k"],
        scores: [
          { id: "a", gameId: "neon-drift", mode: "circuit", score: 25000, at: 1, verified: "verified", metadata: {} },
        ],
      },
    );
    expect(merged.xp).toBe(1800);
    expect(merged.achievements).toContain("neon-drift:score-25k");
    expect(merged.scores).toHaveLength(1);
  });

  it("does not invent extra XP from listed achievements when guest.xp is 0", () => {
    const merged = mergeGuestIntoAccount(
      {
        xp: 100,
        achievements: [],
        scores: [],
        saves: {},
        questProgress: {},
        questCompleted: [],
        stats: {},
        streak: 0,
      },
      {
        xp: 0,
        achievements: ["neon-drift:score-60k", "platform:three-worlds"],
        scores: [],
      },
    );
    expect(merged.xp).toBe(100);
    expect(merged.achievements).toEqual(["neon-drift:score-60k", "platform:three-worlds"]);
  });

  it("skips flagged guest scores", () => {
    const merged = mergeGuestIntoAccount(
      {
        xp: 0,
        achievements: [],
        scores: [],
        saves: {},
        questProgress: {},
        questCompleted: [],
        stats: {},
        streak: 0,
      },
      {
        xp: 0,
        achievements: [],
        scores: [{ id: "x", gameId: "neon-drift", mode: "circuit", score: 9e6, at: 1, verified: "flagged", metadata: {} }],
      },
    );
    expect(merged.scores).toHaveLength(0);
  });
});

describe("computeRunRewards", () => {
  it("restricts unverified rewards and zeros flagged runs", () => {
    const base = {
      gameId: "neon-drift" as const,
      mode: "circuit",
      score: 25000,
      durationMs: 40000,
      result: "finish",
      metadata: { laps: 2, combo: 5 },
      existingAchievements: [] as string[],
      existingXp: 10,
      gamesPlayedToday: 0,
      uniqueGamesToday: [] as string[],
      playedGameIds: [] as string[],
      pbBefore: 0,
      pbCount: 0,
      dayKey: utcDayKey(),
      hourUtc: 12,
      questProgress: {},
      questCompleted: [] as string[],
    };
    const unverified = computeRunRewards({ ...base, verified: "unverified" });
    const verified = computeRunRewards({ ...base, verified: "verified" });
    expect(unverified.achievements).toEqual([]);
    expect(unverified.xpEarned).toBe(0);
    expect(unverified.newXp).toBe(10);
    expect(unverified.xpEarned).toBeLessThan(verified.xpEarned);
    const flagged = computeRunRewards({ ...base, verified: "flagged" });
    expect(flagged.xpEarned).toBe(0);
  });

  it("counts a first Velocity time as a personal best", () => {
    const diff = computeRunRewards({
      gameId: "velocity-run",
      mode: "course-1",
      score: 42000,
      durationMs: 42000,
      result: "finish",
      metadata: { deaths: 1, medal: "none" },
      verified: "verified",
      existingAchievements: ["platform:first-run", "velocity-run:first-finish", "velocity-run:bronze"],
      existingXp: 100,
      gamesPlayedToday: 1,
      uniqueGamesToday: ["velocity-run"],
      playedGameIds: ["velocity-run"],
      pbBefore: Number.POSITIVE_INFINITY,
      pbCount: 0,
      dayKey: utcDayKey(),
      hourUtc: 12,
      questProgress: {},
      questCompleted: [],
    });
    expect(diff.pbImproved).toBe(true);
    expect(diff.xpEarned).toBeGreaterThanOrEqual(35);
  });

  it("unlocks achievements and progresses daily quests for sky-stack, knockout-circuit, pocket-striker, territory-rush, and crowd-control", () => {
    function findDayForQuestStat(stat: string): string {
      for (let d = 1; d <= 60; d += 1) {
        const day = `2026-10-${String((d % 28) + 1).padStart(2, "0")}-${d}`;
        if (dailyQuests(day).some((q) => q.stat === stat)) return day;
      }
      return "2026-10-01";
    }

    const baseCtx = {
      durationMs: 45000,
      verified: "verified" as const,
      existingAchievements: [] as string[],
      existingXp: 100,
      gamesPlayedToday: 1,
      uniqueGamesToday: [] as string[],
      playedGameIds: [] as string[],
      pbBefore: 0,
      pbCount: 0,
      hourUtc: 14,
      questProgress: {},
      questCompleted: [] as string[],
    };

    const skyDay = findDayForQuestStat("sky-stack:floors");
    const sky = computeRunRewards({
      ...baseCtx,
      gameId: "sky-stack",
      mode: "climb",
      score: 7000,
      result: "finish",
      metadata: { perfects: 10, maxStreak: 9, floors: 70, fevers: 2 },
      dayKey: skyDay,
    });
    expect(sky.achievements).toEqual(
      expect.arrayContaining([
        "sky-stack:first-place",
        "sky-stack:streak-8",
        "sky-stack:floor-30",
        "sky-stack:floor-67",
        "sky-stack:fever-2",
      ]),
    );
    expect(sky.questsCompleted).toContain(`${skyDay}:ss-floor-20`);
    expect(sky.questProgress[`${skyDay}:ss-floor-20`]).toBe(70);

    const koDay = findDayForQuestStat("knockout-circuit:finish");
    const ko = computeRunRewards({
      ...baseCtx,
      gameId: "knockout-circuit",
      mode: "map-a",
      score: 32000,
      result: "finish",
      metadata: { gates: 4, falls: 0 },
      pbBefore: Number.POSITIVE_INFINITY,
      dayKey: koDay,
    });
    expect(ko.achievements).toEqual(
      expect.arrayContaining([
        "knockout-circuit:first-gate",
        "knockout-circuit:finish",
        "knockout-circuit:no-fall",
        "knockout-circuit:fast",
      ]),
    );
    expect(ko.questsCompleted).toContain(`${koDay}:ko-finish`);
    expect(ko.questProgress[`${koDay}:ko-finish`]).toBeGreaterThanOrEqual(1);

    const psDay = findDayForQuestStat("pocket-striker:strokes-under");
    const ps = computeRunRewards({
      ...baseCtx,
      gameId: "pocket-striker",
      mode: "layout",
      score: 1,
      result: "finish",
      metadata: { banked: true, par: 3, strokes: 1 },
      pbBefore: Number.POSITIVE_INFINITY,
      dayKey: psDay,
    });
    expect(ps.achievements).toEqual(
      expect.arrayContaining([
        "pocket-striker:first-pocket",
        "pocket-striker:bank",
        "pocket-striker:under-par",
        "pocket-striker:perfect",
      ]),
    );
    expect(ps.questsCompleted).toContain(`${psDay}:ps-par`);
    expect(ps.questProgress[`${psDay}:ps-par`]).toBeGreaterThanOrEqual(1);

    const trDay = findDayForQuestStat("territory-rush:pct");
    const tr = computeRunRewards({
      ...baseCtx,
      gameId: "territory-rush",
      mode: "arena",
      score: 75,
      result: "finish",
      metadata: { territoryPct: 75 },
      dayKey: trDay,
    });
    expect(tr.achievements).toEqual(
      expect.arrayContaining([
        "territory-rush:first-claim",
        "territory-rush:half",
        "territory-rush:dominate",
      ]),
    );
    expect(tr.questsCompleted).toContain(`${trDay}:tr-claim`);
    expect(tr.questProgress[`${trDay}:tr-claim`]).toBe(75);

    const ccDay = findDayForQuestStat("crowd-control:pack");
    const cc = computeRunRewards({
      ...baseCtx,
      gameId: "crowd-control",
      mode: "rush",
      score: 130,
      result: "finish",
      metadata: { pack: 130, bossCleared: true },
      dayKey: ccDay,
    });
    expect(cc.achievements).toEqual(
      expect.arrayContaining([
        "crowd-control:pack-gate",
        "crowd-control:pack-60",
        "crowd-control:pack-120",
        "crowd-control:win-boss",
      ]),
    );
    expect(cc.questsCompleted).toContain(`${ccDay}:cc-pack`);
    expect(cc.questProgress[`${ccDay}:cc-pack`]).toBe(130);
  });

  it("reconstructs newer game achievements and maps explicit achievement XP", () => {
    const reconstructed = reconstructAchievementsFromScores([
      {
        gameId: "sky-stack",
        mode: "climb",
        score: 6800,
        verified: "verified",
        metadata: { floors: 68, maxStreak: 9, fevers: 2 },
      },
      {
        gameId: "knockout-circuit",
        mode: "map-a",
        score: 34000,
        verified: "verified",
        metadata: { result: "finish", falls: 0 },
      },
      {
        gameId: "pocket-striker",
        mode: "layout",
        score: 2,
        verified: "verified",
        metadata: { banked: true, par: 3 },
      },
      {
        gameId: "territory-rush",
        mode: "arena",
        score: 74,
        verified: "verified",
        metadata: {},
      },
      {
        gameId: "crowd-control",
        mode: "rush",
        score: 125,
        verified: "verified",
        metadata: { result: "finish", bossCleared: true },
      },
    ]);
    expect(reconstructed).toEqual(
      expect.arrayContaining([
        "platform:arcade-tourist",
        "sky-stack:streak-8",
        "sky-stack:fever-2",
        "knockout-circuit:finish",
        "knockout-circuit:no-fall",
        "knockout-circuit:fast",
        "pocket-striker:bank",
        "pocket-striker:under-par",
        "territory-rush:half",
        "territory-rush:dominate",
        "crowd-control:pack-60",
        "crowd-control:pack-120",
        "crowd-control:win-boss",
      ]),
    );
    expect(achievementXp("sky-stack:floor-67")).toBe(50);
    expect(achievementXp("knockout-circuit:no-fall")).toBe(30);
    expect(achievementXp("pocket-striker:perfect")).toBe(25);
    expect(achievementXp("territory-rush:half")).toBe(40);
    expect(achievementXp("crowd-control:pack-120")).toBe(35);
  });
});
