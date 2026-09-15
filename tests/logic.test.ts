import { describe, expect, it } from "vitest";
import { levelFromXp, totalXpForLevel, xpRequiredForLevel } from "../packages/config/src/index.ts";
import { dailyQuests, recommend, utcDayKey } from "../packages/game-sdk/src/quests.ts";
import { medalForTime, mergeGuestIntoAccount, validateScore } from "../packages/database/src/index.ts";
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
});
