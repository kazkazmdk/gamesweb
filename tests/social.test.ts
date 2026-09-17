import { describe, expect, it } from "vitest";
import { placeSlab, slabScore } from "../games/sky-stack/src/systems/stack.ts";
import { LAYOUTS } from "../games/pocket-striker/src/systems/layouts.ts";
import { MAPS } from "../games/knockout-circuit/src/systems/maps.ts";
import { applyOp, buildCourse } from "../games/crowd-control/src/systems/course.ts";
import {
  applyChallengeAttempt,
  challengeOutcome,
  dailyArcadeEvents,
  decodeChallengePayload,
  encodeChallengePayload,
  GAME_MANIFESTS,
  ghostCompatible,
  nextBestAction,
  normalizePerformance,
  rankScores,
} from "../packages/game-sdk/src/index.ts";
import { validateScore, lowerIsBetter } from "../packages/database/src/index.ts";

describe("catalog", () => {
  it("ships eight playable manifests", () => {
    expect(GAME_MANIFESTS).toHaveLength(8);
    for (const g of GAME_MANIFESTS) {
      expect(g.challengeTypes.length).toBeGreaterThan(0);
      expect(g.socialModes.includes("solo")).toBe(true);
      expect(g.sessionDuration.minSec).toBeGreaterThan(0);
    }
  });
});

describe("sky stack overlap", () => {
  it("scores a perfect and a miss", () => {
    const top = { x: 100, y: 400, w: 200 };
    const perfect = placeSlab({ x: 101, y: 370, w: 200 }, top);
    expect(perfect.kind).toBe("perfect");
    const miss = placeSlab({ x: 400, y: 370, w: 200 }, top);
    expect(miss.kind).toBe("miss");
    expect(slabScore("perfect", 3, true)).toBeGreaterThan(slabScore("ok", 0, false));
  });
});

describe("new game content", () => {
  it("has three knockout maps and twelve pocket tables", () => {
    expect(MAPS).toHaveLength(3);
    expect(LAYOUTS).toHaveLength(12);
    expect(buildCourse("2026-09-17").length).toBeGreaterThan(8);
    expect(applyOp(10, { kind: "mul", n: 2 })).toBe(20);
  });
  it("keeps daily arcade seeds stable", () => {
    expect(dailyArcadeEvents("2026-09-17")).toEqual(dailyArcadeEvents("2026-09-17"));
    expect(dailyArcadeEvents("2026-09-17")[0].seed).not.toBe(dailyArcadeEvents("2026-09-18")[0].seed);
  });
});

describe("challenge engine", () => {
  it("encodes a shareable payload", () => {
    const token = encodeChallengePayload({
      publicCode: "7FQ2K",
      gameId: "sky-stack",
      mode: "climb",
      seed: "abc",
      type: "beat-score",
      challengerName: "Loan",
      challengerScore: 6700,
      gameVersion: "1.0.0",
      trust: "unverified",
      expiresAt: Date.now() + 1000,
      challengerId: "loan",
    });
    expect(decodeChallengePayload(token)?.challengerName).toBe("Loan");
  });

  it("does not double-complete the same attempt", () => {
    const challenge = {
      id: "c1",
      publicCode: "7FQ2K",
      gameId: "velocity-run",
      mode: "course-1",
      seed: "s",
      type: "beat-time" as const,
      challengerId: "loan",
      challengerName: "Loan",
      targetId: null,
      targetName: null,
      challengerRunId: null,
      challengerScore: 32410,
      challengerGhostId: null,
      challengerMeta: {},
      status: "open" as const,
      createdAt: 1,
      expiresAt: 9e12,
      metadata: {},
      winnerId: null,
      targetScore: null,
      trust: "verified" as const,
      gameVersion: "1.2.0",
      attempts: [],
    };
    const attempt = {
      id: "a1",
      challengeId: "c1",
      playerId: "vic",
      playerName: "Victor",
      score: 31000,
      runId: "r1",
      trust: "verified" as const,
      createdAt: 2,
      metadata: {},
    };
    const first = applyChallengeAttempt(challenge, attempt);
    expect(first.duplicate).toBe(false);
    expect(first.outcome).toBe("win");
    const second = applyChallengeAttempt(first.challenge, attempt);
    expect(second.duplicate).toBe(true);
    expect(challengeOutcome("beat-time", 32410, 31000, true)).toBe("win");
  });

  it("ignores practice attempts as winners", () => {
    const challenge = {
      id: "c2",
      publicCode: "AAAAA",
      gameId: "sky-stack",
      mode: "climb",
      seed: "s",
      type: "beat-score" as const,
      challengerId: "loan",
      challengerName: "Loan",
      targetId: null,
      targetName: null,
      challengerRunId: null,
      challengerScore: 100,
      challengerGhostId: null,
      challengerMeta: {},
      status: "open" as const,
      createdAt: 1,
      expiresAt: 9e12,
      metadata: {},
      winnerId: null,
      targetScore: null,
      trust: "verified" as const,
      gameVersion: "1.0.0",
      attempts: [],
    };
    const r = applyChallengeAttempt(challenge, {
      id: "p",
      challengeId: "c2",
      playerId: "g",
      playerName: "Guest",
      score: 9999,
      runId: null,
      trust: "practice",
      createdAt: 3,
      metadata: {},
    });
    expect(r.outcome).toBe("pending");
    expect(r.challenge.winnerId).toBeNull();
  });
});

describe("next best action", () => {
  it("prefers an open challenge", () => {
    const a = nextBestAction({
      recentRuns: [],
      retries: 0,
      gamesPlayed: [],
      openChallenge: { code: "7FQ2K", gameId: "sky-stack", from: "Loan" },
    });
    expect(a.href).toBe("/c/7FQ2K");
  });
});

describe("normalize + party points", () => {
  it("does not add raw ms to points", () => {
    const sky = normalizePerformance("sky-stack", 9000);
    const vel = normalizePerformance("velocity-run", 38000);
    expect(sky).toBeGreaterThan(0);
    expect(vel).toBeGreaterThan(0);
    expect(rankScores([{ id: "a", score: 1 }, { id: "b", score: 4 }], true)[0].id).toBe("a");
  });
  it("marks pocket and knockout as lower-is-better", () => {
    expect(lowerIsBetter("pocket-striker")).toBe(true);
    expect(lowerIsBetter("knockout-circuit")).toBe(true);
    expect(lowerIsBetter("sky-stack")).toBe(false);
  });
});

describe("ghost version", () => {
  it("rejects major mismatch", () => {
    expect(ghostCompatible("1.2.0", "1.0.0")).toBe(true);
    expect(ghostCompatible("1.2.0", "2.0.0")).toBe(false);
  });
});

describe("validate new games", () => {
  const base = {
    sessionId: "11111111-1111-1111-1111-111111111111",
    gameVersion: "1.0.0",
    durationMs: 45000,
    startedAt: 1_000_000,
    endedAt: 1_045_000,
  };
  it("verifies sky stack", () => {
    const v = validateScore({ ...base, gameId: "sky-stack", mode: "climb", score: 2400, metadata: { floors: 12 } });
    expect(v.status).toBe("verified");
  });
  it("flags unknown leftover ids", () => {
    const v = validateScore({ ...base, gameId: "not-a-game", mode: "x", score: 1, metadata: {} });
    expect(v.status).toBe("flagged");
  });
});
