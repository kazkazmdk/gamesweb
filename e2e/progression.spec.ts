import { test, expect } from "@playwright/test";

const origin = "http://127.0.0.1:3010";

async function verifiedRun(
  request: {
    post: (url: string, opts: { headers: Record<string, string>; data: unknown }) => Promise<{ ok: () => boolean; json: () => Promise<Record<string, unknown>>; status: () => number }>;
  },
  score = 12000,
) {
  const sessionRes = await request.post("/api/session", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: { gameId: "neon-drift", gameVersion: "1.0.0" },
  });
  expect(sessionRes.ok()).toBeTruthy();
  const session = await sessionRes.json();
  const durationMs = 8000;
  const scoreRes = await request.post("/api/score", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: {
      sessionId: session.sessionId,
      gameId: "neon-drift",
      gameVersion: "1.0.0",
      mode: "circuit",
      score,
      durationMs,
      startedAt: Date.now() - durationMs,
      endedAt: Date.now(),
      metadata: { laps: 1, combo: 2, wallHits: 0 },
    },
  });
  expect(scoreRes.ok()).toBeTruthy();
  const body = await scoreRes.json();
  const verification = body.verification as { status?: string };
  expect(verification.status).toBe("verified");
  return body;
}

test("guest XP increases after a verified run and hydrates on /me", async ({ browser }) => {
  const ctx = await browser.newContext();
  await ctx.addCookies([{ name: "gw_guest", value: "aaaaaaaa-1111-4111-8111-aaaaaaaaaaa1", url: origin }]);
  const before = await (await ctx.request.get("/api/player/me")).json();
  const run = await verifiedRun(ctx.request);
  const diff = run.progressionDiff as { xpEarned: number; newXp: number };
  expect(diff.xpEarned).toBeGreaterThan(0);
  expect(diff.newXp).toBe((before.xp as number) + diff.xpEarned);
  const after = await (await ctx.request.get("/api/player/me")).json();
  expect(after.xp).toBe(diff.newXp);
  await ctx.close();
});

test("second guest run continues from previous server XP", async ({ browser }) => {
  const ctx = await browser.newContext();
  await ctx.addCookies([{ name: "gw_guest", value: "bbbbbbbb-2222-4222-8222-bbbbbbbbbbb2", url: origin }]);
  const first = await verifiedRun(ctx.request, 16000);
  const firstDiff = first.progressionDiff as { newXp: number };
  const second = await verifiedRun(ctx.request, 17000);
  const secondDiff = second.progressionDiff as { xpEarned: number; newXp: number };
  expect(secondDiff.newXp).toBe(firstDiff.newXp + secondDiff.xpEarned);
  const me = await (await ctx.request.get("/api/player/me")).json();
  expect(me.xp).toBe(secondDiff.newXp);
  await ctx.close();
});

test("same session twice awards XP once", async ({ browser }) => {
  const ctx = await browser.newContext();
  await ctx.addCookies([{ name: "gw_guest", value: "cccccccc-3333-4333-8333-ccccccccccc3", url: origin }]);
  const sessionRes = await ctx.request.post("/api/session", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: { gameId: "neon-drift", gameVersion: "1.0.0" },
  });
  const session = await sessionRes.json();
  const payload = {
    sessionId: session.sessionId,
    gameId: "neon-drift",
    gameVersion: "1.0.0",
    mode: "circuit",
    score: 15500,
    durationMs: 8000,
    startedAt: Date.now() - 8000,
    endedAt: Date.now(),
    metadata: { laps: 1, combo: 2, wallHits: 0 },
    idempotencyKey: `score:${session.sessionId}`,
  };
  const first = await (await ctx.request.post("/api/score", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: payload,
  })).json();
  const second = await (await ctx.request.post("/api/score", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: payload,
  })).json();
  expect(first.verification.status).toBe("verified");
  expect(first.progressionDiff.xpEarned).toBeGreaterThan(0);
  expect(second.alreadyApplied).toBe(true);
  expect(second.scoreId).toBe(first.scoreId);
  const me = await (await ctx.request.get("/api/player/me")).json();
  expect(me.xp).toBe(first.progressionDiff.newXp);
  await ctx.close();
});

test("offline unverified reward matches subsequent /me", async ({ browser }) => {
  const ctx = await browser.newContext();
  await ctx.addCookies([{ name: "gw_guest", value: "dddddddd-4444-4444-8444-ddddddddddd4", url: origin }]);
  const before = await (await ctx.request.get("/api/player/me")).json();
  const res = await ctx.request.post("/api/score", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: {
      gameId: "neon-drift",
      gameVersion: "1.0.0",
      mode: "circuit",
      score: 18000,
      durationMs: 40000,
      startedAt: Date.now() - 40000,
      endedAt: Date.now(),
      metadata: { laps: 1, combo: 1, wallHits: 0 },
      offline: true,
      offlineSubmission: true,
      localSessionId: "offline-local-1",
    },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.progressionDiff.xpEarned).toBe(0);
  expect(body.progressionDiff.newXp).toBe(before.xp);
  const me = await (await ctx.request.get("/api/player/me")).json();
  expect(me.xp).toBe(body.progressionDiff.newXp);
  await ctx.close();
});

test("unauthenticated player cannot manage blocks", async ({ request }) => {
  const res = await request.post("/api/friends", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: { userId: "11111111-1111-4111-8111-111111111111", action: "remove" },
  });
  expect(res.status()).toBe(401);
});
