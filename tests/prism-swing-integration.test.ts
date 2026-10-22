import { describe, expect, it } from "vitest";
import {
  GAME_IDS,
  GAME_MODES,
  achievementXp,
  computeRunRewards,
  defaultMode,
  lowerIsBetter,
  reconstructAchievementsFromScores,
  validateScore,
} from "../packages/database/src/index.ts";
import { GAME_MANIFESTS, dailyQuests, getManifest, normalizePerformance } from "../packages/game-sdk/src/index.ts";

describe("prism-drop and swing-vector integration", () => {
  const base = {
    sessionId: "11111111-1111-1111-1111-111111111111",
    gameVersion: "1.0.0",
    durationMs: 45000,
    startedAt: 1_000_000,
    endedAt: 1_045_000,
  };

  it("registers both games in the catalog and score rules", () => {
    expect(GAME_MANIFESTS).toHaveLength(10);
    expect(GAME_IDS).toEqual(expect.arrayContaining(["prism-drop", "swing-vector"]));
    expect(getManifest("prism-drop")?.modes).toEqual(["well", "daily"]);
    expect(GAME_MODES["swing-vector"]).toEqual(["canyon-1", "canyon-2", "canyon-3", "daily"]);
    expect(defaultMode("prism-drop")).toBe("well");
    expect(defaultMode("swing-vector")).toBe("canyon-1");
    expect(lowerIsBetter("prism-drop")).toBe(false);
    expect(lowerIsBetter("swing-vector")).toBe(true);
    expect(normalizePerformance("prism-drop", 16000)).toBeGreaterThan(0);
    expect(normalizePerformance("swing-vector", 22000)).toBeGreaterThan(0);
  });

  it("validates score ranges and modes", () => {
    expect(validateScore({ ...base, gameId: "prism-drop", mode: "well", score: 12000, metadata: {} }).status).toBe(
      "verified",
    );
    expect(validateScore({ ...base, gameId: "prism-drop", mode: "daily", score: 0, metadata: {} }).status).toBe(
      "verified",
    );
    expect(
      validateScore({ ...base, gameId: "prism-drop", mode: "well", score: 9_000_000, metadata: {} }).status,
    ).toBe("flagged");
    expect(
      validateScore({ ...base, gameId: "prism-drop", mode: "canyon-1", score: 10, metadata: {} }).reasons,
    ).toContain("invalid_mode");
    expect(
      validateScore({ ...base, gameId: "swing-vector", mode: "canyon-2", score: 24000, metadata: {} }).status,
    ).toBe("verified");
    expect(
      validateScore({ ...base, gameId: "swing-vector", mode: "canyon-1", score: 1000, metadata: {} }).status,
    ).toBe("flagged");
    expect(
      validateScore({ ...base, gameId: "swing-vector", mode: "well", score: 20000, metadata: {} }).reasons,
    ).toContain("invalid_mode");
  });

  it("unlocks achievements and daily quests", () => {
    function findDay(stat: string) {
      for (let d = 1; d <= 160; d += 1) {
        const day = `2026-11-${String((d % 28) + 1).padStart(2, "0")}-${d}`;
        if (dailyQuests(day).some((q) => q.stat === stat)) return day;
      }
      throw new Error(`no day for ${stat}`);
    }
    const pdDay = findDay("prism-drop:maxTile");
    const svDay = findDay("swing-vector:finish");
    const ctx = {
      durationMs: 70_000,
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
    const pd = computeRunRewards({
      ...ctx,
      gameId: "prism-drop",
      mode: "well",
      score: 90_000,
      result: "finish",
      metadata: { merges: 12, maxChain: 4, maxTile: 2048 },
      dayKey: pdDay,
    });
    expect(pd.achievements).toEqual(
      expect.arrayContaining([
        "prism-drop:first-merge",
        "prism-drop:chain-4",
        "prism-drop:tile-512",
        "prism-drop:tile-2048",
      ]),
    );
    expect(pd.questsCompleted).toContain(`${pdDay}:pd-tile-512`);

    const sv = computeRunRewards({
      ...ctx,
      gameId: "swing-vector",
      mode: "canyon-1",
      score: 21_000,
      result: "finish",
      metadata: { sonicSnap: true, falls: 0 },
      pbBefore: Number.POSITIVE_INFINITY,
      dayKey: svDay,
    });
    expect(sv.achievements).toEqual(
      expect.arrayContaining([
        "swing-vector:first-swing",
        "swing-vector:sonic-snap",
        "swing-vector:clean-canyon",
        "swing-vector:sub-24",
      ]),
    );
    expect(sv.questsCompleted).toContain(`${svDay}:sv-finish`);
    expect(achievementXp("prism-drop:tile-2048")).toBe(60);
    expect(achievementXp("swing-vector:sub-24")).toBe(45);

    const rebuilt = reconstructAchievementsFromScores([
      {
        gameId: "prism-drop",
        mode: "well",
        score: 90_000,
        verified: "verified",
        metadata: { merges: 3, maxChain: 4, maxTile: 2048 },
      },
      {
        gameId: "swing-vector",
        mode: "canyon-1",
        score: 21_000,
        verified: "verified",
        metadata: { result: "finish", sonicSnap: true, falls: 0 },
      },
    ]);
    expect(rebuilt).toEqual(
      expect.arrayContaining(["prism-drop:tile-2048", "swing-vector:sub-24", "swing-vector:clean-canyon"]),
    );
  });
});
