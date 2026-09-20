import { test, expect } from "@playwright/test";

const INDEXABLE = [
  "/",
  "/games",
  "/games/neon-drift",
  "/collections",
  "/collections/quick-games",
  "/guides",
  "/guides/neon-drift",
  "/guides/neon-drift/how-to-drift",
  "/learn",
  "/learn/drift-games",
  "/about",
];

const NOINDEX = ["/arcade", "/play/neon-drift", "/friends", "/daily", "/leaderboards", "/grand-prix", "/challenges"];

test("indexable SEO routes return 200 with unique canonicals", async ({ page }) => {
  const titles = new Set<string>();
  const canonicals = new Set<string>();
  for (const path of INDEXABLE) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    const title = await page.title();
    expect(title.length, path).toBeGreaterThan(8);
    expect(titles.has(title), `dup title ${title}`).toBe(false);
    titles.add(title);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical ?? "", path).toMatch(new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/?$`));
    expect(canonicals.has(canonical ?? ""), path).toBe(false);
    canonicals.add(canonical ?? "");
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots ?? "index", path).not.toMatch(/noindex/i);
    if (!/localhost|127\.0\.0\.1/.test(page.url())) {
      expect(canonical ?? "").not.toMatch(/localhost/);
    }
  }
});

test("application surfaces stay noindex and off the sitemap", async ({ page, request }) => {
  for (const path of NOINDEX) {
    await page.goto(path);
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots ?? "", path).toMatch(/noindex/i);
  }
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  const xml = await sitemap.text();
  expect(xml).toContain("/games</loc>");
  expect(xml).toContain("/guides/neon-drift/how-to-drift");
  expect(xml).not.toContain("/arcade</loc>");
  expect(xml).not.toContain("/play/");
  if (!/localhost|127\.0\.0\.1/.test(new URL(sitemap.url()).origin)) {
    expect(xml).not.toMatch(/localhost/);
  }
});

test("SEO pages do not boot Phaser", async ({ page }) => {
  const hits: string[] = [];
  page.on("request", (req) => {
    const url = req.url();
    if (/phaser/i.test(url)) hits.push(url);
  });
  await page.goto("/guides/neon-drift/how-to-drift");
  await expect(page.getByRole("heading", { name: "How to drift" })).toBeVisible();
  await page.goto("/collections/quick-games");
  await expect(page.getByRole("heading", { name: "Quick browser games" })).toBeVisible();
  expect(hits, hits.join("\n")).toEqual([]);
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("internal SEO graph is crawlable HTML", async ({ page }) => {
  await page.goto("/games");
  await expect(page.getByRole("heading", { level: 1, name: "Games" })).toBeVisible();
  await expect(page.locator('a[href="/games/neon-drift"]').first()).toBeVisible();
  await expect(page.locator('a[href="/collections"]').first()).toBeVisible();
  await expect(page.locator('a[href="/guides"]').first()).toBeVisible();
  await page.goto("/guides/neon-drift/live-vs-banked");
  await expect(page.getByText(/gw:neon-tutorial-v2/)).toBeVisible();
  await expect(page.locator('a[href="/games/neon-drift"]')).toBeVisible();
});
