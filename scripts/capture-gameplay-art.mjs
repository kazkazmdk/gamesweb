import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE =
  process.env.BASE_URL ??
  "https://gamesweb-git-cursor-infra-preview-c08e-loan-s-projects2z.vercel.app";
const out = join(dirname(fileURLToPath(import.meta.url)), "../apps/web/public/art");
mkdirSync(out, { recursive: true });

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
  await page.locator("canvas").click({ position: { x: 640, y: 360 } });
}

async function hideChrome(page) {
  await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    for (const el of document.body.querySelectorAll("*")) {
      if (el === canvas || el.contains(canvas) || canvas.contains(el)) continue;
      if (el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "LINK") continue;
      el.style.setProperty("visibility", "hidden", "important");
    }
  });
}

async function snap(page, name) {
  await hideChrome(page);
  const canvas = page.locator("canvas").first();
  await canvas.screenshot({ path: join(out, name), type: "jpeg", quality: 88 });
  console.log("wrote", name);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

await ready(page, "neon-drift");
await page.evaluate(() => window.__GW_DEBUG_CMD__?.setDrive?.(0.72, -0.06));
await page.waitForTimeout(1100);
await snap(page, "neon-drift-backdrop.jpg");
await page.evaluate(() => window.__GW_DEBUG_CMD__?.setDrive?.(0.78, 0.22));
await page.waitForTimeout(380);
await snap(page, "neon-drift-hero.jpg");
await page.evaluate(() => window.__GW_DEBUG_CMD__?.setDrive?.(0, 0));

await ready(page, "velocity-run");
await page.keyboard.down("KeyD");
await page.waitForTimeout(380);
await page.keyboard.down("Space");
await page.waitForTimeout(180);
await snap(page, "velocity-run-backdrop.jpg");
await page.waitForTimeout(80);
await snap(page, "velocity-run-hero.jpg");
await page.keyboard.up("Space");
await page.keyboard.up("KeyD");

await ready(page, "swarm-protocol");
await page.keyboard.down("KeyD");
await page.waitForTimeout(14000);
await snap(page, "swarm-protocol-backdrop.jpg");
await page.waitForTimeout(6000);
await snap(page, "swarm-protocol-hero.jpg");
await page.keyboard.up("KeyD");

await browser.close();
console.log("done", out);
