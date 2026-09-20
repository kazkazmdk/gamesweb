import { expect, test, type Page } from "@playwright/test";
import { stabilizeVisual } from "./visual-helpers";
import { mkdirSync } from "node:fs";

const OUT = "docs/qa-games-platform-seo-closeout";

test.skip(!process.env.QA_MATRIX, "Set QA_MATRIX=1 to capture the closeout matrix");

async function save(page: Page, name: string) {
  mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
}

test("platform empty and hub editorial", async ({ page }) => {
  await stabilizeVisual(page, { width: 1440, height: 900 });
  await page.goto("/friends");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await save(page, "friends-empty-1440");
  await page.goto("/leaderboards");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await save(page, "leaderboards-empty-1440");
  await page.goto("/achievements");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await save(page, "achievements-empty-1440");
  await page.goto("/games/neon-drift");
  await expect(page.getByRole("heading", { name: "The game" })).toBeVisible();
  await page.locator("#about-the-game").scrollIntoViewIfNeeded();
  await save(page, "hub-neon-editorial-1440");
});

test("SEO editorial surfaces", async ({ page }) => {
  test.setTimeout(120_000);
  await stabilizeVisual(page, { width: 1440, height: 900 });
  const routes: Array<[string, string]> = [
    ["/games", "seo-games-1440"],
    ["/collections", "seo-collections-1440"],
    ["/collections/quick-games", "seo-collection-quick-1440"],
    ["/collections/score-attack-games", "seo-collection-score-1440"],
    ["/guides", "seo-guides-1440"],
    ["/guides/neon-drift", "seo-guide-hub-neon-1440"],
    ["/guides/crowd-control", "seo-guide-hub-crowd-1440"],
    ["/guides/neon-drift/how-to-drift", "seo-guide-drift-1440"],
    ["/guides/neon-drift/live-vs-banked", "seo-guide-banked-1440"],
    ["/guides/territory-rush/how-territory-works", "seo-guide-territory-1440"],
    ["/guides/crowd-control/gates", "seo-guide-gates-1440"],
    ["/learn", "seo-learn-1440"],
    ["/learn/drift-games", "seo-learn-drift-1440"],
    ["/learn/crowd-runner-games", "seo-learn-crowd-1440"],
    ["/", "home-regression-1440"],
    ["/arcade", "arcade-1440"],
    ["/games/neon-drift", "hub-neon-1440"],
    ["/profile/nobody-here-xyz", "profile-public-1440"],
  ];
  for (const [path, name] of routes) {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.waitForTimeout(200);
    await save(page, name);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [path, name] of [
    ["/games", "seo-games-390"],
    ["/guides/neon-drift/how-to-drift", "seo-guide-drift-390"],
    ["/learn", "seo-learn-390"],
    ["/collections/quick-games", "seo-collection-quick-390"],
  ] as const) {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    await save(page, name);
  }
});
