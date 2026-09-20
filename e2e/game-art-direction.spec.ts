import { expect, test, type Page } from "@playwright/test";
import { stabilizeVisual } from "./visual-helpers";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "docs/qa-game-art-direction";

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

test.skip(!process.env.QA_MATRIX, "Set QA_MATRIX=1 to capture the art-direction matrix");

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

test("eight games art direction matrix", async ({ page }) => {
  test.setTimeout(360_000);
  await stabilizeVisual(page, { width: 1440, height: 900 });
  for (const slug of GAMES) {
    await waitGame(page, slug);
    await page.waitForTimeout(400);
    await save(page, `${slug}-open-1440`);

    if (slug === "neon-drift") {
      await save(page, "neon-drift-hold-1440");
      await cmd(page, "setDrive", 1, 1, true);
      await page.waitForTimeout(1600);
      await save(page, "neon-drift-combo-1440");
      await cmd(page, "setDrive", 1, 0, false);
      await page.waitForTimeout(450);
      await save(page, "neon-drift-bank-1440");
      await cmd(page, "setDrive", 1, -1, false);
      await page.waitForTimeout(900);
      await save(page, "neon-drift-break-1440");
      await cmd(page, "setDrive", 0, 0, false);
    }
    if (slug === "territory-rush") {
      await cmd(page, "exposeTrail");
      await page.waitForTimeout(250);
      await save(page, "territory-rush-trail-1440");
    }
    if (slug === "velocity-run") {
      await cmd(page, "hideHud");
      await page.waitForTimeout(200);
      await save(page, "velocity-run-hvac-1440");
      await cmd(page, "setCourse", "transit");
      await expect.poll(async () => (await debugOf(page))?.ready, { timeout: 20_000 }).toBeTruthy();
      await cmd(page, "hideHud");
      await page.waitForTimeout(250);
      await save(page, "velocity-run-transit-1440");
      await cmd(page, "setCourse", "ascent");
      await expect.poll(async () => (await debugOf(page))?.ready, { timeout: 20_000 }).toBeTruthy();
      await cmd(page, "hideHud");
      await page.waitForTimeout(250);
      await save(page, "velocity-run-comms-1440");
    }
    if (slug === "crowd-control") {
      await cmd(page, "seekGate");
      await page.waitForTimeout(200);
      await save(page, "crowd-control-gate-before-1440");
      await cmd(page, "setPack", 10);
    }
    if (slug === "sky-stack") await cmd(page, "stackTo", 4);
    await page.waitForTimeout(700);
    await save(page, `${slug}-mid-1440`);

    if (slug === "crowd-control") {
      await cmd(page, "setPack", 30);
      await page.waitForTimeout(300);
      await save(page, "crowd-control-pack-30-1440");
      await cmd(page, "setPack", 86);
      await page.waitForTimeout(200);
      await save(page, "crowd-control-gate-after-1440");
    }
    if (slug === "swarm-protocol") {
      await cmd(page, "grantXp", 18);
      await cmd(page, "seedPeak");
    }
    if (slug === "sky-stack") await cmd(page, "stackTo", 48);
    if (slug === "territory-rush") {
      await cmd(page, "closeLoop");
      await page.waitForTimeout(200);
      await save(page, "territory-rush-fill-1440");
    }
    await page.waitForTimeout(700);
    await save(page, `${slug}-peak-1440`);

    await cmd(page, "finishRun");
    await page.waitForTimeout(700);
    await save(page, `${slug}-payoff-1440`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  for (const slug of GAMES) {
    await waitGame(page, slug);
    if (slug === "crowd-control") await cmd(page, "setPack", 48);
    await page.waitForTimeout(500);
    await save(page, `${slug}-play-390`);
  }
});

test("catalog contact sheets", async ({ page }) => {
  test.setTimeout(60_000);
  await stabilizeVisual(page, { width: 1440, height: 900 });
  mkdirSync(OUT, { recursive: true });
  for (const state of ["open", "peak"] as const) {
    const src = (slug: (typeof GAMES)[number]) => {
      if (state === "peak" && slug === "neon-drift") return "neon-drift-combo-1440.png";
      if (state === "peak" && slug === "territory-rush") return "territory-rush-fill-1440.png";
      return `${slug}-${state}-1440.png`;
    };
    const cells = GAMES.map((slug) => `<figure><img src="${src(slug)}" alt="" /></figure>`).join("");
    writeFileSync(
      `${OUT}/contact-${state}.html`,
      `<!doctype html><html><head><style>
        body{margin:0;background:#0c0c0e;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:6px}
        figure{margin:0}
        img{width:100%;height:200px;object-fit:cover;display:block}
      </style></head><body>${cells}</body></html>`,
    );
    await page.goto(`file://${process.cwd()}/${OUT}/contact-${state}.html`);
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${OUT}/contact-sheet-${state}-1440.png`, fullPage: true });
  }
});
