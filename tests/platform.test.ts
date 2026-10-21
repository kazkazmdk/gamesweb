import { describe, expect, it } from "vitest";
import { activityFromHistory, challengeViewModel, friendsBoard, gameRecordFor, latestUnlocks, playerStatsFromSnapshot } from "../apps/web/lib/platform/adapters";
import { formatCountdown, formatPlayScore, formatRank, greeting, hasRecord, zeroResultCopy } from "../apps/web/lib/platform/format";
import { boardModeOptions, boardModeFromPlayIndex, defaultBoardMode, isCompactCatalog, lowerIsBetter, neonBoardMode, playModeOptions, resolvePlayIndex } from "../apps/web/lib/platform/modes";
import { store, type PlayerSnapshot } from "../apps/web/lib/player-store";

const player = {
  history: [
    { gameId: "neon-drift", at: 1_000, durationMs: 8000, score: 22000, result: "finish", metadata: { pbDelta: 1200 } },
  ],
  pbCount: 2,
  achievements: ["platform:first-run", "neon-drift:score-25k"],
  achievementUnlocks: { "neon-drift:score-25k": 2_000, "platform:first-run": 1_000 },
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
  it("keeps zero-result copy game-aware", () => {
    expect(zeroResultCopy("neon-drift")).toBe("No score banked");
    expect(zeroResultCopy("velocity-run")).toBe("No finish recorded");
    expect(zeroResultCopy("swarm-protocol")).toBe("No survival score");
    expect(zeroResultCopy("knockout-circuit")).toBe("Eliminated before scoring");
    expect(zeroResultCopy("pocket-striker")).toBe("No points scored");
    expect(zeroResultCopy("territory-rush")).toBe("No territory secured");
    expect(zeroResultCopy("sky-stack")).toBe("No stack score");
    expect(zeroResultCopy("crowd-control")).toBe("Run ended before scoring");
    expect(zeroResultCopy("unknown-title")).toBe("No score recorded");
    expect(Object.values({
      v: zeroResultCopy("velocity-run"),
      s: zeroResultCopy("swarm-protocol"),
      k: zeroResultCopy("knockout-circuit"),
    }).every((copy) => !/banked/i.test(copy))).toBe(true);
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
    expect(boardModeFromPlayIndex("velocity-run", 2)).toBe("course-1c");
    expect(boardModeFromPlayIndex("velocity-run", 4)).toBe("course-2");
    expect(boardModeFromPlayIndex("knockout-circuit", 4)).toBe("map-e");
    expect(playModeOptions("velocity-run")).toHaveLength(12);
    expect(playModeOptions("knockout-circuit")).toHaveLength(8);
    expect(playModeOptions("pocket-striker")).toHaveLength(18);
    expect(playModeOptions("crowd-control")).toHaveLength(15);
    expect(playModeOptions("territory-rush")).toHaveLength(2);
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
    expect(resolvePlayIndex("velocity-run", "?mode=course-1b")).toBe(1);
    expect(resolvePlayIndex("knockout-circuit", "?play=7")).toBe(7);
    expect(resolvePlayIndex("pocket-striker", "?mode=13")).toBe(13);
  });
});

describe("adapters", () => {
  it("derives stats from snapshot", () => {
    expect(playerStatsFromSnapshot(player)).toEqual({ runs: 1, pbs: 2, achievements: 2, games: 1 });
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
  it("sorts recent unlocks by timestamp not catalog order", () => {
    const recent = latestUnlocks(player, 1);
    expect(recent[0]?.key).toBe("score-25k");
  });
  it("sorts lowerIsBetter leaderboards with lower strokes first for pocket-striker and lower times first for knockout-circuit", () => {
    expect(lowerIsBetter("pocket-striker")).toBe(true);
    expect(lowerIsBetter("knockout-circuit")).toBe(true);

    store.snapshot = {
      ...store.snapshot,
      displayName: "You",
      username: "you",
      scores: [
        { id: "ps-1", gameId: "pocket-striker", mode: "layout", score: 5, at: 1000, verified: "verified", metadata: {} },
        { id: "ps-2", gameId: "pocket-striker", mode: "layout", score: 2, at: 2000, verified: "verified", metadata: {} },
        { id: "kc-1", gameId: "knockout-circuit", mode: "map-a", score: 58000, at: 1000, verified: "verified", metadata: {} },
        { id: "kc-2", gameId: "knockout-circuit", mode: "map-a", score: 41200, at: 2000, verified: "verified", metadata: {} },
      ],
    };
    store.remoteBoards["pocket-striker:layout"] = [
      { name: "Rival A", username: "rival_a", score: 4, isYou: false, verified: true },
      { name: "Rival B", username: "rival_b", score: 1, isYou: false, verified: true },
    ];
    store.remoteBoards["knockout-circuit:map-a"] = [
      { name: "Runner A", username: "runner_a", score: 49500, isYou: false, verified: true },
      { name: "Runner B", username: "runner_b", score: 39100, isYou: false, verified: true },
    ];

    const pocketBoard = store.leaderboard("pocket-striker", "layout");
    expect(pocketBoard.map((r) => r.score)).toEqual([1, 2, 4]);

    const koBoard = store.leaderboard("knockout-circuit", "map-a");
    expect(koBoard.map((r) => r.score)).toEqual([39100, 41200, 49500]);

    expect(gameRecordFor(store.snapshot, "pocket-striker", "layout").score).toBe(2);
    expect(gameRecordFor(store.snapshot, "knockout-circuit", "map-a").score).toBe(41200);
  });
  it("preserves run metadata seed in createChallengeFromRun and falls back when absent", async () => {
    const { MemoryBackend } = await import("../apps/web/lib/backend/memory");
    const backend = new MemoryBackend();
    const identity = { userId: "u-seed-1", anonymousId: "anon-seed-1", email: null };
    const session1 = await backend.startSession({
      identity,
      gameId: "sky-stack",
      gameVersion: "1.0.0",
      device: "desktop",
    });
    const runWithSeed = await backend.submitScore({
      identity,
      session: session1,
      gameId: "sky-stack",
      mode: "climb",
      score: 3400,
      durationMs: 12000,
      metadata: { seed: "custom-seed-42", floors: 34 },
      verified: "verified",
    });
    const created1 = await backend.createChallengeFromRun(identity, runWithSeed.score.id);
    expect("challenge" in created1 && created1.challenge.seed).toBe("custom-seed-42");

    const session2 = await backend.startSession({
      identity,
      gameId: "neon-drift",
      gameVersion: "1.2.0",
      device: "desktop",
    });
    const runWithoutSeed = await backend.submitScore({
      identity,
      session: session2,
      gameId: "neon-drift",
      mode: "foundation",
      score: 28000,
      durationMs: 45000,
      metadata: {},
      verified: "verified",
    });
    const created2 = await backend.createChallengeFromRun(identity, runWithoutSeed.score.id);
    expect("challenge" in created2 && created2.challenge.seed).toBe(`neon-drift:${runWithoutSeed.score.id}`);
  });
});
