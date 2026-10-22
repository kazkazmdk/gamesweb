import { expect, test, type APIRequestContext } from "@playwright/test";

const origin = "http://127.0.0.1:3010";

async function verifiedRun(request: APIRequestContext, gameId: string, mode: string, score: number) {
  const sessionRes = await request.post("/api/session", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: { gameId, gameVersion: "1.0.0" },
  });
  expect(sessionRes.ok(), await sessionRes.text()).toBeTruthy();
  const session = (await sessionRes.json()) as { sessionId: string };
  const durationMs = 8000;
  const scoreRes = await request.post("/api/score", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: {
      sessionId: session.sessionId,
      gameId,
      gameVersion: "1.0.0",
      mode,
      score,
      durationMs,
      startedAt: Date.now() - durationMs,
      endedAt: Date.now(),
      metadata: gameId === "neon-drift" ? { laps: 1, combo: 2, wallHits: 0 } : { floors: 4 },
    },
  });
  expect(scoreRes.ok(), await scoreRes.text()).toBeTruthy();
  const body = (await scoreRes.json()) as { scoreId?: string };
  expect(body.scoreId).toBeTruthy();
  return body.scoreId!;
}

test("two browser contexts complete a party round without advancing on the first score", async ({ browser }) => {
  const host = await browser.newContext();
  const guest = await browser.newContext();
  const pageA = await host.newPage();
  const pageB = await guest.newPage();

  await pageA.goto("/party");
  await expect(pageA.getByTestId("party-create")).toBeVisible();
  await pageA.getByRole("button", { name: "Create party" }).click();
  await expect(pageA.getByTestId("party")).toBeVisible({ timeout: 15_000 });
  const code = (await pageA.getByTestId("party-code").textContent())?.trim();
  expect(code).toMatch(/^[A-Z0-9]{5,}$/);

  await pageB.goto(`/party/${code}`);
  await expect(pageB.getByTestId("party")).toBeVisible({ timeout: 15_000 });
  await expect(pageB.getByTestId("party-code")).toHaveText(code!);
  await expect(pageA.getByText(/host/i).first()).toBeVisible();
  await expect(pageB.getByText(/Joined|Ready/).first()).toBeVisible();

  await pageB.getByRole("button", { name: "Ready" }).click();
  await expect(pageA.getByText("Ready").nth(1)).toBeVisible({ timeout: 8_000 });

  await pageA.getByTestId("party-start").click();
  await expect(pageA.getByTestId("party-state")).toContainText("playing");
  await expect(pageB.getByTestId("party-state")).toContainText("playing", { timeout: 8_000 });
  const stateA = await pageA.getByTestId("party-state").textContent();
  const stateB = await pageB.getByTestId("party-state").textContent();
  expect(stateA).toBe(stateB);

  const hostRun = await verifiedRun(pageA.request, "sky-stack", "climb", 900);
  const afterHost = await pageA.request.post("/api/parties", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: { action: "submit-round", code, runId: hostRun },
  });
  expect(afterHost.ok(), await afterHost.text()).toBeTruthy();
  const hostParty = (await afterHost.json()) as { party: { state: string; round: number } };
  expect(hostParty.party.state).toBe("playing");
  expect(hostParty.party.round).toBe(0);

  const guestRun = await verifiedRun(pageB.request, "sky-stack", "climb", 1400);
  const afterGuest = await pageB.request.post("/api/parties", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: { action: "submit-round", code, runId: guestRun },
  });
  expect(afterGuest.ok(), await afterGuest.text()).toBeTruthy();
  const guestParty = (await afterGuest.json()) as { party: { state: string; standings: Array<{ name: string; points: number }> } };
  expect(guestParty.party.state).toBe("results");
  expect(guestParty.party.standings.length).toBe(2);

  await pageA.reload();
  await pageB.reload();
  await expect(pageA.getByTestId("party-standings")).toBeVisible();
  await expect(pageB.getByTestId("party-standings")).toBeVisible();
  await expect(pageA.getByTestId("party-start")).toHaveCount(0);
  await pageA.getByTestId("party-advance").click();
  await expect(pageA.getByTestId("party-state")).toContainText("playing");

  await pageB.reload();
  await expect(pageB.getByTestId("party")).toBeVisible();
  await expect(pageB.getByTestId("party-code")).toHaveText(code!);
  await expect(pageB.getByTestId("party-state")).toContainText(/playing|done|results/);

  await guest.close();
  await host.close();
});

test("challenge created from a run opens without payload and persists inbox", async ({ browser }) => {
  const a = await browser.newContext();
  const b = await browser.newContext();
  const pageA = await a.newPage();
  const pageB = await b.newPage();
  await pageA.goto("/");
  await pageB.goto("/");

  const runA = await verifiedRun(pageA.request, "sky-stack", "climb", 2400);
  const created = await pageA.request.post("/api/challenges", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: { action: "create", runId: runA, challengeType: "beat-score" },
  });
  expect(created.ok(), await created.text()).toBeTruthy();
  const body = (await created.json()) as { challenge: { publicCode: string; trust: string }; url: string };
  expect(body.url).toBe(`/c/${body.challenge.publicCode}`);
  expect(body.challenge.trust).not.toBeUndefined();
  const code = body.challenge.publicCode;

  const forged = await pageA.request.post("/api/challenges", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: { action: "create", score: 99999, trust: "verified", gameId: "sky-stack" },
  });
  expect(forged.status()).toBe(403);

  await pageB.goto(`/c/${code}`);
  await expect(pageB.getByTestId("challenge-magic")).toBeVisible({ timeout: 15_000 });
  await expect(pageB.getByText(/challenged you/)).toBeVisible();
  expect(pageB.url()).not.toContain("?p=");

  const fake = await pageB.request.post("/api/challenges", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: { action: "attempt", code, runId: "00000000-0000-4000-8000-000000000000" },
  });
  expect(fake.ok()).toBeFalsy();

  const runB = await verifiedRun(pageB.request, "sky-stack", "climb", 4000);
  const attempt = await pageB.request.post("/api/challenges", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: { action: "attempt", code, runId: runB },
  });
  expect(attempt.ok(), await attempt.text()).toBeTruthy();

  const inbox = await pageA.request.get("/api/inbox");
  expect(inbox.ok()).toBeTruthy();
  const items = (await inbox.json()) as { items: Array<{ title: string; read: boolean; id: string }> };
  expect(items.items.length).toBeGreaterThan(0);
  await pageA.reload();
  const inbox2 = await pageA.request.get("/api/inbox");
  expect(((await inbox2.json()) as { items: Array<{ id: string }> }).items.length).toBeGreaterThan(0);
  const mark = await pageA.request.post("/api/inbox", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: { id: items.items[0].id },
  });
  expect(mark.ok()).toBeTruthy();
  await pageA.reload();
  const inbox3 = (await (await pageA.request.get("/api/inbox")).json()) as { items: Array<{ id: string; read: boolean }> };
  expect(inbox3.items.find((i) => i.id === items.items[0].id)?.read).toBe(true);

  await b.close();
  await a.close();
});

test("a finished challenge stays closed for a third player", async ({ browser }) => {
  const a = await browser.newContext();
  const b = await browser.newContext();
  const c = await browser.newContext();
  const pageA = await a.newPage();
  const pageB = await b.newPage();
  const pageC = await c.newPage();
  await pageA.goto("/");
  await pageB.goto("/");
  await pageC.goto("/");

  const runA = await verifiedRun(pageA.request, "sky-stack", "climb", 1500);
  const created = await pageA.request.post("/api/challenges", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: { action: "create", runId: runA },
  });
  expect(created.ok(), await created.text()).toBeTruthy();
  const code = ((await created.json()) as { challenge: { publicCode: string } }).challenge.publicCode;
  const runB = await verifiedRun(pageB.request, "sky-stack", "climb", 2600);
  const attempt = await pageB.request.post("/api/challenges", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: { action: "attempt", code, runId: runB },
  });
  expect(attempt.ok(), await attempt.text()).toBeTruthy();
  const finished = (await attempt.json()) as { challenge: { winnerId: string | null; targetId: string | null; targetScore: number | null; attempts: unknown[] } };

  await pageC.goto(`/c/${code}`);
  await expect(pageC.getByTestId("challenge-closed")).toBeVisible({ timeout: 15_000 });
  await expect(pageC.getByRole("link", { name: /Beat / })).toHaveCount(0);

  const runC = await verifiedRun(pageC.request, "sky-stack", "climb", 4000);
  const rejected = await pageC.request.post("/api/challenges", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: { action: "attempt", code, runId: runC },
  });
  expect(rejected.status()).toBe(409);
  expect(((await rejected.json()) as { error: { message: string } }).error.message).toBe("challenge_closed");

  const stored = await pageC.request.get(`/api/challenges?code=${code}`);
  expect(stored.ok()).toBeTruthy();
  const again = (await stored.json()) as { challenge: { winnerId: string | null; targetId: string | null; targetScore: number | null; attempts: unknown[] } };
  expect(again.challenge.winnerId).toBe(finished.challenge.winnerId);
  expect(again.challenge.targetId).toBe(finished.challenge.targetId);
  expect(again.challenge.targetScore).toBe(finished.challenge.targetScore);
  expect(again.challenge.attempts).toHaveLength(finished.challenge.attempts.length);

  await c.close();
  await b.close();
  await a.close();
});

test("a host cannot take their own server challenge", async ({ request }) => {
  const runA = await verifiedRun(request, "sky-stack", "climb", 1100);
  const created = await request.post("/api/challenges", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: { action: "create", runId: runA },
  });
  expect(created.ok(), await created.text()).toBeTruthy();
  const code = ((await created.json()) as { challenge: { publicCode: string; status: string } }).challenge.publicCode;
  const other = await verifiedRun(request, "sky-stack", "climb", 1800);
  const self = await request.post("/api/challenges", {
    headers: { Origin: origin, "Content-Type": "application/json" },
    data: { action: "attempt", code, runId: other },
  });
  expect(self.status()).toBe(403);
  expect(((await self.json()) as { error: { message: string } }).error.message).toBe("self_challenge");
  const stored = await request.get(`/api/challenges?code=${code}`);
  expect(((await stored.json()) as { challenge: { status: string; attempts: unknown[] } }).challenge.status).toBe("open");
});
