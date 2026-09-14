import { test, expect } from "@playwright/test";

test("home to neon drift boots a canvas", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading").first()).toBeVisible();
  await page.goto("/play/neon-drift");
  await expect(page.locator("canvas")).toBeVisible({ timeout: 20_000 });
});

test("velocity run boots", async ({ page }) => {
  await page.goto("/play/velocity-run");
  await expect(page.locator("canvas")).toBeVisible({ timeout: 20_000 });
});

test("swarm protocol boots", async ({ page }) => {
  await page.goto("/play/swarm-protocol");
  await expect(page.locator("canvas")).toBeVisible({ timeout: 20_000 });
});

test("guest progression persists after refresh", async ({ page }) => {
  await page.goto("/settings");
  await page.getByLabel("Display name").fill("QA Player");
  await page.reload();
  await expect(page.getByLabel("Display name")).toHaveValue("QA Player");
});

test("play routes are noindex and game hub has unique canonical", async ({ page }) => {
  await page.goto("/play/neon-drift");
  const playRobots = await page.locator('meta[name="robots"]').getAttribute("content");
  expect(playRobots ?? "").toMatch(/noindex/i);

  await page.goto("/games/neon-drift");
  await expect(page).toHaveTitle(/Neon Drift/i);
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(canonical ?? "").toMatch(/\/games\/neon-drift\/?$/);
  const robots = await page.locator('meta[name="robots"]').getAttribute("content");
  expect(robots ?? "index").not.toMatch(/noindex/i);
});

test("private surfaces are noindex", async ({ page }) => {
  for (const path of ["/auth", "/me", "/settings", "/friends"]) {
    await page.goto(path);
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots ?? "", path).toMatch(/noindex/i);
  }
});

test("invalid score is rejected", async ({ request }) => {
  const res = await request.post("/api/score", {
    data: { gameId: "neon-drift", score: -1 },
  });
  expect(res.status()).toBe(400);
  const body = await res.json();
  expect(body.error.code).toBeTruthy();
});

test("leaderboard API returns the expected schema", async ({ request }) => {
  const res = await request.get("/api/leaderboard?game=neon-drift&mode=circuit");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.gameId).toBe("neon-drift");
  expect(Array.isArray(body.rows)).toBeTruthy();
});
