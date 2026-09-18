import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3010";
const out = join(dirname(fileURLToPath(import.meta.url)), "../docs/qa-home-art/candidates");
mkdirSync(out, { recursive: true });

async function ready(page, gameId, mode) {
  await page.addInitScript(() => {
    window.__GW_ALLOW_DEBUG__ = true;
  });
  const q = mode == null ? "gwinput=1" : `gwinput=1&mode=${mode}`;
  await page.goto(`${BASE}/play/${gameId}?${q}`, { waitUntil: "domcontentloaded" });
  await page.locator("canvas").waitFor({ timeout: 30000 });
  await page.waitForFunction(
    (id) => window.__GW_DEBUG__?.ready && window.__GW_DEBUG__?.gameId === id,
    gameId,
    { timeout: 30000 },
  );
  await page.locator("canvas").evaluate((el) => {
    if (el instanceof HTMLCanvasElement) el.focus({ preventScroll: true });
  });
}

async function snap(page, name) {
  await page.evaluate(() => {
    window.__GW_DEBUG_CMD__?.hideHud?.();
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    for (const el of document.body.querySelectorAll("*")) {
      if (el === canvas || el.contains(canvas) || canvas.contains(el)) continue;
      if (el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "LINK") continue;
      el.style.setProperty("visibility", "hidden", "important");
    }
  });
  await page.waitForTimeout(40);
  await page.locator("canvas").first().screenshot({ path: join(out, name), type: "jpeg", quality: 92 });
  console.log("wrote", name, await page.evaluate(() => ({ ...window.__GW_DEBUG__ })));
}

const browser = await chromium.launch({ headless: true });

{
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await ready(page, "swarm-protocol");
  for (let i = 0; i < 10; i += 1) {
    await page.evaluate(() => window.__GW_DEBUG_CMD__?.grantXp?.(90));
    await page.waitForTimeout(30);
    const state = await page.evaluate(() => window.__GW_DEBUG__?.runState);
    if (state === "choosing") {
      await page.evaluate((pick) => window.__GW_DEBUG_CMD__?.pickUpgrade?.(pick), i % 3);
    }
    await page.waitForTimeout(700);
  }
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(2500);
  await page.keyboard.up("KeyD");
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(1800);
  await snap(page, "swarm-protocol-05-play.jpg");
  await page.waitForTimeout(900);
  await snap(page, "swarm-protocol-06-play.jpg");
  await page.keyboard.up("KeyW");
  await page.keyboard.down("KeyA");
  await page.waitForTimeout(1200);
  await snap(page, "swarm-protocol-07-play.jpg");
  await page.keyboard.up("KeyA");
  await page.waitForTimeout(1500);
  await snap(page, "swarm-protocol-08-play.jpg");
  await page.close();
}

{
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await ready(page, "crowd-control", 9);
  await page.keyboard.down("ArrowLeft");
  for (let i = 0; i < 16; i += 1) {
    const st = await page.evaluate(() => window.__GW_DEBUG__);
    console.log("crowd9", i, st?.score, st?.playerY, st?.boss);
    if ((st?.playerY ?? 0) > 640) break;
    await page.waitForTimeout(350);
  }
  await snap(page, "crowd-control-07-x4.jpg");
  await page.waitForTimeout(500);
  await snap(page, "crowd-control-08-x4.jpg");
  await page.waitForTimeout(700);
  await snap(page, "crowd-control-09-finish.jpg");
  await page.keyboard.up("ArrowLeft");
  await page.close();
}

{
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await ready(page, "crowd-control", 14);
  await page.keyboard.down("ArrowLeft");
  for (let i = 0; i < 22; i += 1) {
    const st = await page.evaluate(() => window.__GW_DEBUG__);
    console.log("crowd14", i, st?.score, st?.playerY, st?.boss);
    if (String(st?.boss ?? "none") !== "none" && (st?.score ?? 0) >= 24) break;
    await page.waitForTimeout(350);
  }
  await snap(page, "crowd-control-10-reactor.jpg");
  await page.waitForTimeout(600);
  await snap(page, "crowd-control-11-reactor.jpg");
  await page.keyboard.up("ArrowLeft");
  await page.close();
}

await browser.close();
console.log("done");
