import { describe, expect, it } from "vitest";
import {
  attemptChallenge,
  createChallenge,
  createParty,
  getChallenge,
  getParty,
  joinParty,
  listInbox,
  markInboxRead,
  resetSocialArcade,
  setPartyReady,
} from "../apps/web/lib/backend/social-arcade.ts";

describe("social arcade process store", () => {
  it("lets two identities share a party and a challenge", () => {
    resetSocialArcade();
    const party = createParty("anon:host", "Host");
    expect(getParty(party.code)?.members).toHaveLength(1);
    const joined = joinParty(party.code, "anon:guest", "Guest");
    expect(joined.ok).toBe(true);
    expect(getParty(party.code)?.members.map((m) => m.name)).toEqual(["Host", "Guest"]);
    const ready = setPartyReady(party.code, "anon:guest", true);
    expect(ready?.members.find((m) => m.id === "anon:guest")?.ready).toBe(true);

    const challenge = createChallenge({
      gameId: "sky-stack",
      mode: "climb",
      seed: "s",
      type: "beat-score",
      challengerId: "anon:host",
      challengerName: "Host",
      score: 1200,
    });
    expect(getChallenge(challenge.publicCode)?.challengerScore).toBe(1200);
    const result = attemptChallenge(challenge.publicCode, {
      id: "att-1",
      playerId: "anon:guest",
      playerName: "Guest",
      score: 1800,
      runId: null,
      trust: "unverified",
      createdAt: Date.now(),
      metadata: {},
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.outcome).toBe("win");
    const hostInbox = listInbox("anon:host");
    const guestInbox = listInbox("anon:guest");
    expect(hostInbox.length).toBeGreaterThan(0);
    expect(guestInbox.length).toBeGreaterThan(0);
    const marked = markInboxRead("anon:host", hostInbox[0].id);
    expect(marked?.read).toBe(true);
    expect(listInbox("anon:host")[0].read).toBe(true);
  });

  it("does not invent a crew", () => {
    resetSocialArcade();
    expect(getParty("NOPE")).toBeNull();
    expect(getChallenge("NOPE")).toBeNull();
    expect(listInbox("anon:nobody")).toEqual([]);
  });
});
