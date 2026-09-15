import { describe, expect, it } from "vitest";
import { activityFromHistory, challengeViewModel, friendsBoard, playerStatsFromSnapshot } from "../apps/web/lib/platform/adapters";
import { formatCountdown, formatPlayScore, formatRank, greeting, hasRecord } from "../apps/web/lib/platform/format";
import { boardModeOptions, boardModeFromPlayIndex, defaultBoardMode, isCompactCatalog, neonBoardMode, playModeOptions } from "../apps/web/lib/platform/modes";
import type { PlayerSnapshot } from "../apps/web/lib/player-store";

const player = {
  history: [
    { gameId: "neon-drift", at: 1_000, durationMs: 8000, score: 22000, result: "finish", metadata: { pbDelta: 1200 } },
  ],
  pbCount: 2,
  achievements: ["platform:first-run"],
  questProgress: { "2026-09-14:nd-score-25k": 18420 },
  questCompleted: [],
  friends: [{ id: "1", username: "v", displayName: "Victor", avatar: "orb-1", status: "accepted", presence: "offline" }],
  scores: [],
} as unknown as PlayerSnapshot;

describe("platform format", () => {
  it("formats arcade numbers", () => {
    expect(formatPlayScore("neon-drift", 82400)).toBe("82,400");
    expect(formatPlayScore("velocity-run", 38210)).toBe("38.210s");
    expect(formatRank(314)).toBe("#314");
    expect(hasRecord(0)).toBe(false);
    expect(formatCountdown(3661000)).toBe("1:01:01");
  });
  it("greets by hour", () => {
    expect(greeting(new Date("2026-09-15T15:00:00"))).toBe("Good afternoon");
  });
});

describe("catalog and modes", () => {
  it("keeps compact discovery under 6 titles", () => {
    expect(isCompactCatalog(3)).toBe(true);
    expect(isCompactCatalog(12)).toBe(false);
  });
  it("maps play indexes onto neon and velocity boards", () => {
    expect(boardModeFromPlayIndex("neon-drift", 1)).toBe("technical");
    expect(boardModeFromPlayIndex("velocity-run", 2)).toBe("course-3");
    expect(boardModeOptions("neon-drift").map((m) => m.id)).toEqual([
      "foundation",
      "technical",
      "velocity",
      "daily",
      "circuit",
    ]);
    expect(playModeOptions("neon-drift").map((m) => m.label)).toContain("Hairpin District");
    expect(neonBoardMode(1)).toBe("technical");
    expect(neonBoardMode(0, true)).toBe("daily");
    expect(defaultBoardMode("neon-drift")).toBe("foundation");
    expect(defaultBoardMode("velocity-run")).toBe("course-1");
  });
});

describe("adapters", () => {
  it("derives stats from snapshot", () => {
    expect(playerStatsFromSnapshot(player)).toEqual({ runs: 1, pbs: 2, achievements: 1, games: 1 });
  });
  it("builds challenge progress without faking", () => {
    const view = challengeViewModel(player, {
      id: "2026-09-14:nd-score-25k",
      title: "Hold the line",
      description: "Score 25,000 in Neon Drift.",
      type: "daily",
      gameId: "neon-drift",
      stat: "neon-drift:score",
      target: 25000,
      xp: 60,
    });
    expect(view.progress).toBe(18420);
    expect(view.done).toBe(false);
    expect(view.currentLabel).toBe("18,420");
  });
  it("filters friend boards honestly", () => {
    const rows = [
      { name: "Player", username: "player", score: 10, isYou: true },
      { name: "Victor", username: "v", score: 8 },
      { name: "Stranger", username: "stranger", score: 9 },
    ];
    expect(friendsBoard(rows, player.friends).map((r) => r.name)).toEqual(["Player", "Victor"]);
  });
  it("maps history into activity", () => {
    const items = activityFromHistory(player.history);
    expect(items[0].event).toBe("New PB");
    expect(items[0].title).toBe("Neon Drift");
  });
});
