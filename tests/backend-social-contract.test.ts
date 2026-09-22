process.env.GAMESWEB_BACKEND = "memory";

import { describe, expect, it } from "vitest";
import { GAME_MANIFESTS } from "../packages/game-sdk/src/index.ts";
import { lowerIsBetter } from "../packages/database/src/index.ts";
import type { Identity } from "../apps/web/lib/api/identity.ts";
import { MemoryBackend, resetMemoryStore } from "../apps/web/lib/backend/memory.ts";
import { rankPartyRound, validateCompetitiveRunTarget } from "../apps/web/lib/backend/competitive-contract.ts";

function ident(anon: string): Identity {
  return { userId: null, anonymousId: anon, email: null };
}

async function scoreRun(store: MemoryBackend, identity: Identity, gameId: string, mode: string, score: number, verified: "verified" | "unverified" | "flagged" = "verified") {
  const session = await store.startSession({ identity, gameId, gameVersion: "1.0.0", device: "desktop" });
  const result = await store.submitScore({
    identity,
    session,
    gameId,
    mode,
    score,
    durationMs: 8000,
    metadata: {},
    verified,
  });
  return result.score.id;
}

async function playingParty(store: MemoryBackend, playlist: Array<{ gameId: string; mode: string }>) {
  const host = ident("actor-a");
  const guest = ident("actor-b");
  const created = await store.createParty(host, "A");
  const live = store.parties.get(created.code);
  if (!live) throw new Error("party missing");
  live.playlist = playlist;
  await store.joinParty(guest, created.code, "B");
  await store.setPartyReady(guest, created.code, true);
  const started = await store.startParty(host, created.code);
  if ("error" in started) throw new Error(started.error);
  return { host, guest, code: created.code };
}

describe("memory social contract", () => {
  it("keeps lowerIsBetter aligned with each manifest", () => {
    for (const game of GAME_MANIFESTS) {
      expect(lowerIsBetter(game.id)).toBe(game.scoreDirection === "lower");
    }
  });

  it("ranks a higher-is-better round only after both attempts", async () => {
    const store = resetMemoryStore();
    const { host, guest, code } = await playingParty(store, [{ gameId: "sky-stack", mode: "climb" }]);
    const a = await scoreRun(store, host, "sky-stack", "climb", 100);
    const b = await scoreRun(store, guest, "sky-stack", "climb", 200);
    const afterA = await store.submitPartyRound(host, code, a);
    expect("error" in afterA).toBe(false);
    if ("error" in afterA) return;
    expect(afterA.state).toBe("playing");
    expect(afterA.standings).toEqual([]);
    const afterB = await store.submitPartyRound(guest, code, b);
    expect("error" in afterB).toBe(false);
    if ("error" in afterB) return;
    expect(afterB.state).toBe("results");
    expect(afterB.standings.find((row) => row.name === "B")?.points).toBe(10);
    expect(afterB.standings.find((row) => row.name === "A")?.points).toBe(7);
    expect(afterB.members.find((row) => row.name === "B")).toMatchObject({ points: 10, lastRoundScore: 200 });
    expect(afterB.members.find((row) => row.name === "A")).toMatchObject({ points: 7, lastRoundScore: 100 });
  });

  it("starts only from the lobby and advances until done", async () => {
    const store = resetMemoryStore();
    const host = ident("sm-a");
    const guest = ident("sm-b");
    const created = await store.createParty(host, "A");
    const live = store.parties.get(created.code);
    if (!live) throw new Error("party missing");
    live.playlist = [
      { gameId: "sky-stack", mode: "climb" },
      { gameId: "sky-stack", mode: "climb" },
    ];
    expect((await store.getParty(created.code))?.state).toBe("lobby");
    await store.joinParty(guest, created.code, "B");
    await store.setPartyReady(guest, created.code, true);
    const started = await store.startParty(host, created.code);
    expect("error" in started).toBe(false);
    if ("error" in started) return;
    expect(started.state).toBe("playing");
    const guestId = started.members.find((row) => row.name === "B")?.id;
    await store.setPartyReady(guest, created.code, false);
    expect((await store.getParty(created.code))?.roundRoster).toContain(guestId);
    expect((await store.startParty(host, created.code)) as { error?: string }).toMatchObject({ error: "bad_state" });
    expect((await store.advanceParty(host, created.code)) as { error?: string }).toMatchObject({ error: "bad_state" });

    const a1 = await scoreRun(store, host, "sky-stack", "climb", 100);
    const b1 = await scoreRun(store, guest, "sky-stack", "climb", 200);
    const afterA = await store.submitPartyRound(host, created.code, a1);
    expect("error" in afterA).toBe(false);
    if (!("error" in afterA)) expect(afterA.state).toBe("playing");
    const afterB = await store.submitPartyRound(guest, created.code, b1);
    expect("error" in afterB).toBe(false);
    if ("error" in afterB) return;
    expect(afterB.state).toBe("results");
    expect((await store.startParty(host, created.code)) as { error?: string }).toMatchObject({ error: "bad_state" });
    await store.setPartyReady(guest, created.code, true);
    const advanced = await store.advanceParty(host, created.code);
    expect("error" in advanced).toBe(false);
    if ("error" in advanced) return;
    expect(advanced.state).toBe("playing");
    expect(advanced.round).toBe(1);
    expect((await store.startParty(host, created.code)) as { error?: string }).toMatchObject({ error: "bad_state" });
    expect((await store.advanceParty(host, created.code)) as { error?: string }).toMatchObject({ error: "bad_state" });

    const a2 = await scoreRun(store, host, "sky-stack", "climb", 300);
    const b2 = await scoreRun(store, guest, "sky-stack", "climb", 50);
    await store.submitPartyRound(host, created.code, a2);
    const round2 = await store.submitPartyRound(guest, created.code, b2);
    expect("error" in round2).toBe(false);
    if ("error" in round2) return;
    expect(round2.state).toBe("results");
    expect(round2.members.find((row) => row.name === "A")?.points).toBe(17);
    expect(round2.members.find((row) => row.name === "B")?.points).toBe(17);
    const done = await store.advanceParty(host, created.code);
    expect("error" in done).toBe(false);
    if ("error" in done) return;
    expect(done.state).toBe("done");
    expect((await store.startParty(host, created.code)) as { error?: string }).toMatchObject({ error: "bad_state" });
    expect((await store.advanceParty(host, created.code)) as { error?: string }).toMatchObject({ error: "bad_state" });
  });

  it("keeps a sixth member out and lets an existing member reconnect", async () => {
    const store = resetMemoryStore();
    const host = ident("cap-host");
    const party = await store.createParty(host, "H");
    for (let i = 0; i < 5; i += 1) {
      const joined = await store.joinParty(ident(`cap-${i}`), party.code, `G${i}`);
      expect(joined.ok).toBe(true);
    }
    expect(await store.joinParty(ident("cap-extra"), party.code, "X")).toMatchObject({ ok: false, error: "full" });
    const reconnectLobby = await store.joinParty(ident("cap-0"), party.code, "G0");
    expect(reconnectLobby.ok && reconnectLobby.duplicate).toBe(true);
    expect((await store.getParty(party.code))?.members).toHaveLength(6);
    const started = await store.startParty(host, party.code);
    expect("error" in started).toBe(false);
    expect(await store.joinParty(ident("cap-late"), party.code, "Late")).toMatchObject({ ok: false, error: "closed" });
    const reconnect = await store.joinParty(ident("cap-0"), party.code, "G0");
    expect(reconnect.ok && reconnect.duplicate).toBe(true);
    expect((await store.getParty(party.code))?.members).toHaveLength(6);
  });

  it("ranks velocity by lower time and accumulates a second round to 17/17", async () => {
    const store = resetMemoryStore();
    const { host, guest, code } = await playingParty(store, [
      { gameId: "velocity-run", mode: "course-1" },
      { gameId: "sky-stack", mode: "climb" },
    ]);
    const a1 = await scoreRun(store, host, "velocity-run", "course-1", 32);
    const b1 = await scoreRun(store, guest, "velocity-run", "course-1", 41);
    await store.submitPartyRound(host, code, a1);
    const round1 = await store.submitPartyRound(guest, code, b1);
    expect("error" in round1).toBe(false);
    if ("error" in round1) return;
    expect(round1.standings.find((row) => row.name === "A")?.points).toBe(10);
    expect(round1.standings.find((row) => row.name === "B")?.points).toBe(7);
    const advanced = await store.advanceParty(host, code);
    expect("error" in advanced).toBe(false);
    const a2 = await scoreRun(store, host, "sky-stack", "climb", 100);
    const b2 = await scoreRun(store, guest, "sky-stack", "climb", 200);
    await store.submitPartyRound(host, code, a2);
    const round2 = await store.submitPartyRound(guest, code, b2);
    expect("error" in round2).toBe(false);
    if ("error" in round2) return;
    expect(round2.standings.find((row) => row.name === "A")?.points).toBe(17);
    expect(round2.standings.find((row) => row.name === "B")?.points).toBe(17);
  });

  it("rejects the wrong mode, a flagged run, and a reused run", async () => {
    const store = resetMemoryStore();
    const { host, guest, code } = await playingParty(store, [{ gameId: "sky-stack", mode: "climb" }]);
    const wrong = await scoreRun(store, host, "sky-stack", "daily", 900);
    expect((await store.submitPartyRound(host, code, wrong)) as { error?: string }).toMatchObject({ error: "mode_mismatch" });
    const flagged = await scoreRun(store, host, "sky-stack", "climb", 1, "flagged");
    expect((await store.submitPartyRound(host, code, flagged)) as { error?: string }).toMatchObject({ error: "invalid_score" });
    const ok = await scoreRun(store, host, "sky-stack", "climb", 50);
    expect("error" in (await store.submitPartyRound(host, code, ok))).toBe(false);
    const other = await store.createParty(host, "A");
    await store.joinParty(guest, other.code, "B");
    await store.setPartyReady(guest, other.code, true);
    await store.startParty(host, other.code);
    expect((await store.submitPartyRound(host, other.code, ok)) as { error?: string }).toMatchObject({ error: "run_reuse" });
    expect((await store.getParty(code))?.standings).toEqual([]);
  });

  it("rejects challenge mode, game, stolen run, flagged run, and scores lower-is-better", async () => {
    const store = resetMemoryStore();
    const host = ident("host-c");
    const guest = ident("guest-c");
    const thief = ident("thief-c");
    const hostRun = await scoreRun(store, host, "velocity-run", "course-1", 40);
    const created = await store.createChallengeFromRun(host, hostRun);
    expect("error" in created).toBe(false);
    if ("error" in created) return;
    expect(created.challenge.type).toBe("beat-time");
    expect(created.challenge.trust).toBe("verified");

    const wrongType = await scoreRun(store, host, "sky-stack", "climb", 10);
    expect((await store.createChallengeFromRun(host, wrongType, "beat-time")) as { error?: string }).toMatchObject({ error: "type_mismatch" });
    const flagged = await scoreRun(store, host, "sky-stack", "climb", 10, "flagged");
    expect((await store.createChallengeFromRun(host, flagged)) as { error?: string }).toMatchObject({ error: "invalid_score" });

    const wrongMode = await scoreRun(store, guest, "velocity-run", "course-2", 10);
    expect(await store.attemptChallengeFromRun(guest, created.challenge.publicCode, wrongMode)).toMatchObject({ ok: false, error: "mode_mismatch" });
    const wrongGame = await scoreRun(store, guest, "sky-stack", "climb", 999);
    expect(await store.attemptChallengeFromRun(guest, created.challenge.publicCode, wrongGame)).toMatchObject({ ok: false, error: "game_mismatch" });
    expect(await store.attemptChallengeFromRun(thief, created.challenge.publicCode, hostRun)).toMatchObject({ ok: false, error: "run_forbidden" });
    const guestFlagged = await scoreRun(store, guest, "velocity-run", "course-1", 1, "flagged");
    expect(await store.attemptChallengeFromRun(guest, created.challenge.publicCode, guestFlagged)).toMatchObject({ ok: false, error: "invalid_score" });

    const faster = await scoreRun(store, guest, "velocity-run", "course-1", 30);
    const win = await store.attemptChallengeFromRun(guest, created.challenge.publicCode, faster);
    expect(win.ok && win.outcome).toBe("win");
    const rivals = await store.listRivals(host);
    const rival = rivals.find((row) => row.otherId.includes("guest-c"));
    const stored = await store.getChallenge(created.challenge.publicCode);
    expect(rival?.winsB).toBe(1);
    expect(rival?.lastMatch).toBe(stored?.attempts[0]?.createdAt);

    const drawHost = await scoreRun(store, host, "sky-stack", "climb", 80, "unverified");
    const drawCreated = await store.createChallengeFromRun(host, drawHost);
    expect("error" in drawCreated).toBe(false);
    if ("error" in drawCreated) return;
    expect(drawCreated.challenge.trust).toBe("unverified");
    const drawGuest = await scoreRun(store, guest, "sky-stack", "climb", 80);
    const draw = await store.attemptChallengeFromRun(guest, drawCreated.challenge.publicCode, drawGuest);
    expect(draw.ok && draw.outcome).toBe("draw");

    const higherHost = await scoreRun(store, host, "sky-stack", "climb", 100);
    const higher = await store.createChallengeFromRun(host, higherHost);
    if ("error" in higher) throw new Error(higher.error);
    const higherGuest = await scoreRun(store, guest, "sky-stack", "climb", 200);
    const higherAttempt = await store.attemptChallengeFromRun(guest, higher.challenge.publicCode, higherGuest);
    expect(higherAttempt.ok && higherAttempt.outcome).toBe("win");
    if (!higherAttempt.ok) return;
    const sealed = await store.getChallenge(higher.challenge.publicCode);
    const third = ident("third-c");
    const thirdRun = await scoreRun(store, third, "sky-stack", "climb", 900);
    expect(await store.attemptChallengeFromRun(third, higher.challenge.publicCode, thirdRun)).toMatchObject({
      ok: false,
      error: "challenge_closed",
    });
    const still = await store.getChallenge(higher.challenge.publicCode);
    expect(still?.winnerId).toBe(sealed?.winnerId);
    expect(still?.targetId).toBe(sealed?.targetId);
    expect(still?.targetScore).toBe(sealed?.targetScore);
    expect(still?.attempts).toHaveLength(sealed?.attempts.length ?? 0);

    const selfHost = await scoreRun(store, host, "sky-stack", "climb", 15);
    const selfChallenge = await store.createChallengeFromRun(host, selfHost);
    if ("error" in selfChallenge) throw new Error(selfChallenge.error);
    const selfRun = await scoreRun(store, host, "sky-stack", "climb", 90);
    expect(await store.attemptChallengeFromRun(host, selfChallenge.challenge.publicCode, selfRun)).toMatchObject({
      ok: false,
      error: "self_challenge",
    });
    const untouched = await store.getChallenge(selfChallenge.challenge.publicCode);
    expect(untouched?.status).toBe("open");
    expect(untouched?.attempts).toHaveLength(0);
    expect(untouched?.winnerId).toBeNull();
  });

  it("ranks the same rows the SQL function is specified to rank", () => {
    const higher = rankPartyRound(
      [
        { id: "actor-a", score: 100, submittedAt: 1 },
        { id: "actor-b", score: 200, submittedAt: 2 },
      ],
      "sky-stack",
    );
    expect(higher.map((row) => [row.id, row.points])).toEqual([
      ["actor-b", 10],
      ["actor-a", 7],
    ]);
    const lower = rankPartyRound(
      [
        { id: "actor-a", score: 32, submittedAt: 1 },
        { id: "actor-b", score: 41, submittedAt: 2 },
      ],
      "velocity-run",
    );
    expect(lower[0]).toMatchObject({ id: "actor-a", points: 10 });
    expect(lower[1]).toMatchObject({ id: "actor-b", points: 7 });
    expect(validateCompetitiveRunTarget({ gameId: "sky-stack", mode: "daily" }, { gameId: "sky-stack", mode: "climb" })).toEqual({
      ok: false,
      error: "mode_mismatch",
    });
    expect(
      validateCompetitiveRunTarget(
        { gameId: "swarm-protocol", mode: "seed", seed: "day-1" },
        { gameId: "swarm-protocol", mode: "seed", seed: "day-2" },
      ),
    ).toEqual({ ok: false, error: "seed_mismatch" });
  });
});
