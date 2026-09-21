import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
process.env.GAMESWEB_BACKEND = "memory";

import { afterEach, describe, expect, it } from "vitest";
import type { Identity } from "../apps/web/lib/api/identity.ts";
import { MemoryBackend, resetMemoryStore } from "../apps/web/lib/backend/memory.ts";
import {
  attemptChallengeFromRun,
  createChallengeFromRun,
  createParty,
  getChallenge,
  getParty,
  joinParty,
  listInbox,
  markInboxRead,
  resetSocialArcade,
  setPartyReady,
  startParty,
  submitPartyRound,
} from "../apps/web/lib/backend/social-arcade.ts";

function ident(anon: string, userId: string | null = null): Identity {
  return { userId, anonymousId: anon, email: null };
}

async function runFor(backend: MemoryBackend, identity: Identity, gameId: string, score: number) {
  const session = await backend.startSession({
    identity,
    gameId,
    gameVersion: "1.0.0",
    device: "desktop",
  });
  const result = await backend.submitScore({
    identity,
    session,
    gameId,
    mode: gameId === "neon-drift" ? "circuit" : "climb",
    score,
    durationMs: 8000,
    metadata: { laps: 1, combo: 2 },
    verified: "verified",
  });
  return result.score.id;
}

describe("social arcade backend store", () => {
  afterEach(() => {
    resetSocialArcade();
    delete process.env.GAMESWEB_MEMORY_FILE;
  });

  it("lets two identities share a party without advancing on the first score", async () => {
    const backend = resetMemoryStore();
    const host = ident("host-1");
    const guest = ident("guest-1");
    const party = await createParty(host, "Host");
    const joined = await joinParty(guest, party.code, "Guest");
    expect(joined.ok).toBe(true);
    expect((await getParty(party.code))?.members.map((m) => m.name)).toEqual(["Host", "Guest"]);
    await setPartyReady(guest, party.code, true);
    const started = await startParty(host, party.code);
    expect("error" in started).toBe(false);
    if ("error" in started) return;
    expect(started.state).toBe("playing");
    expect(started.round).toBe(0);

    const hostRun = await runFor(backend, host, started.playlist[0].gameId, 1200);
    const afterHost = await submitPartyRound(host, party.code, hostRun);
    expect("error" in afterHost).toBe(false);
    if ("error" in afterHost) return;
    expect(afterHost.state).toBe("playing");
    expect(afterHost.round).toBe(0);

    const guestRun = await runFor(backend, guest, started.playlist[0].gameId, 1800);
    const afterGuest = await submitPartyRound(guest, party.code, guestRun);
    expect("error" in afterGuest).toBe(false);
    if ("error" in afterGuest) return;
    expect(afterGuest.state).toBe("results");
    expect(afterGuest.round).toBe(0);
    expect(afterGuest.standings.length).toBe(2);
  });

  it("creates a challenge from a run and persists inbox + rivals", async () => {
    const backend = resetMemoryStore();
    const host = ident("host-2");
    const guest = ident("guest-2");
    const runId = await runFor(backend, host, "sky-stack", 1200);
    const created = await createChallengeFromRun(host, runId);
    expect("error" in created).toBe(false);
    if ("error" in created) return;
    expect(created.challenge.trust).toBe("verified");
    expect(created.url).toBe(`/c/${created.challenge.publicCode}`);

    const guestRun = await runFor(backend, guest, "sky-stack", 1800);
    const result = await attemptChallengeFromRun(guest, created.challenge.publicCode, guestRun);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.outcome).toBe("win");

    const hostInbox = await listInbox(host);
    const guestInbox = await listInbox(guest);
    expect(hostInbox.length).toBeGreaterThan(0);
    expect(guestInbox.length).toBeGreaterThan(0);
    const marked = await markInboxRead(host, hostInbox[0].id);
    expect(marked?.read).toBe(true);
    expect((await listInbox(host))[0].read).toBe(true);
    expect((await backend.listRivals(host)).some((r) => r.otherId.includes("guest-2"))).toBe(true);
  });

  it("survives a process restart via the memory snapshot file", async () => {
    const dir = mkdtempSync(join(tmpdir(), "gw-social-"));
    const file = join(dir, "memory.json");
    process.env.GAMESWEB_MEMORY_FILE = file;
    const first = resetMemoryStore();
    const host = ident("persist-host");
    const created = await first.createParty(host, "Host");
    const restarted = new MemoryBackend();
    restarted.hydrateFromFile(file);
    const party = await restarted.getParty(created.code);
    expect(party?.code).toBe(created.code);
    expect(party?.members).toHaveLength(1);
    rmSync(dir, { recursive: true, force: true });
  });

  it("does not invent a crew", async () => {
    resetSocialArcade();
    expect(await getParty("NOPE")).toBeNull();
    expect(await getChallenge("NOPE")).toBeNull();
    expect(await listInbox(ident("nobody"))).toEqual([]);
  });
});
