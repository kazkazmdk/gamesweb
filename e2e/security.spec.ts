import { test, expect } from "@playwright/test";

const origin = "http://127.0.0.1:3010";

test("leaderboard API is public and has no personalRank", async ({ request }) => {
  const res = await request.get("/api/leaderboard?game=neon-drift&mode=circuit");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.gameId).toBe("neon-drift");
  expect(Array.isArray(body.rows)).toBeTruthy();
  expect("personalRank" in body).toBe(false);
  const cache = res.headers()["cache-control"] ?? "";
  expect(cache).toMatch(/s-maxage/i);
});

test("cross-origin POST is blocked", async ({ request }) => {
  const res = await request.post("/api/score", {
    headers: { Origin: "https://evil.example", "Content-Type": "application/json" },
    data: { gameId: "neon-drift", score: 1 },
  });
  expect(res.status()).toBe(403);
  const body = await res.json();
  expect(body.error.code).toBe("ORIGIN_DENIED");
});

test("guest A cannot submit guest B session", async ({ browser }) => {
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  await ctxA.addCookies([{ name: "gw_guest", value: "11111111-aaaa-4aaa-8aaa-aaaaaaaaaaa1", url: origin }]);
  await ctxB.addCookies([{ name: "gw_guest", value: "22222222-bbbb-4bbb-8bbb-bbbbbbbbbbb2", url: origin }]);

  const sessionRes = await ctxA.request.post("/api/session", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: { gameId: "neon-drift", gameVersion: "1.0.0" },
  });
  expect(sessionRes.ok()).toBeTruthy();
  const session = await sessionRes.json();

  const steal = await ctxB.request.post("/api/score", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: {
      sessionId: session.sessionId,
      gameId: "neon-drift",
      gameVersion: "1.0.0",
      mode: "circuit",
      score: 12000,
      durationMs: 40000,
      startedAt: Date.now() - 40000,
      endedAt: Date.now(),
      metadata: { laps: 1, combo: 1, wallHits: 0 },
    },
  });
  expect(steal.status()).toBe(403);
  const body = await steal.json();
  expect(body.error.code).toBe("FORBIDDEN");
  await ctxA.close();
  await ctxB.close();
});

test("duplicate score submit is idempotent", async ({ browser }) => {
  const ctx = await browser.newContext();
  await ctx.addCookies([{ name: "gw_guest", value: "33333333-cccc-4ccc-8ccc-ccccccccccc3", url: origin }]);
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
    score: 15000,
    durationMs: 40000,
    startedAt: Date.now() - 40000,
    endedAt: Date.now(),
    metadata: { laps: 1, combo: 2, wallHits: 0 },
    idempotencyKey: `score:${session.sessionId}`,
  };
  const first = await ctx.request.post("/api/score", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: payload,
  });
  const second = await ctx.request.post("/api/score", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: payload,
  });
  expect(first.ok()).toBeTruthy();
  expect(second.ok()).toBeTruthy();
  const a = await first.json();
  const b = await second.json();
  expect(b.alreadyApplied).toBe(true);
  expect(b.scoreId).toBe(a.scoreId);
  await ctx.close();
});

test("merge rejects client-chosen anonymousId", async ({ request }) => {
  const res = await request.post("/api/player/merge", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: { anonymousId: "stolen-guest", snapshot: { xp: 9999, achievements: ["neon-drift:score-60k"] } },
  });
  expect([401, 403]).toContain(res.status());
});

test("cross-site fetch metadata is blocked", async ({ request }) => {
  const res = await request.post("/api/player/auth", {
    headers: {
      Origin: "https://evil.example",
      "Sec-Fetch-Site": "cross-site",
      "Content-Type": "application/json",
    },
    data: { email: "ada@example.com" },
  });
  expect(res.status()).toBe(403);
  expect(((await res.json()) as { error: { code: string } }).error.code).toBe("ORIGIN_DENIED");
});

test("invalid magic-link email is rejected", async ({ request }) => {
  const res = await request.post("/api/player/auth", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: { email: "not-an-email" },
  });
  expect(res.status()).toBe(400);
});

test("callback next is path-safe", async ({ request }) => {
  const evil = await request.get("/auth/callback?next=https://evil.example", { maxRedirects: 0 });
  expect(evil.status()).toBeLessThan(400);
  const proto = await request.get("/auth/callback?next=//evil.example", { maxRedirects: 0 });
  expect(proto.status()).toBeLessThan(400);
});

test("logout is idempotent without a session", async ({ request }) => {
  const first = await request.post("/api/player/logout", { headers: { Origin: origin } });
  const second = await request.post("/api/player/logout", { headers: { Origin: origin } });
  expect(first.ok()).toBeTruthy();
  expect(second.ok()).toBeTruthy();
});

test("account delete requires authentication", async ({ request }) => {
  const res = await request.delete("/api/player/me", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: { confirm: "DELETE" },
  });
  expect(res.status()).toBe(401);
});

test("health does not leak env details", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.ok).toBe(true);
  expect(body.commit).toBeTruthy();
  expect(body).not.toHaveProperty("turnstile");
  expect(body).not.toHaveProperty("seed");
  expect(JSON.stringify(body)).not.toMatch(/service_role|secret|eyJ|Bearer /i);
});
