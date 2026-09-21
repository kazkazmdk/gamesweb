process.env.GAMESWEB_BACKEND = "memory";

import { describe, expect, it } from "vitest";
import type { Identity } from "../apps/web/lib/api/identity.ts";
import { resetMemoryStore } from "../apps/web/lib/backend/memory.ts";
import {
  attemptChallengeFromRun,
  createChallengeFromRun,
  createParty,
  joinParty,
  listInbox,
  markInboxRead,
  setPartyReady,
  startParty,
  submitPartyRound,
} from "../apps/web/lib/backend/social-arcade.ts";

function ident(anon: string): Identity {
  return { userId: null, anonymousId: anon, email: null };
}

async function verifiedRun(anon: string, gameId: string, score: number) {
  const store = resetMemoryStore();
  const identity = ident(anon);
  const session = await store.startSession({
    identity,
    gameId,
    gameVersion: "1.0.0",
    device: "desktop",
  });
  const result = await store.submitScore({
    identity,
    session,
    gameId,
    mode: gameId === "neon-drift" ? "circuit" : "climb",
    score,
    durationMs: 8000,
    metadata: { laps: 1 },
    verified: "verified",
  });
  return { store, identity, runId: result.score.id };
}

describe("social security", () => {
  it("rejects a run owned by another player", async () => {
    const a = await verifiedRun("alpha", "sky-stack", 900);
    const b = ident("bravo");
    const created = await a.store.createChallengeFromRun(b, a.runId);
    expect("error" in created && created.error).toBe("run_forbidden");
  });

  it("rejects a Neon run against a Sky Stack challenge", async () => {
    const store = resetMemoryStore();
    const host = ident("host-sec");
    const guest = ident("guest-sec");
    const hostSession = await store.startSession({ identity: host, gameId: "sky-stack", gameVersion: "1.0.0", device: "desktop" });
    const hostScore = await store.submitScore({
      identity: host,
      session: hostSession,
      gameId: "sky-stack",
      mode: "climb",
      score: 1000,
      durationMs: 8000,
      metadata: {},
      verified: "verified",
    });
    const created = await store.createChallengeFromRun(host, hostScore.score.id);
    expect("error" in created).toBe(false);
    if ("error" in created) return;
    const neon = await store.startSession({ identity: guest, gameId: "neon-drift", gameVersion: "1.0.0", device: "desktop" });
    const neonScore = await store.submitScore({
      identity: guest,
      session: neon,
      gameId: "neon-drift",
      mode: "circuit",
      score: 50000,
      durationMs: 8000,
      metadata: { laps: 1 },
      verified: "verified",
    });
    const attempt = await store.attemptChallengeFromRun(guest, created.challenge.publicCode, neonScore.score.id);
    expect(attempt.ok).toBe(false);
    if (!attempt.ok) expect(attempt.error).toBe("game_mismatch");
  });

  it("does not let a non-member submit a party round", async () => {
    const store = resetMemoryStore();
    const host = ident("host-party");
    const stranger = ident("stranger");
    const party = await store.createParty(host, "Host");
    await store.startParty(host, party.code);
    const session = await store.startSession({ identity: stranger, gameId: party.playlist[0].gameId, gameVersion: "1.0.0", device: "desktop" });
    const score = await store.submitScore({
      identity: stranger,
      session,
      gameId: party.playlist[0].gameId,
      mode: party.playlist[0].mode,
      score: 99,
      durationMs: 8000,
      metadata: {},
      verified: "verified",
    });
    const result = await store.submitPartyRound(stranger, party.code, score.score.id);
    expect("error" in result && result.error).toBe("not_member");
  });

  it("does not let a member submit another member's run", async () => {
    const store = resetMemoryStore();
    const host = ident("host-own");
    const guest = ident("guest-own");
    const party = await store.createParty(host, "Host");
    await store.joinParty(guest, party.code, "Guest");
    await store.setPartyReady(guest, party.code, true);
    await store.startParty(host, party.code);
    const hostSession = await store.startSession({ identity: host, gameId: party.playlist[0].gameId, gameVersion: "1.0.0", device: "desktop" });
    const hostScore = await store.submitScore({
      identity: host,
      session: hostSession,
      gameId: party.playlist[0].gameId,
      mode: party.playlist[0].mode,
      score: 40,
      durationMs: 8000,
      metadata: {},
      verified: "verified",
    });
    const stolen = await store.submitPartyRound(guest, party.code, hostScore.score.id);
    expect("error" in stolen && stolen.error).toBe("run_forbidden");
  });

  it("does not advance twice from the same run", async () => {
    const store = resetMemoryStore();
    const host = ident("host-dup");
    const guest = ident("guest-dup");
    const party = await store.createParty(host, "Host");
    await store.joinParty(guest, party.code, "Guest");
    await store.setPartyReady(guest, party.code, true);
    await store.startParty(host, party.code);
    const session = await store.startSession({ identity: host, gameId: party.playlist[0].gameId, gameVersion: "1.0.0", device: "desktop" });
    const score = await store.submitScore({
      identity: host,
      session,
      gameId: party.playlist[0].gameId,
      mode: party.playlist[0].mode,
      score: 10,
      durationMs: 8000,
      metadata: {},
      verified: "verified",
    });
    const first = await store.submitPartyRound(host, party.code, score.score.id);
    const second = await store.submitPartyRound(host, party.code, score.score.id);
    expect("error" in first).toBe(false);
    expect("error" in second && second.error).toBe("duplicate");
    if (!("error" in first)) expect(first.state).toBe("playing");
  });

  it("rejects a flagged score for standings", async () => {
    const store = resetMemoryStore();
    const host = ident("host-flag");
    const party = await store.createParty(host, "Host");
    await store.startParty(host, party.code);
    const session = await store.startSession({ identity: host, gameId: party.playlist[0].gameId, gameVersion: "1.0.0", device: "desktop" });
    const score = await store.submitScore({
      identity: host,
      session,
      gameId: party.playlist[0].gameId,
      mode: party.playlist[0].mode,
      score: 1,
      durationMs: 8000,
      metadata: {},
      verified: "flagged",
    });
    const result = await store.submitPartyRound(host, party.code, score.score.id);
    expect("error" in result && result.error).toBe("invalid_score");
    const next = await store.getParty(party.code);
    expect(next?.standings).toEqual([]);
  });

  it("rejects an expired challenge attempt", async () => {
    const store = resetMemoryStore();
    const host = ident("host-exp");
    const guest = ident("guest-exp");
    const session = await store.startSession({ identity: host, gameId: "sky-stack", gameVersion: "1.0.0", device: "desktop" });
    const score = await store.submitScore({
      identity: host,
      session,
      gameId: "sky-stack",
      mode: "climb",
      score: 500,
      durationMs: 8000,
      metadata: {},
      verified: "verified",
    });
    const created = await store.createChallengeFromRun(host, score.score.id);
    if ("error" in created) throw new Error(created.error);
    created.challenge.expiresAt = Date.now() - 1000;
    store.challenges.set(created.challenge.publicCode, created.challenge);
    const guestSession = await store.startSession({ identity: guest, gameId: "sky-stack", gameVersion: "1.0.0", device: "desktop" });
    const guestScore = await store.submitScore({
      identity: guest,
      session: guestSession,
      gameId: "sky-stack",
      mode: "climb",
      score: 900,
      durationMs: 8000,
      metadata: {},
      verified: "verified",
    });
    const attempt = await store.attemptChallengeFromRun(guest, created.challenge.publicCode, guestScore.score.id);
    expect(attempt.ok).toBe(false);
    if (!attempt.ok) expect(attempt.error).toBe("expired");
  });

  it("keeps inbox rows on the owning identity", async () => {
    const store = resetMemoryStore();
    const host = ident("host-inbox");
    const guest = ident("guest-inbox");
    const thief = ident("thief-inbox");
    const session = await store.startSession({ identity: host, gameId: "sky-stack", gameVersion: "1.0.0", device: "desktop" });
    const score = await store.submitScore({
      identity: host,
      session,
      gameId: "sky-stack",
      mode: "climb",
      score: 400,
      durationMs: 8000,
      metadata: {},
      verified: "verified",
    });
    const created = await store.createChallengeFromRun(host, score.score.id);
    if ("error" in created) throw new Error(created.error);
    const guestSession = await store.startSession({ identity: guest, gameId: "sky-stack", gameVersion: "1.0.0", device: "desktop" });
    const guestScore = await store.submitScore({
      identity: guest,
      session: guestSession,
      gameId: "sky-stack",
      mode: "climb",
      score: 800,
      durationMs: 8000,
      metadata: {},
      verified: "verified",
    });
    await store.attemptChallengeFromRun(guest, created.challenge.publicCode, guestScore.score.id);
    const items = await store.listInbox(host);
    expect(items.length).toBeGreaterThan(0);
    expect(await markInboxRead(thief, items[0].id)).toBeNull();
    expect((await listInbox(host))[0].read).toBe(false);
    expect((await listInbox(thief)).length).toBe(0);
  });
});
