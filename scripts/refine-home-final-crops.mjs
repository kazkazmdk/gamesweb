import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3010";
const out = join(dirname(fileURLToPath(import.meta.url)), "../docs/qa-home-final/candidates");
mkdirSync(out, { recursive: true });

async function ready(page, gameId, mode) {
  await page.addInitScript(() => {
    window.__GW_ALLOW_DEBUG__ = true;
    localStorage.setItem("gw:reduced-motion", "0");
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

async function hideChrome(page) {
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
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await ready(page, "swarm-protocol");
for (let i = 0; i < 3; i += 1) {
  await page.evaluate(() => window.__GW_DEBUG_CMD__?.grantXp?.(80));
  await page.waitForTimeout(30);
  const state = await page.evaluate(() => window.__GW_DEBUG__?.runState);
  if (state === "choosing") {
    await page.evaluate((pick) => window.__GW_DEBUG_CMD__?.pickUpgrade?.(pick), i % 3);
    await page.waitForTimeout(40);
  }
}

const keys = ["KeyD", "KeyW", "KeyA", "KeyS"];
for (let i = 0; i < 12; i += 1) {
  const key = keys[i % keys.length];
  await page.keyboard.down(key);
  await page.waitForTimeout(2800);
  await page.keyboard.up(key);
  const st = await page.evaluate(() => ({ ...window.__GW_DEBUG__ }));
  if (st.boss && st.boss !== "none") {
    console.log("stop before boss", st);
    break;
  }
  await hideChrome(page);
  const name = `swarm-protocol-live-${String(i + 1).padStart(2, "0")}.jpg`;
  await page.locator("canvas").first().screenshot({ path: join(out, name), type: "jpeg", quality: 90 });
  console.log("wrote", name, st.kills, st.level, st.boss, st.playerX, st.playerY);
}

await browser.close();
console.log("done");
