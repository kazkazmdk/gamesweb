import { expect, test, type Page } from "@playwright/test";
import { stabilizeVisual } from "./visual-helpers";
import { mkdirSync } from "node:fs";

const OUT = "docs/qa-platform-visual-closeout";

test.skip(!process.env.QA_MATRIX, "Set QA_MATRIX=1 to capture the closeout matrix");

async function save(page: Page, name: string) {
  mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
}

async function debugOf(page: Page) {
  return page.evaluate(() => (window as unknown as { __GW_DEBUG__?: { ready?: boolean; gameId?: string } }).__GW_DEBUG__ ?? null);
}

async function cmd(page: Page, name: string, ...args: unknown[]) {
  await page.evaluate(
    ([key, params]) => {
      const bag = (window as unknown as { __GW_DEBUG_CMD__?: Record<string, (...a: unknown[]) => void> }).__GW_DEBUG_CMD__;
      bag?.[key]?.(...params);
    },
    [name, args] as const,
  );
}

async function waitGame(page: Page, slug: string) {
  await page.addInitScript(() => {
    (window as Window & { __GW_ALLOW_DEBUG__?: boolean }).__GW_ALLOW_DEBUG__ = true;
  });
  await page.goto(`/play/${slug}`);
  await page.locator("canvas").waitFor({ timeout: 30_000 });
  await expect
    .poll(async () => {
      const d = await debugOf(page);
      return d?.ready ? d.gameId : null;
    }, { timeout: 30_000 })
    .toBeTruthy();
}

test("platform desktop 1440", async ({ page }) => {
  await stabilizeVisual(page, { width: 1440, height: 900, populated: true });
  const routes: Array<[string, string]> = [
    ["/", "home-neon-1440"],
    ["/arcade", "arcade-1440"],
    ["/daily", "daily-1440"],
    ["/grand-prix", "grand-prix-1440"],
    ["/games/neon-drift", "hub-neon-1440"],
    ["/friends", "friends-1440"],
    ["/inbox", "inbox-1440"],
    ["/challenges", "challenges-1440"],
    ["/party", "party-1440"],
    ["/crew", "crew-1440"],
    ["/leaderboards", "leaderboards-1440"],
    ["/me", "profile-self-1440"],
    ["/profile/nobody-here-xyz", "profile-public-1440"],
    ["/achievements", "achievements-1440"],
    ["/settings", "settings-1440"],
  ];
  for (const [path, name] of routes) {
    await page.goto(path);
    await expect(page.locator("h1, .display").first()).toBeVisible();
    if (path === "/crew") await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(/Opening the house/i, { timeout: 4000 });
    await page.waitForTimeout(250);
    await save(page, name);
  }
});

test("platform mobile 390", async ({ page }) => {
  await stabilizeVisual(page, { width: 390, height: 844, populated: true });
  const routes: Array<[string, string]> = [
    ["/", "home-390"],
    ["/arcade", "arcade-390"],
    ["/daily", "daily-390"],
    ["/grand-prix", "grand-prix-390"],
    ["/games/neon-drift", "hub-390"],
    ["/friends", "friends-390"],
    ["/leaderboards", "leaderboards-390"],
    ["/me", "profile-390"],
  ];
  for (const [path, name] of routes) {
    await page.goto(path);
    await expect(page.locator("h1, .display").first()).toBeVisible();
    await save(page, name);
  }
});

test("neon results and pause", async ({ page }) => {
  await stabilizeVisual(page, { width: 1440, height: 900 });
  await waitGame(page, "neon-drift");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await save(page, "neon-pause-1440");
  await page.getByRole("button", { name: "Resume" }).click();
  await cmd(page, "finishRun");
  await expect(page.getByText(/R or Space/i)).toBeVisible({ timeout: 10_000 });
  await save(page, "neon-results-1440");
  await page.setViewportSize({ width: 390, height: 844 });
  await save(page, "neon-results-390");
});

const GAMES = [
  "neon-drift",
  "velocity-run",
  "swarm-protocol",
  "knockout-circuit",
  "pocket-striker",
  "territory-rush",
  "sky-stack",
  "crowd-control",
] as const;

test("eight games visual matrix", async ({ page }) => {
  test.setTimeout(240_000);
  await stabilizeVisual(page, { width: 1440, height: 900 });
  for (const slug of GAMES) {
    await waitGame(page, slug);
    await page.waitForTimeout(350);
    await save(page, `${slug}-open-1440`);
    if (slug === "crowd-control") await cmd(page, "setPack", 28);
    await page.waitForTimeout(800);
    await save(page, `${slug}-mid-1440`);
    if (slug === "crowd-control") await cmd(page, "setPack", 86);
    if (slug === "swarm-protocol") await cmd(page, "grantXp", 12);
    await page.waitForTimeout(800);
    await save(page, `${slug}-peak-1440`);
    await cmd(page, "finishRun");
    await page.waitForTimeout(700);
    await save(page, `${slug}-result-1440`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const slug of GAMES) {
    await waitGame(page, slug);
    if (slug === "crowd-control") await cmd(page, "setPack", 48);
    await page.waitForTimeout(500);
    await save(page, `${slug}-play-390`);
  }
});
