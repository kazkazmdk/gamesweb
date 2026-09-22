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

test("crowd control boots", async ({ page }) => {
  await page.goto("/play/crowd-control");
  await expect(page.locator("canvas")).toBeVisible({ timeout: 20_000 });
});

test("sky stack boots", async ({ page }) => {
  await page.goto("/play/sky-stack");
  await expect(page.locator("canvas")).toBeVisible({ timeout: 20_000 });
});

test("knockout circuit boots", async ({ page }) => {
  await page.goto("/play/knockout-circuit");
  await expect(page.locator("canvas")).toBeVisible({ timeout: 20_000 });
});

test("pocket striker boots", async ({ page }) => {
  await page.goto("/play/pocket-striker");
  await expect(page.locator("canvas")).toBeVisible({ timeout: 20_000 });
});

test("territory rush boots", async ({ page }) => {
  await page.goto("/play/territory-rush");
  await expect(page.locator("canvas")).toBeVisible({ timeout: 20_000 });
});

test("guest magic challenge page renders without signup", async ({ page }) => {
  await page.goto("/c/7FQ2K?p=e30");
  await expect(page.getByRole("heading", { name: /challenge not found|challenged you/i })).toBeVisible();
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

test("daily arcade and party pages render", async ({ page }) => {
  await page.goto("/daily");
  await expect(page.getByTestId("daily-arcade")).toBeVisible();
  await page.goto("/party");
  await expect(page.getByTestId("party-create")).toBeVisible();
  await page.goto("/inbox");
  await expect(page.getByTestId("inbox")).toBeVisible();
  await page.goto("/grand-prix");
  await expect(page.getByTestId("grand-prix")).toBeVisible();
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
  expect("personalRank" in body).toBe(false);
});
