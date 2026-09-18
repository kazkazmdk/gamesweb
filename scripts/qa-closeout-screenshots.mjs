import { chromium } from "@playwright/test";
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3010";
const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, "../docs/qa-closeout");
const cmp = join(out, "comparisons");
const prev = join(root, "../docs/qa");
mkdirSync(out, { recursive: true });
mkdirSync(cmp, { recursive: true });

const GAMES = [
  "neon-drift",
  "velocity-run",
  "swarm-protocol",
  "sky-stack",
  "knockout-circuit",
  "pocket-striker",
  "territory-rush",
  "crowd-control",
];

async function ready(page, gameId) {
  await page.addInitScript(() => {
    window.__GW_ALLOW_DEBUG__ = true;
  });
  await page.goto(`${BASE}/play/${gameId}?gwinput=1`, { waitUntil: "domcontentloaded" });
  await page.locator("canvas").waitFor({ timeout: 25000 });
  await page.waitForFunction(
    (id) => window.__GW_DEBUG__?.ready && window.__GW_DEBUG__?.gameId === id,
    gameId,
    { timeout: 25000 },
  );
  await page.locator("canvas").evaluate((el) => {
    if (el instanceof HTMLCanvasElement) el.focus({ preventScroll: true });
  });
}

async function aimPocket(page) {
  const box = await page.locator("canvas").boundingBox();
  if (!box) return;
  await page.mouse.move(box.x + box.width * 0.22, box.y + box.height * 0.55);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.08, box.y + box.height * 0.7);
  await page.mouse.up();
}

async function play(page, gameId, ms) {
  if (gameId === "neon-drift") {
    await page.keyboard.down("KeyW");
    await page.keyboard.down("KeyD");
    await page.keyboard.down("Space");
    await page.waitForTimeout(ms);
    await page.keyboard.up("Space");
    await page.keyboard.up("KeyD");
    await page.keyboard.up("KeyW");
  } else if (gameId === "velocity-run" || gameId === "knockout-circuit") {
    await page.keyboard.down("KeyD");
    const end = Date.now() + ms;
    while (Date.now() < end) {
      await page.keyboard.down("Space");
      await page.waitForTimeout(180);
      await page.keyboard.up("Space");
      await page.waitForTimeout(220);
    }
    await page.keyboard.up("KeyD");
  } else if (gameId === "swarm-protocol") {
    await page.keyboard.down("KeyW");
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(ms);
    await page.keyboard.up("KeyW");
    await page.keyboard.up("KeyD");
  } else if (gameId === "sky-stack") {
    const hops = Math.max(3, Math.floor(ms / 400));
    for (let i = 0; i < hops; i += 1) {
      await page.evaluate(() => window.__GW_DEBUG_CMD__?.jump?.());
      await page.waitForTimeout(280);
    }
  } else if (gameId === "pocket-striker") {
    await aimPocket(page);
    await page.waitForTimeout(ms);
  } else if (gameId === "territory-rush") {
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(ms / 2);
    await page.keyboard.up("KeyD");
    await page.keyboard.down("KeyS");
    await page.waitForTimeout(ms / 2);
    await page.keyboard.up("KeyS");
  } else if (gameId === "crowd-control") {
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(ms);
    await page.keyboard.up("KeyD");
  }
}

async function peakPrep(page, gameId) {
  if (gameId === "swarm-protocol") {
    await page.evaluate(() => {
      for (let i = 0; i < 12; i += 1) window.__GW_DEBUG_CMD__?.grantXp?.(80);
    });
    await page.waitForTimeout(80);
    for (let i = 0; i < 8; i += 1) {
      await page.evaluate(() => window.__GW_DEBUG_CMD__?.pickUpgrade?.(0));
      await page.waitForTimeout(40);
    }
  }
}

const browser = await chromium.launch({ headless: true });

for (const game of GAMES) {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await ready(desktop, game);
  await desktop.waitForTimeout(400);
  await desktop.screenshot({ path: join(out, `${game}-opening.png`), type: "png" });
  await play(desktop, game, 1800);
  await desktop.screenshot({ path: join(out, `${game}-mid.png`), type: "png" });
  await peakPrep(desktop, game);
  await play(desktop, game, 2200);
  await desktop.screenshot({ path: join(out, `${game}-peak.png`), type: "png" });
  await desktop.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await ready(mobile, game);
  await play(mobile, game, 1200);
  await mobile.screenshot({ path: join(out, `${game}-mobile.png`), type: "png" });
  await mobile.close();

  const result = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await ready(result, game);
  await play(result, game, 800);
  await result.evaluate(() => window.__GW_DEBUG_CMD__?.finishRun?.());
  await result.waitForTimeout(700);
  await result.screenshot({ path: join(out, `${game}-result.png`), type: "png" });
  await result.close();

  const before = join(prev, `${game}-desktop.png`);
  if (existsSync(before)) {
    copyFileSync(before, join(cmp, `${game}-before.png`));
    copyFileSync(join(out, `${game}-peak.png`), join(cmp, `${game}-after.png`));
  }
  console.log("captured", game);
}

await browser.close();
console.log("wrote closeout screenshots to", out);
