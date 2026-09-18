import { chromium } from "@playwright/test";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3010";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "docs/qa-home-art/candidates");
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
  await page.waitForTimeout(60);
}

async function snap(page, name) {
  await hideChrome(page);
  const canvas = page.locator("canvas").first();
  const path = join(out, name);
  await canvas.screenshot({ path, type: "jpeg", quality: 92 });
  console.log("wrote", name);
  return path;
}

async function debug(page) {
  return page.evaluate(() => ({ ...window.__GW_DEBUG__ }));
}

async function powerSwarm(page) {
  for (let i = 0; i < 14; i += 1) {
    await page.evaluate(() => window.__GW_DEBUG_CMD__?.grantXp?.(80));
    await page.waitForTimeout(40);
    const state = await page.evaluate(() => window.__GW_DEBUG__?.runState);
    if (state === "choosing") {
      await page.evaluate((pick) => window.__GW_DEBUG_CMD__?.pickUpgrade?.(pick), i % 3);
      await page.waitForTimeout(80);
    }
  }
}

const browser = await chromium.launch({ headless: true });

async function session(fn) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  try {
    await fn(page);
  } finally {
    await page.close();
  }
}

await session(async (page) => {
  await ready(page, "neon-drift", 1);
  await page.evaluate(() => window.__GW_DEBUG_CMD__?.setDrive?.(1, 0.82));
  await page.waitForTimeout(900);
  await snap(page, "neon-drift-01-hairpin.jpg");
  await page.waitForTimeout(500);
  await snap(page, "neon-drift-02-hairpin-drift.jpg");
});

await session(async (page) => {
  await ready(page, "neon-drift", 2);
  await page.evaluate(() => window.__GW_DEBUG_CMD__?.setDrive?.(1, -0.7));
  await page.waitForTimeout(1100);
  await snap(page, "neon-drift-03-ridge.jpg");
  await page.keyboard.down("Space");
  await page.waitForTimeout(400);
  await snap(page, "neon-drift-04-ridge-slide.jpg");
  await page.keyboard.up("Space");
});

await session(async (page) => {
  await ready(page, "velocity-run", 4);
  await page.keyboard.down("KeyD");
  await page.waitForFunction(() => (window.__GW_DEBUG__?.playerX ?? 0) > 380, null, { timeout: 10000 }).catch(() => null);
  await page.keyboard.down("Space");
  await page.waitForTimeout(160);
  await snap(page, "velocity-run-01-transit.jpg");
  await page.keyboard.up("Space");
  await page.waitForTimeout(400);
  await snap(page, "velocity-run-02-transit-run.jpg");
  await page.keyboard.up("KeyD");
});

await session(async (page) => {
  await ready(page, "velocity-run", 8);
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(900);
  await page.keyboard.down("Space");
  await page.waitForTimeout(180);
  await snap(page, "velocity-run-03-ascent.jpg");
  await page.keyboard.up("Space");
  await page.keyboard.up("KeyD");
});

await session(async (page) => {
  await ready(page, "velocity-run", 6);
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(700);
  await snap(page, "velocity-run-04-metro.jpg");
  await page.keyboard.up("KeyD");
});

await session(async (page) => {
  await ready(page, "swarm-protocol");
  await powerSwarm(page);
  await page.keyboard.down("KeyD");
  await page.waitForFunction(() => (window.__GW_DEBUG__?.kills ?? 0) > 8, null, { timeout: 12000 }).catch(() => null);
  await snap(page, "swarm-protocol-01-density.jpg");
  await page.waitForTimeout(1600);
  await snap(page, "swarm-protocol-02-later.jpg");
  await page.keyboard.up("KeyD");
  await page.keyboard.down("KeyA");
  await page.waitForTimeout(700);
  await snap(page, "swarm-protocol-03-strafe.jpg");
  await page.keyboard.up("KeyA");
});

await session(async (page) => {
  await ready(page, "swarm-protocol");
  await powerSwarm(page);
  await powerSwarm(page);
  await page.waitForTimeout(2200);
  await snap(page, "swarm-protocol-04-powered.jpg");
});

await session(async (page) => {
  await ready(page, "sky-stack");
  for (let i = 0; i < 6; i += 1) {
    await page.evaluate(() => window.__GW_DEBUG_CMD__?.jump?.());
    await page.waitForTimeout(280);
  }
  await snap(page, "sky-stack-01-tower.jpg");
  await page.evaluate(() => window.__GW_DEBUG_CMD__?.jump?.());
  await page.waitForTimeout(240);
  await snap(page, "sky-stack-02-place.jpg");
  await page.waitForTimeout(400);
  await snap(page, "sky-stack-03-sky.jpg");
});

await session(async (page) => {
  await ready(page, "knockout-circuit", 2);
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(800);
  await page.keyboard.down("Space");
  await page.waitForTimeout(200);
  await snap(page, "knockout-circuit-01-skyworks.jpg");
  await page.keyboard.up("Space");
  await page.keyboard.up("KeyD");
});

await session(async (page) => {
  await ready(page, "knockout-circuit", 4);
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(700);
  await snap(page, "knockout-circuit-02-signal.jpg");
  await page.keyboard.down("Space");
  await page.waitForTimeout(180);
  await snap(page, "knockout-circuit-03-signal-jump.jpg");
  await page.keyboard.up("Space");
  await page.keyboard.up("KeyD");
});

await session(async (page) => {
  await ready(page, "knockout-circuit", 7);
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(650);
  await snap(page, "knockout-circuit-04-bridge.jpg");
  await page.keyboard.up("KeyD");
});

await session(async (page) => {
  await ready(page, "pocket-striker", 12);
  const box = await page.locator("canvas").boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width * 0.28, box.y + box.height * 0.62);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.62, box.y + box.height * 0.28, { steps: 8 });
    await page.waitForTimeout(180);
    await snap(page, "pocket-striker-01-arcade-aim.jpg");
    await page.mouse.up();
    await page.waitForTimeout(420);
    await snap(page, "pocket-striker-02-arcade-shot.jpg");
  }
});

await session(async (page) => {
  await ready(page, "pocket-striker", 9);
  await page.waitForTimeout(300);
  await snap(page, "pocket-striker-03-garden.jpg");
  const box = await page.locator("canvas").boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.55);
    await page.waitForTimeout(200);
    await snap(page, "pocket-striker-04-garden-aim.jpg");
  }
});

await session(async (page) => {
  await ready(page, "territory-rush", 0);
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(1400);
  await page.keyboard.down("ArrowDown");
  await page.waitForTimeout(900);
  await snap(page, "territory-rush-01-circuit.jpg");
  await page.waitForTimeout(1100);
  await snap(page, "territory-rush-02-fill.jpg");
  await page.keyboard.up("ArrowDown");
  await page.keyboard.up("KeyD");
});

await session(async (page) => {
  await ready(page, "territory-rush", 1);
  await page.keyboard.down("KeyA");
  await page.waitForTimeout(1600);
  await snap(page, "territory-rush-03-shatter.jpg");
  await page.keyboard.up("KeyA");
});

await session(async (page) => {
  await ready(page, "crowd-control", 9);
  await page.keyboard.down("KeyA");
  await page.keyboard.down("Space");
  await page.waitForFunction(() => (window.__GW_DEBUG__?.score ?? 0) >= 24, null, { timeout: 8000 }).catch(() => null);
  await snap(page, "crowd-control-01-payoff.jpg");
  await page.waitForTimeout(900);
  await snap(page, "crowd-control-02-payoff-late.jpg");
  await page.keyboard.up("Space");
  await page.keyboard.up("KeyA");
});

await session(async (page) => {
  await ready(page, "crowd-control", 7);
  await page.keyboard.down("KeyA");
  await page.waitForFunction(() => String(window.__GW_DEBUG__?.boss ?? "none") !== "none", null, { timeout: 9000 }).catch(() => null);
  await snap(page, "crowd-control-03-guardian.jpg");
  await page.waitForTimeout(700);
  await snap(page, "crowd-control-04-guardian-clash.jpg");
  await page.keyboard.up("KeyA");
});

await session(async (page) => {
  await ready(page, "crowd-control", 14);
  await page.keyboard.down("KeyA");
  await page.keyboard.down("Space");
  await page.waitForFunction(() => String(window.__GW_DEBUG__?.boss ?? "none") !== "none" || (window.__GW_DEBUG__?.score ?? 0) >= 36, null, {
    timeout: 10000,
  }).catch(() => null);
  const state = await debug(page);
  console.log("crowd-14", state.score, state.boss, state.playerY);
  await snap(page, "crowd-control-05-reactor.jpg");
  await page.waitForTimeout(600);
  await snap(page, "crowd-control-06-reactor-late.jpg");
  await page.keyboard.up("Space");
  await page.keyboard.up("KeyA");
});

await browser.close();

const picks = {
  "neon-drift": "neon-drift-02-hairpin-drift.jpg",
  "velocity-run": "velocity-run-01-transit.jpg",
  "swarm-protocol": "swarm-protocol-04-powered.jpg",
  "sky-stack": "sky-stack-01-tower.jpg",
  "knockout-circuit": "knockout-circuit-02-signal.jpg",
  "pocket-striker": "pocket-striker-01-arcade-aim.jpg",
  "territory-rush": "territory-rush-02-fill.jpg",
  "crowd-control": "crowd-control-05-reactor.jpg",
};

if (process.env.APPLY_PICKS === "1") {
  const art = join(root, "apps/web/public/art");
  for (const [slug, file] of Object.entries(picks)) {
    const src = join(out, file);
    copyFileSync(src, join(art, `${slug}-backdrop.jpg`));
    copyFileSync(src, join(art, `${slug}-hero.jpg`));
    console.log("applied", slug, file);
  }
}

console.log("candidates", out);
