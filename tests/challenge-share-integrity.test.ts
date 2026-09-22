import { beforeEach, describe, expect, it, vi } from "vitest";
import { encodeChallengePayload, type ChallengeRecord } from "../packages/game-sdk/src/index.ts";
import {
  localChallengeFromShare,
  planChallengeAttempt,
  planChallengeCreate,
} from "../apps/web/lib/social/challenge-integrity.ts";

vi.mock("@/lib/player-api", () => ({
  playerApi: {
    attemptChallenge: vi.fn(),
    getChallenge: vi.fn(),
    createChallenge: vi.fn(),
    inbox: vi.fn(),
    rivals: vi.fn(),
    markInboxRead: vi.fn(),
  },
}));

vi.mock("@gamesweb/analytics", () => ({
  analytics: { track: vi.fn() },
}));

import { playerApi } from "../apps/web/lib/player-api.ts";
import { ArcadeStore } from "../apps/web/lib/social/arcade-store.ts";

function share(overrides: Partial<Parameters<typeof encodeChallengePayload>[0]> = {}) {
  return {
    publicCode: "FAKE1",
    gameId: "sky-stack",
    mode: "climb",
    seed: "local-seed",
    type: "beat-score" as const,
    challengerName: "Attacker",
    challengerScore: 999999,
    gameVersion: "1.0.0",
    trust: "verified" as const,
    expiresAt: Date.now() + 60_000,
    challengerId: "attacker",
    ...overrides,
  };
}

function attempt(score = 100) {
  return {
    id: "att-1",
    playerId: "guest-b",
    playerName: "B",
    score,
    runId: "run-b",
    trust: "unverified" as const,
    createdAt: Date.now(),
    metadata: {},
  };
}

function serverChallenge(overrides: Partial<ChallengeRecord> = {}): ChallengeRecord {
  return {
    id: "server-1",
    publicCode: "SRV01",
    gameId: "sky-stack",
    mode: "climb",
    seed: "sky-stack:run",
    type: "beat-score",
    challengerId: "host",
    challengerName: "Host",
    targetId: "guest-b",
    targetName: "B",
    challengerRunId: "run-a",
    challengerScore: 100,
    challengerGhostId: null,
    challengerMeta: {},
    status: "completed",
    createdAt: 1,
    expiresAt: Date.now() + 60_000,
    metadata: { persistence: "server" },
    winnerId: "guest-b",
    targetScore: 200,
    trust: "unverified",
    gameVersion: "1.0.0",
    attempts: [
      {
        id: "a1",
        challengeId: "server-1",
        playerId: "guest-b",
        playerName: "B",
        score: 200,
        runId: "run-b",
        trust: "unverified",
        createdAt: 2,
        metadata: {},
      },
    ],
    ...overrides,
  };
}

describe("untrusted local share", () => {
  it("forces unverified trust and keeps an expired share unplayable", () => {
    const built = localChallengeFromShare(share(), "FAKE1");
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.challenge.trust).toBe("unverified");
    expect(built.challenge.metadata.persistence).toBe("local");
    expect(built.challenge.metadata.source).toBe("local-share");
    const expired = localChallengeFromShare(share({ expiresAt: Date.now() - 10 }), "FAKE1");
    expect(expired.ok).toBe(true);
    if (!expired.ok) return;
    expect(expired.challenge.status).toBe("expired");
  });

  it("rejects a share that does not match the code, game, type, or mode", () => {
    expect(localChallengeFromShare(share(), "OTHER").ok).toBe(false);
    expect(localChallengeFromShare(share({ gameId: "nope-game" }), "FAKE1")).toMatchObject({ ok: false, error: "game_mismatch" });
    expect(localChallengeFromShare(share({ type: "beat-time" }), "FAKE1")).toMatchObject({ ok: false, error: "type_mismatch" });
    expect(localChallengeFromShare(share({ mode: "not-a-mode" }), "FAKE1")).toMatchObject({ ok: false, error: "mode_mismatch" });
    expect(localChallengeFromShare({} as Parameters<typeof localChallengeFromShare>[0], "7FQ2K")).toMatchObject({
      ok: false,
      error: "not_found",
    });
  });
});

describe("challenge attempt planning", () => {
  it("uses a server success and rejects business errors", () => {
    expect(planChallengeAttempt({ remote: { ok: true }, hasLocalShare: true, serverBacked: true })).toEqual({
      action: "use-server",
    });
    expect(
      planChallengeAttempt({
        remote: { ok: false, status: 409, error: { message: "challenge_closed" } },
        hasLocalShare: true,
        serverBacked: true,
      }),
    ).toEqual({ action: "reject", error: "challenge_closed" });
    expect(
      planChallengeAttempt({
        remote: { ok: false, status: 403, error: { message: "self_challenge" } },
        hasLocalShare: true,
        serverBacked: false,
      }),
    ).toEqual({ action: "reject", error: "self_challenge" });
    expect(
      planChallengeAttempt({
        remote: { ok: false, status: 409, error: { message: "run_reuse" } },
        hasLocalShare: true,
        serverBacked: false,
      }),
    ).toEqual({ action: "reject", error: "run_reuse" });
  });

  it("keeps a 404 local share offline and blocks fallback on a server challenge", () => {
    expect(
      planChallengeAttempt({
        remote: { ok: false, status: 404, error: { message: "not_found" } },
        hasLocalShare: true,
        serverBacked: false,
      }),
    ).toEqual({ action: "local" });
    expect(
      planChallengeAttempt({
        remote: { ok: false, status: 404, error: { message: "not_found" } },
        hasLocalShare: true,
        serverBacked: true,
      }),
    ).toEqual({ action: "reject", error: "not_found" });
    expect(
      planChallengeAttempt({
        remote: { ok: false, status: 503, error: { code: "NOT_CONFIGURED", message: "Backend is not configured." } },
        hasLocalShare: false,
        serverBacked: true,
      }),
    ).toEqual({ action: "unavailable", error: "server_unavailable" });
  });

  it("creates a local share only when the server is not rejecting the run", () => {
    expect(planChallengeCreate({ ok: true })).toEqual({ action: "use-server" });
    expect(planChallengeCreate({ ok: false, status: 409, error: { message: "run_reuse" } })).toEqual({
      action: "reject",
      error: "run_reuse",
    });
    expect(planChallengeCreate({ ok: false })).toEqual({ action: "local" });
  });
});

describe("arcade store challenge integrity", () => {
  beforeEach(() => {
    vi.mocked(playerApi.attemptChallenge).mockReset();
    vi.mocked(playerApi.getChallenge).mockReset();
    vi.mocked(playerApi.createChallenge).mockReset();
  });

  it("does not apply a local victory after challenge_closed", async () => {
    const store = new ArcadeStore();
    const sealed = serverChallenge();
    vi.mocked(playerApi.getChallenge).mockResolvedValue({
      ok: true,
      data: { challenge: sealed, persistence: "server" },
    });
    await store.fetchChallenge("SRV01");
    vi.mocked(playerApi.attemptChallenge).mockResolvedValue({
      ok: false,
      status: 409,
      error: { code: "CONFLICT", message: "challenge_closed" },
    });
    const result = await store.completeChallenge("SRV01", attempt(9000), encodeChallengePayload(share({ publicCode: "SRV01" })));
    expect(result).toMatchObject({ ok: false, error: "challenge_closed" });
    const stored = store.getChallenge("SRV01");
    expect(stored && "winnerId" in stored ? stored.winnerId : null).toBe("guest-b");
    expect(stored && "targetScore" in stored ? stored.targetScore : null).toBe(200);
    expect(stored && "attempts" in stored ? stored.attempts : []).toHaveLength(1);
  });

  it("does not fallback after self_challenge or run_reuse", async () => {
    const store = new ArcadeStore();
    const open = serverChallenge({
      publicCode: "OPEN1",
      status: "open",
      targetId: null,
      targetName: null,
      winnerId: null,
      targetScore: null,
      attempts: [],
    });
    vi.mocked(playerApi.getChallenge).mockResolvedValue({
      ok: true,
      data: { challenge: open, persistence: "server" },
    });
    await store.fetchChallenge("OPEN1");
    vi.mocked(playerApi.attemptChallenge).mockResolvedValue({
      ok: false,
      status: 403,
      error: { code: "FORBIDDEN", message: "self_challenge" },
    });
    expect(await store.completeChallenge("OPEN1", attempt())).toMatchObject({ ok: false, error: "self_challenge" });
    expect(store.getChallenge("OPEN1") && "status" in store.getChallenge("OPEN1")! ? store.getChallenge("OPEN1") : null).toMatchObject({
      status: "open",
      attempts: [],
      winnerId: null,
    });

    vi.mocked(playerApi.attemptChallenge).mockResolvedValue({
      ok: false,
      status: 409,
      error: { code: "CONFLICT", message: "run_reuse" },
    });
    expect(await store.completeChallenge("OPEN1", attempt())).toMatchObject({ ok: false, error: "run_reuse" });
    expect(store.getChallenge("OPEN1") && "attempts" in store.getChallenge("OPEN1")! ? store.getChallenge("OPEN1")!.attempts : []).toHaveLength(0);
  });

  it("still completes an offline local share", async () => {
    const store = new ArcadeStore();
    const created = await store.createChallenge({
      gameId: "sky-stack",
      mode: "climb",
      seed: "offline",
      type: "beat-score",
      challengerId: "host",
      challengerName: "Host",
      score: 80,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.persistence).toBe("local");
    expect(created.url).toContain("?p=");
    vi.mocked(playerApi.attemptChallenge).mockResolvedValue({
      ok: false,
      status: 404,
      error: { code: "NOT_FOUND", message: "not_found" },
    });
    const payload = created.url.split("?p=")[1];
    const result = await store.completeChallenge(created.challenge.publicCode, { ...attempt(120), runId: "local-run" }, payload);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.outcome).toBe("win");
    expect(result.challenge.metadata.persistence).toBe("local");
  });

  it("does not invent a local challenge after a server create rejection", async () => {
    const store = new ArcadeStore();
    vi.mocked(playerApi.createChallenge).mockResolvedValue({
      ok: false,
      status: 409,
      error: { code: "CONFLICT", message: "run_reuse" },
    });
    const created = await store.createChallenge({
      gameId: "sky-stack",
      mode: "climb",
      seed: "x",
      type: "beat-score",
      challengerId: "host",
      challengerName: "Host",
      score: 10,
      runId: "used-run",
    });
    expect(created).toMatchObject({ ok: false, error: "run_reuse" });
    expect(store.getChallenge("FAKE1")).toBeNull();
  });
});
