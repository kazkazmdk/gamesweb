import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { stabilizeVisual } from "./visual-helpers";

const GAMES_OUT = "docs/qa-final-closeout/games";
const PLATFORM_OUT = "docs/qa-final-closeout/platform";
const SEO_OUT = "docs/qa-final-closeout/seo";

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

async function save(page: Page, dir: string, name: string, fullPage = false) {
  mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage });
}

async function debugOf(page: Page) {
  return page.evaluate(
    () => (window as unknown as { __GW_DEBUG__?: { ready?: boolean; gameId?: string } }).__GW_DEBUG__ ?? null,
  );
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

async function waitGame(page: Page, slug: string, playIndex?: number) {
  await page.addInitScript(
    ({ id, index }) => {
      (window as Window & { __GW_ALLOW_DEBUG__?: boolean }).__GW_ALLOW_DEBUG__ = true;
      if (index !== undefined) {
        const key = id === "neon-drift" ? "gw:neon-track" : id === "velocity-run" ? "gw:velocity-course" : `gw:play-index:${id}`;
        localStorage.setItem(key, String(index));
      }
    },
    { id: slug, index: playIndex },
  );
  await page.goto(`/play/${slug}`);
  await page.locator("canvas").waitFor({ timeout: 30_000 });
  await expect
    .poll(async () => {
      const d = await debugOf(page);
      return d?.ready ? d.gameId : null;
    }, { timeout: 30_000 })
    .toBeTruthy();
}

test("final games recapture", async ({ page }) => {
  test.setTimeout(420_000);
  await stabilizeVisual(page, { width: 1440, height: 900 });

  for (const slug of GAMES) {
    await waitGame(page, slug);
    await page.waitForTimeout(400);
    await save(page, GAMES_OUT, `${slug}-open-1440`);

    if (slug === "territory-rush") {
      await cmd(page, "exposeTrail");
      await page.waitForTimeout(280);
      await save(page, GAMES_OUT, "territory-rush-trail-1440");
      await cmd(page, "closeLoop");
      await page.waitForTimeout(180);
      await save(page, GAMES_OUT, "territory-rush-loop-1440");
      await page.waitForTimeout(420);
      await save(page, GAMES_OUT, "territory-rush-fill-1440");
      await cmd(page, "closeLoop");
      await page.waitForTimeout(500);
      await save(page, GAMES_OUT, "territory-rush-owned-1440");
    }

    if (slug === "crowd-control") {
      await cmd(page, "setPack", 10);
      await cmd(page, "seekGate");
      await page.waitForTimeout(350);
      await save(page, GAMES_OUT, "crowd-control-gate-before-1440");
      await cmd(page, "setPack", 30);
      await page.waitForTimeout(250);
      await save(page, GAMES_OUT, "crowd-control-pack-30-1440");
      await cmd(page, "setPack", 86);
      await page.waitForTimeout(250);
      await save(page, GAMES_OUT, "crowd-control-gate-after-1440");
      await cmd(page, "setPack", 120);
    }

    if (slug === "neon-drift") {
      await cmd(page, "setDrive", 1, 1, true);
      await page.waitForTimeout(1400);
      await save(page, GAMES_OUT, "neon-drift-harbour-1440");
    }

    if (slug === "swarm-protocol") {
      await cmd(page, "seedPeak");
      await page.waitForTimeout(400);
      await save(page, GAMES_OUT, "swarm-protocol-seeded-1440");
    }

    if (slug === "sky-stack") await cmd(page, "stackTo", 8);
    await page.waitForTimeout(500);
    await save(page, GAMES_OUT, `${slug}-mid-1440`);

    if (slug === "swarm-protocol") await cmd(page, "grantXp", 18);
    if (slug === "sky-stack") await cmd(page, "stackTo", 32);
    await page.waitForTimeout(600);
    await save(page, GAMES_OUT, `${slug}-peak-1440`);

    await cmd(page, "finishRun");
    await page.waitForTimeout(700);
    await save(page, GAMES_OUT, `${slug}-payoff-1440`);
  }

  await waitGame(page, "neon-drift", 1);
  await page.waitForTimeout(500);
  await save(page, GAMES_OUT, "neon-drift-hairpin-1440");
  await waitGame(page, "neon-drift", 2);
  await page.waitForTimeout(500);
  await save(page, GAMES_OUT, "neon-drift-ridge-1440");

  await waitGame(page, "velocity-run", 0);
  await cmd(page, "setCourse", "training");
  await page.waitForTimeout(400);
  await save(page, GAMES_OUT, "velocity-run-hvac-1440");
  await cmd(page, "setCourse", "transit");
  await page.waitForTimeout(400);
  await save(page, GAMES_OUT, "velocity-run-crane-1440");
  await cmd(page, "setCourse", "ascent");
  await page.waitForTimeout(400);
  await save(page, GAMES_OUT, "velocity-run-comms-1440");

  await waitGame(page, "knockout-circuit", 0);
  await page.waitForTimeout(400);
  await save(page, GAMES_OUT, "knockout-circuit-factory-1440");
  await waitGame(page, "knockout-circuit", 2);
  await page.waitForTimeout(400);
  await save(page, GAMES_OUT, "knockout-circuit-skyworks-1440");
  await waitGame(page, "knockout-circuit", 4);
  await page.waitForTimeout(400);
  await save(page, GAMES_OUT, "knockout-circuit-signal-1440");

  await page.setViewportSize({ width: 390, height: 844 });
  for (const slug of GAMES) {
    await waitGame(page, slug);
    if (slug === "crowd-control") await cmd(page, "setPack", 80);
    if (slug === "swarm-protocol") await cmd(page, "seedPeak");
    await page.waitForTimeout(400);
    await save(page, GAMES_OUT, `${slug}-play-390`);
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  mkdirSync(GAMES_OUT, { recursive: true });
  for (const state of ["open", "peak"] as const) {
    const cells = GAMES.map((slug) => `<figure><img src="${slug}-${state}-1440.png" alt="${slug} ${state}" /></figure>`).join("");
    writeFileSync(
      `${GAMES_OUT}/contact-${state}.html`,
      `<!doctype html><html><head><style>
        body{margin:0;background:#0c0c0e;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:6px}
        figure{margin:0}
        img{width:100%;height:200px;object-fit:cover;display:block}
      </style></head><body>${cells}</body></html>`,
    );
    await page.goto(`file://${process.cwd()}/${GAMES_OUT}/contact-${state}.html`);
    await page.waitForTimeout(200);
    await save(page, GAMES_OUT, `contact-sheet-${state}-1440`, true);
  }
});

test("final platform surfaces", async ({ page }) => {
  test.setTimeout(180_000);
  const routes: Array<[string, string]> = [
    ["/", "home"],
    ["/arcade", "arcade"],
    ["/games/neon-drift", "hub-neon"],
    ["/games/crowd-control", "hub-crowd"],
    ["/daily", "daily"],
    ["/grand-prix", "grand-prix"],
    ["/challenges", "challenges"],
    ["/friends", "friends"],
    ["/inbox", "inbox"],
    ["/party", "party"],
    ["/crew", "crew"],
    ["/leaderboards", "leaderboards"],
    ["/me", "profile-self"],
    ["/profile/nobody-here-xyz", "profile-public"],
    ["/achievements", "achievements"],
    ["/settings", "settings"],
  ];
  for (const width of [1920, 1440, 1366, 768, 390] as const) {
    const height = width >= 1366 ? 900 : width === 768 ? 1024 : 844;
    await stabilizeVisual(page, { width, height });
    for (const [path, name] of routes) {
      await page.goto(path);
      await page.waitForTimeout(250);
      await save(page, PLATFORM_OUT, `${name}-${width}`);
    }
  }
});

test("final SEO public surfaces", async ({ page }) => {
  test.setTimeout(120_000);
  const routes = [
    ["/games", "catalog"],
    ["/guides", "guides"],
    ["/collections", "collections"],
    ["/collections/quick-games", "collection-quick"],
    ["/games/neon-drift/guide", "guide-neon"],
    ["/games/neon-drift/controls", "controls-neon"],
    ["/games/territory-rush/strategy", "strategy-territory"],
    ["/games/velocity-run/achievements", "achievements-velocity"],
    ["/games/neon-drift", "hub-editorial"],
  ];
  for (const width of [1440, 390] as const) {
    const height = width === 1440 ? 900 : 844;
    await stabilizeVisual(page, { width, height });
    for (const [path, name] of routes) {
      await page.goto(path);
      if (name === "hub-editorial") {
        await page.locator('section[aria-label="About the game"]').scrollIntoViewIfNeeded();
      }
      await page.waitForTimeout(200);
      await save(page, SEO_OUT, `${name}-${width}`, name !== "hub-editorial");
    }
  }
});
