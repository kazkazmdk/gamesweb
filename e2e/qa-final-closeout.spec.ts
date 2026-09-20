import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { stabilizeVisual } from "./visual-helpers";

const OUT = "docs/qa-final-closeout";

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

test.skip(!process.env.QA_MATRIX, "Set QA_MATRIX=1 to capture the final closeout matrix");

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

test("platform and SEO surfaces", async ({ page }) => {
  test.setTimeout(180_000);
  await stabilizeVisual(page, { width: 1440, height: 900 });
  await page.goto("/");
  await page.waitForTimeout(400);
  await save(page, "home-1440");
  await page.goto("/games");
  await save(page, "games-catalog-1440");
  await page.goto("/games/neon-drift");
  await save(page, "game-hub-1440");
  await page.goto("/guides");
  await save(page, "guides-1440");
  await page.goto("/games/neon-drift/how-to-play");
  await save(page, "howto-1440");
  await page.goto("/games/neon-drift/strategy");
  await save(page, "strategy-1440");
  await page.goto("/collections/skill-games");
  await save(page, "collection-1440");
  await page.goto("/games/neon-drift/tracks/foundation");
  await save(page, "content-unit-1440");
  await page.goto("/friends");
  await save(page, "friends-empty-1440");
  await page.goto("/leaderboards");
  await save(page, "leaderboards-empty-1440");
  await page.goto("/achievements");
  await save(page, "achievements-1440");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await save(page, "home-390");
  await page.goto("/games");
  await save(page, "games-catalog-390");
  await page.goto("/games/neon-drift");
  await save(page, "game-hub-390");
});

test("eight games opening peak payoff mobile", async ({ page }) => {
  test.setTimeout(360_000);
  await stabilizeVisual(page, { width: 1440, height: 900 });
  for (const slug of GAMES) {
    await waitGame(page, slug);
    await page.waitForTimeout(400);
    await save(page, `${slug}-open-1440`);

    if (slug === "neon-drift") {
      await cmd(page, "hideHud");
      await save(page, "neon-harbour-1440");
    }
    if (slug === "territory-rush") {
      await cmd(page, "exposeTrail");
      await page.waitForTimeout(250);
      await save(page, "territory-rush-before-1440");
    }
    if (slug === "crowd-control") {
      await cmd(page, "setPack", 12);
      await cmd(page, "seekGate");
      await page.waitForTimeout(300);
      await save(page, "crowd-control-gate-before-1440");
    }
    if (slug === "velocity-run") {
      await cmd(page, "hideHud");
      await save(page, "velocity-hvac-1440");
      await cmd(page, "setCourse", "course-2");
      await page.waitForTimeout(400);
      await cmd(page, "hideHud");
      await save(page, "velocity-transit-1440");
      await cmd(page, "setCourse", "course-3");
      await page.waitForTimeout(400);
      await cmd(page, "hideHud");
      await save(page, "velocity-ascent-1440");
    }

    if (slug === "crowd-control") await cmd(page, "setPack", 30);
    if (slug === "sky-stack") await cmd(page, "stackTo", 4);
    await page.waitForTimeout(500);
    await save(page, `${slug}-mid-1440`);

    if (slug === "crowd-control") {
      await cmd(page, "setPack", 86);
      await cmd(page, "seekGate");
      await page.waitForTimeout(400);
      await save(page, "crowd-control-gate-after-1440");
    }
    if (slug === "swarm-protocol") await cmd(page, "seedPeak");
    if (slug === "sky-stack") await cmd(page, "stackTo", 28);
    if (slug === "territory-rush") {
      await cmd(page, "closeLoop");
      await page.waitForTimeout(250);
      await save(page, "territory-rush-after-1440");
    }
    await page.waitForTimeout(600);
    await save(page, `${slug}-peak-1440`);

    await cmd(page, "finishRun");
    await page.waitForTimeout(600);
    await save(page, `${slug}-payoff-1440`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  for (const slug of GAMES) {
    await waitGame(page, slug);
    if (slug === "crowd-control") await cmd(page, "setPack", 48);
    await page.waitForTimeout(400);
    await save(page, `${slug}-play-390`);
  }
});
