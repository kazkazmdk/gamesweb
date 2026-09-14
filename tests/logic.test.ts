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
  it("does not sum XP and unions achievements", () => {
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
          { id: "a", gameId: "neon-drift", mode: "circuit", score: 10, at: 1, verified: "verified", metadata: {} },
        ],
      },
    );
    expect(merged.xp).toBe(800 + 30);
    expect(merged.achievements).toContain("neon-drift:score-25k");
    expect(merged.scores).toHaveLength(1);
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
  it("awards no XP for flagged runs", () => {
    const diff = computeRunRewards({
      gameId: "neon-drift",
      mode: "circuit",
      score: 25000,
      durationMs: 40000,
      result: "finish",
      metadata: { laps: 2, combo: 5 },
      verified: "flagged",
      existingAchievements: [],
      existingXp: 10,
      gamesPlayedToday: 0,
      uniqueGamesToday: [],
      playedGameIds: [],
      pbBefore: 0,
      pbCount: 0,
      dayKey: utcDayKey(),
      hourUtc: 12,
      questProgress: {},
      questCompleted: [],
    });
    expect(diff.xpEarned).toBe(0);
  });
});
