import { expect, test } from "@playwright/test";

test("two browser contexts share a party roster", async ({ browser }) => {
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

  await guest.close();
  await host.close();
});

test("challenge created in one session opens in another without payload", async ({ browser }) => {
  const a = await browser.newContext();
  const b = await browser.newContext();
  const pageA = await a.newPage();
  const pageB = await b.newPage();

  const created = await pageA.request.post("/api/challenges", {
    data: {
      action: "create",
      gameId: "sky-stack",
      mode: "climb",
      seed: "e2e-social",
      type: "beat-score",
      challengerName: "Host",
      score: 2400,
    },
  });
  expect(created.ok()).toBeTruthy();
  const body = (await created.json()) as { challenge: { publicCode: string } };
  const code = body.challenge.publicCode;

  await pageB.goto(`/c/${code}`);
  await expect(pageB.getByTestId("challenge-magic")).toBeVisible({ timeout: 15_000 });
  await expect(pageB.getByText("Host challenged you")).toBeVisible();

  const attempt = await pageB.request.post("/api/challenges", {
    data: { action: "attempt", code, score: 4000, playerName: "Guest" },
  });
  expect(attempt.ok()).toBeTruthy();

  const inbox = await pageA.request.get("/api/inbox");
  expect(inbox.ok()).toBeTruthy();
  const items = (await inbox.json()) as { items: Array<{ title: string; read: boolean; id: string }> };
  expect(items.items.length).toBeGreaterThan(0);
  const mark = await pageA.request.post("/api/inbox", { data: { id: items.items[0].id } });
  expect(mark.ok()).toBeTruthy();

  await b.close();
  await a.close();
});
