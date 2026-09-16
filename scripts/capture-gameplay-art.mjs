import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const out = join(dirname(fileURLToPath(import.meta.url)), "../apps/web/public/art");
mkdirSync(out, { recursive: true });

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
  await page.locator("canvas").click({ position: { x: 640, y: 360 } });
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
  await page.waitForTimeout(80);
}

async function snap(page, name) {
  await hideChrome(page);
  const canvas = page.locator("canvas").first();
  await canvas.screenshot({ path: join(out, name), type: "jpeg", quality: 92 });
  console.log("wrote", name);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

await ready(page, "neon-drift");
await page.keyboard.down("KeyW");
await page.waitForTimeout(900);
await page.keyboard.down("KeyD");
await page.keyboard.down("Space");
await page.waitForTimeout(700);
await snap(page, "neon-drift-backdrop.jpg");
await page.waitForTimeout(280);
await snap(page, "neon-drift-hero.jpg");
await page.keyboard.up("Space");
await page.keyboard.up("KeyD");
await page.keyboard.up("KeyW");

await ready(page, "velocity-run");
await page.keyboard.down("KeyD");
await page.waitForFunction(() => (window.__GW_DEBUG__?.playerX ?? 0) > 420, null, { timeout: 8000 });
await page.keyboard.down("Space");
await page.waitForTimeout(180);
await snap(page, "velocity-run-backdrop.jpg");
await snap(page, "velocity-run-hero.jpg");
await page.keyboard.up("Space");
await page.keyboard.up("KeyD");

await ready(page, "swarm-protocol");
await page.waitForTimeout(24000);
await snap(page, "swarm-protocol-backdrop.jpg");
await page.waitForTimeout(5000);
await snap(page, "swarm-protocol-hero.jpg");

await browser.close();
console.log("done", out);
