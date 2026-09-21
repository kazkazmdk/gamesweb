import { expect, test } from "@playwright/test";

const origin = "http://127.0.0.1:3010";

async function run(request: import("@playwright/test").APIRequestContext, gameId: string, mode: string, score: number) {
  const session = await request.post("/api/session", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: { gameId, gameVersion: "1.0.0" },
  });
  const body = (await session.json()) as { sessionId: string };
  const durationMs = 8000;
  const scoreRes = await request.post("/api/score", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: {
      sessionId: body.sessionId,
      gameId,
      gameVersion: "1.0.0",
      mode,
      score,
      durationMs,
      startedAt: Date.now() - durationMs,
      endedAt: Date.now(),
      metadata: gameId === "neon-drift" ? { laps: 1, combo: 1, wallHits: 0 } : { floors: 3 },
    },
  });
  return ((await scoreRes.json()) as { scoreId?: string }).scoreId ?? "";
}

test("browser cannot declare verified trust or steal another run", async ({ browser }) => {
  const a = await browser.newContext();
  const b = await browser.newContext();
  const pageA = await a.newPage();
  const pageB = await b.newPage();
  await pageA.goto("/");
  await pageB.goto("/");

  const runA = await run(pageA.request, "sky-stack", "climb", 1100);
  const stolen = await pageB.request.post("/api/challenges", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: { action: "create", runId: runA },
  });
  expect(stolen.status()).toBe(403);

  const spoof = await pageA.request.post("/api/challenges", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: { action: "create", score: 99999, trust: "verified", gameId: "sky-stack" },
  });
  expect(spoof.status()).toBe(403);

  const rows = await pageA.request.post("/api/parties", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: { action: "score", code: "AAAAA", gameId: "sky-stack", rows: [{ id: "x", name: "X", score: 1 }] },
  });
  expect(rows.status()).toBe(403);

  await b.close();
  await a.close();
});
