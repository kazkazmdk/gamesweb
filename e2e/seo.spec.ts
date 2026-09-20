import { expect, test } from "@playwright/test";

test("games catalog is indexable and crawlable", async ({ page }) => {
  await page.goto("/games");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Games");
  await expect(page.getByRole("link", { name: "Neon Drift" }).first()).toBeVisible();
  const robots = await page.locator('meta[name="robots"]').getAttribute("content");
  expect(robots ?? "").not.toMatch(/noindex/i);
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(canonical ?? "").toMatch(/\/games$/);
});

test("game hub uses truthful genre title and visible editorial", async ({ page }) => {
  await page.goto("/games/sky-stack");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sky Stack");
  await expect(page.getByText(/stacking|overlap|fever/i).first()).toBeVisible();
  await expect(page.locator("details")).toHaveCount(0);
  const title = await page.title();
  expect(title).not.toMatch(/Survival/i);
  expect(title).toMatch(/stacking arcade/i);
});

test("play routes are noindex follow with hub canonical", async ({ page }) => {
  const res = await page.goto("/play/neon-drift");
  expect(res?.ok()).toBeTruthy();
  const robots = await page.locator('meta[name="robots"]').getAttribute("content");
  expect(robots ?? "").toMatch(/noindex/i);
  expect(robots ?? "").toMatch(/follow/i);
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(canonical ?? "").toMatch(/\/games\/neon-drift/);
});

test("sitemap lists only public indexable URLs", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.ok()).toBeTruthy();
  const xml = await res.text();
  expect(xml).toContain("/games</loc>");
  expect(xml).toContain("/games/neon-drift</loc>");
  expect(xml).toContain("/games/neon-drift/how-to-play");
  expect(xml).toContain("/games/neon-drift/tracks/foundation");
  expect(xml).not.toContain("/play/");
  expect(xml).not.toContain("/settings");
  expect(xml).not.toContain("/me</loc>");
  expect(xml).not.toContain("/friends");
  expect(xml).not.toContain("/inbox");
  expect(xml).not.toContain("/arcade");
  expect(xml).toContain("127.0.0.1:3010");
  expect(xml).not.toMatch(/\/play\//);
});

test("home exposes crawlable catalog links", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('a[href="/games"]').first()).toHaveCount(1);
  await expect(page.locator('a[href="/games/neon-drift"]').first()).toHaveCount(1);
});
