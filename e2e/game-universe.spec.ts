import { expect, test, type Page } from "@playwright/test";
import { stabilizeVisual } from "./visual-helpers";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "docs/qa-game-universe-seo";

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

test.skip(!process.env.QA_MATRIX, "Set QA_MATRIX=1 to capture universe stills");

async function save(page: Page, name: string) {
  mkdirSync(`${OUT}/screenshots`, { recursive: true });
  await page.screenshot({ path: `${OUT}/screenshots/${name}.png`, fullPage: false });
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

test("universe stills and nameless contact", async ({ page }) => {
  test.setTimeout(360_000);
  await stabilizeVisual(page, { width: 1440, height: 900 });
  for (const slug of GAMES) {
    await waitGame(page, slug);
    await page.waitForTimeout(400);
    await save(page, `${slug}-open`);
    if (slug === "crowd-control") {
      await cmd(page, "setPack", 10);
      await page.waitForTimeout(200);
      await save(page, "crowd-control-pack-10");
      await cmd(page, "seekGate");
      await page.waitForTimeout(200);
      await save(page, "crowd-control-gate");
    }
    if (slug === "sky-stack") await cmd(page, "stackTo", 4);
    if (slug === "territory-rush") {
      await cmd(page, "exposeTrail");
      await page.waitForTimeout(200);
      await save(page, "territory-rush-trail");
    }
    if (slug === "neon-drift") await cmd(page, "setDrive", 1, 1, true);
    await page.waitForTimeout(600);
    await save(page, `${slug}-mid`);
    if (slug === "crowd-control") await cmd(page, "setPack", 86);
    if (slug === "swarm-protocol") await cmd(page, "seedPeak");
    if (slug === "sky-stack") await cmd(page, "stackTo", 28);
    if (slug === "territory-rush") await cmd(page, "closeLoop");
    if (slug === "velocity-run") await cmd(page, "setCourse", "course-3");
    await page.waitForTimeout(500);
    await save(page, `${slug}-peak`);
    await cmd(page, "hideHud");
    await page.waitForTimeout(220);
    await save(page, `${slug}-nameless`);
  }

  mkdirSync(OUT, { recursive: true });
  for (const state of ["open", "peak", "nameless"] as const) {
    const cells = GAMES.map((slug) => `<figure><img src="screenshots/${slug}-${state}.png" alt="" /></figure>`).join("");
    writeFileSync(
      `${OUT}/contact-${state}.html`,
      `<!doctype html><html><head><style>
        body{margin:0;background:#0c0c0e;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:6px}
        figure{margin:0} img{width:100%;height:200px;object-fit:cover;display:block}
      </style></head><body>${cells}</body></html>`,
    );
    await page.goto(`file://${process.cwd()}/${OUT}/contact-${state}.html`);
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${OUT}/contact-${state}.png`, fullPage: true });
  }
});
