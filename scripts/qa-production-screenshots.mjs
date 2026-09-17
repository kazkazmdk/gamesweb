import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3010";
const out = join(dirname(fileURLToPath(import.meta.url)), "../docs/qa");
mkdirSync(out, { recursive: true });

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
  await page.goto(`${BASE}/play/${gameId}`, { waitUntil: "domcontentloaded" });
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

async function play(page, gameId) {
  if (gameId === "neon-drift") {
    await page.keyboard.down("KeyW");
    await page.keyboard.down("KeyD");
    await page.keyboard.down("Space");
    await page.waitForTimeout(900);
    await page.keyboard.up("Space");
    await page.keyboard.up("KeyD");
    await page.keyboard.up("KeyW");
  } else if (gameId === "velocity-run" || gameId === "knockout-circuit") {
    await page.keyboard.down("KeyD");
    await page.keyboard.down("Space");
    await page.waitForTimeout(500);
    await page.keyboard.up("Space");
    await page.keyboard.up("KeyD");
  } else if (gameId === "swarm-protocol") {
    await page.keyboard.down("KeyW");
    await page.waitForTimeout(700);
    await page.keyboard.up("KeyW");
  } else if (gameId === "sky-stack") {
    await page.evaluate(() => window.__GW_DEBUG_CMD__?.jump?.());
    await page.waitForTimeout(200);
  } else if (gameId === "pocket-striker") {
    const box = await page.locator("canvas").boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.08, box.y + box.height * 0.55);
      await page.mouse.up();
    }
    await page.waitForTimeout(400);
  } else if (gameId === "territory-rush") {
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(500);
    await page.keyboard.up("KeyD");
  } else if (gameId === "crowd-control") {
    await page.keyboard.down("KeyA");
    await page.waitForTimeout(500);
    await page.keyboard.up("KeyA");
  }
}

const browser = await chromium.launch({ headless: true });

for (const game of GAMES) {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await ready(desktop, game);
  await play(desktop, game);
  await desktop.screenshot({ path: join(out, `${game}-desktop.png`), type: "png" });
  await desktop.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await ready(mobile, game);
  await play(mobile, game);
  await mobile.screenshot({ path: join(out, `${game}-mobile.png`), type: "png" });
  await mobile.close();

  const result = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await ready(result, game);
  await result.evaluate(() => window.__GW_DEBUG_CMD__?.finishRun?.());
  await result.waitForTimeout(700);
  await result.screenshot({ path: join(out, `${game}-result.png`), type: "png" });
  await result.close();
  console.log("captured", game);
}

await browser.close();
console.log("wrote 24 screenshots to", out);
