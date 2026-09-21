import { expect, test } from "@playwright/test";

const INDEXABLE = [
  "/",
  "/games",
  "/guides",
  "/collections",
  "/collections/quick-games",
  "/games/neon-drift",
  "/games/neon-drift/guide",
  "/games/neon-drift/controls",
  "/games/neon-drift/strategy",
  "/games/neon-drift/achievements",
  "/games/neon-drift/tracks",
  "/games/neon-drift/scoring",
  "/games/velocity-run/courses",
  "/games/sky-stack/how-to-play",
  "/about",
];

const NOINDEX = ["/play/neon-drift", "/arcade", "/friends", "/inbox", "/daily", "/party", "/crew", "/me", "/settings"];

async function robotsContent(page: import("@playwright/test").Page) {
  return (await page.locator('meta[name="robots"]').getAttribute("content")) ?? "";
}

test("indexable public surfaces render crawlable metadata", async ({ page }) => {
  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();
  const canonicals = new Map<string, string>();

  for (const path of INDEXABLE) {
    const res = await page.goto(path);
    expect(res?.ok(), path).toBeTruthy();
    const title = await page.title();
    const description = (await page.locator('meta[name="description"]').getAttribute("content")) ?? "";
    const canonical = (await page.locator('link[rel="canonical"]').getAttribute("href")) ?? "";
    const robots = await robotsContent(page);
    const h1 = page.locator("h1").first();
    await expect(h1, path).toBeVisible();
    expect(title.length, path).toBeGreaterThan(8);
    expect(description.length, path).toBeGreaterThan(40);
    expect(canonical, path).toContain(path === "/" ? "" : path);
    expect(robots, path).not.toMatch(/noindex/i);
    const localRun = /localhost|127\.0\.0\.1/.test(page.url());
    if (!localRun) expect(canonical, path).not.toMatch(/localhost/);
    const prevTitle = titles.get(title);
    expect(prevTitle, `dup title ${title} (${path} vs ${prevTitle})`).toBeUndefined();
    titles.set(title, path);
    const prevDesc = descriptions.get(description);
    expect(prevDesc, `dup description ${path} vs ${prevDesc}`).toBeUndefined();
    descriptions.set(description, path);
    const prevCanon = canonicals.get(canonical);
    expect(prevCanon, `dup canonical ${canonical}`).toBeUndefined();
    canonicals.set(canonical, path);
    const html = await page.content();
    expect(html).toMatch(/<h1/i);
    expect(html).toMatch(/<a [^>]*href=/i);
  }
});

test("utility routes stay noindex and play canonicalizes to the hub", async ({ page }) => {
  for (const path of NOINDEX) {
    await page.goto(path);
    expect(await robotsContent(page), path).toMatch(/noindex/i);
  }
  await page.goto("/play/neon-drift");
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(canonical ?? "").toMatch(/\/games\/neon-drift\/?$/);
  const robots = await robotsContent(page);
  expect(robots).toMatch(/noindex/i);
  expect(robots).toMatch(/follow/i);
});

test("sitemap lists only indexable URLs and omits arcade/play", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.ok()).toBeTruthy();
  const xml = await res.text();
  const localRun = /localhost|127\.0\.0\.1/.test(res.url());
  if (!localRun) expect(xml).not.toMatch(/localhost/);
  expect(xml).toMatch(/\/games<\/loc>/);
  expect(xml).toContain("/games/neon-drift/guide");
  expect(xml).toContain("/collections/quick-games");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  expect(locs).not.toContain("/arcade");
  expect(locs.some((p) => p.startsWith("/play"))).toBe(false);
  expect(locs).not.toContain("/friends");
  const urls = xml.match(/<loc>([^<]+)<\/loc>/g) ?? [];
  expect(urls.length).toBeGreaterThanOrEqual(50);
  expect(urls.length).toBeLessThanOrEqual(70);
});

test("robots.txt points at the sitemap and does not blanket-disallow", async ({ request }) => {
  const res = await request.get("/robots.txt");
  const body = await res.text();
  expect(body).toMatch(/Allow:\s*\//);
  expect(body).toMatch(/Sitemap:/);
  expect(body).toMatch(/sitemap\.xml/);
  expect(body).not.toMatch(/Disallow:\s*\/$/);
});

test("JSON-LD on hubs and collections stays truthful", async ({ page }) => {
  await page.goto("/games/neon-drift");
  const hubLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  const hubJoined = hubLd.join("\n");
  expect(hubJoined).toContain("VideoGame");
  expect(hubJoined).toContain("WebApplication");
  expect(hubJoined).toContain("BreadcrumbList");
  expect(hubJoined).not.toMatch(/AggregateRating|reviewCount|FAQPage|VideoObject/);
  await page.goto("/collections/quick-games");
  const colLd = (await page.locator('script[type="application/ld+json"]').allTextContents()).join("\n");
  expect(colLd).toContain("ItemList");
  expect(colLd).toContain("BreadcrumbList");
  expect(colLd).not.toMatch(/AggregateRating|FAQPage/);
});

test("internal links on catalog and guides are crawlable", async ({ page }) => {
  await page.goto("/games");
  await expect(page.getByRole("heading", { name: "Browser games" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Neon Drift" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "quick browser games" })).toBeVisible();
  await page.goto("/guides");
  await expect(page.getByRole("link", { name: "Neon Drift" })).toBeVisible();
  await page.getByRole("link", { name: "Neon Drift" }).first().click();
  await expect(page).toHaveURL(/\/games\/neon-drift\/guide/);
  await expect(page.getByRole("link", { name: /Play Neon Drift/i })).toBeVisible();
});

test("mobile catalog still shows a real H1", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games");
  await expect(page.getByRole("heading", { level: 1, name: "Browser games" })).toBeVisible();
  await page.goto("/games/crowd-control/controls");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
