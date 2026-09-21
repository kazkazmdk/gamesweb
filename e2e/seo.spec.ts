import { test, expect } from "@playwright/test";

test("play is noindex follow with hub canonical", async ({ page }) => {
  await page.goto("/play/neon-drift");
  const robots = await page.locator('meta[name="robots"]').getAttribute("content");
  expect(robots ?? "").toMatch(/noindex/i);
  expect(robots ?? "").toMatch(/follow/i);
  const canon = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(canon ?? "").toContain("/games/neon-drift");
});

test("sitemap lists only public indexables", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.ok()).toBeTruthy();
  const xml = await res.text();
  expect(xml).toContain("/games</loc>");
  expect(xml).toContain("/guides/neon-drift/how-to-play");
  expect(xml).toContain("/collections/quick-games");
  expect(xml).not.toMatch(/<loc>[^<]*\/play\//);
  expect(xml.includes("/arcade</loc>") || xml.includes("/arcade/<")).toBeFalsy();
});

test("catalog and a guide render Gamesweb chrome", async ({ page }) => {
  await page.goto("/games");
  await expect(page.getByRole("heading", { name: "The eight games" })).toBeVisible();
  await expect(page.getByRole("link", { name: "How to play" }).first()).toBeVisible();
  await page.goto("/guides/neon-drift/how-to-play");
  await expect(page.getByRole("heading", { name: /How to play Neon Drift/ })).toBeVisible();
  await expect(page.getByText("LIVE is the drift")).toBeVisible();
  await expect(page.getByRole("link", { name: /Play Neon Drift/ })).toBeVisible();
});

test("pocket hub title is not Survival", async ({ page }) => {
  await page.goto("/games/pocket-striker");
  const title = await page.title();
  expect(title).toMatch(/Physics Sports/);
  expect(title).not.toMatch(/Survival/);
});
