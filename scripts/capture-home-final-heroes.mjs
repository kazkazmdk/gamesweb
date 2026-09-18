import { chromium } from "@playwright/test";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3010";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "docs/qa-home-final/candidates");
mkdirSync(out, { recursive: true });

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

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
  await page.waitForTimeout(50);
}

async function debug(page) {
  return page.evaluate(() => ({ ...window.__GW_DEBUG__ }));
}

async function snapFull(page, name) {
  await hideChrome(page);
  const path = join(out, name);
  await page.locator("canvas").first().screenshot({ path, type: "jpeg", quality: 90 });
  const st = await debug(page);
  console.log("wrote", name, st.playerX, st.playerY, st.kills, st.level, st.boss);
  return path;
}

async function snapSubject(page, name, opts = {}) {
  await hideChrome(page);
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (!box) return snapFull(page, name);
  const st = await debug(page);
  const frac = opts.frac ?? 0.46;
  const cw = Math.round(box.width * frac);
  const ch = Math.round(box.height * frac);
  const px =
    st.playerX != null && st.playerX < 640
      ? clamp(st.playerX, 24, box.width - 24)
      : box.width * (opts.ax ?? 0.38);
  const py = box.height * (opts.ay ?? 0.58);
  const clip = {
    x: clamp(px - cw * (opts.tx ?? 0.28), 0, Math.max(0, box.width - cw)),
    y: clamp(py - ch * (opts.ty ?? 0.62), 0, Math.max(0, box.height - ch)),
    width: cw,
    height: ch,
  };
  const path = join(out, name);
  await canvas.screenshot({ path, type: "jpeg", quality: 90, clip });
  console.log("wrote", name, "clip", clip, st.playerX, st.playerY, st.kills, st.level, st.boss);
  return path;
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
  await ready(page, "velocity-run", 4);
  await page.keyboard.down("KeyD");
  await page.waitForFunction(() => (window.__GW_DEBUG__?.playerX ?? 0) > 260, null, { timeout: 8000 }).catch(() => null);
  await page.keyboard.down("Space");
  await page.waitForTimeout(170);
  await snapFull(page, "velocity-run-01-full.jpg");
  await snapSubject(page, "velocity-run-01.jpg", { ay: 0.52, ty: 0.58 });
  await page.keyboard.up("Space");
  await page.waitForTimeout(90);
  await snapSubject(page, "velocity-run-02.jpg", { ay: 0.62, ty: 0.7 });
  await page.keyboard.up("KeyD");
});

await session(async (page) => {
  await ready(page, "velocity-run", 1);
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(520);
  await page.keyboard.down("Space");
  await page.waitForTimeout(200);
  await snapSubject(page, "velocity-run-03.jpg", { ay: 0.5, ty: 0.55, frac: 0.5 });
  await page.keyboard.up("Space");
  await page.waitForTimeout(240);
  await page.keyboard.down("Space");
  await page.waitForTimeout(160);
  await snapSubject(page, "velocity-run-04.jpg", { ay: 0.48, ty: 0.52, frac: 0.44 });
  await page.keyboard.up("Space");
  await page.keyboard.up("KeyD");
});

await session(async (page) => {
  await ready(page, "velocity-run", 8);
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(780);
  await page.keyboard.down("Space");
  await page.waitForTimeout(180);
  await snapFull(page, "velocity-run-05-full.jpg");
  await snapSubject(page, "velocity-run-05.jpg", { ay: 0.5, ty: 0.55, frac: 0.48 });
  await page.keyboard.up("Space");
  await page.keyboard.up("KeyD");
});

await session(async (page) => {
  await ready(page, "velocity-run", 6);
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(640);
  await page.keyboard.down("Space");
  await page.waitForTimeout(150);
  await snapSubject(page, "velocity-run-06.jpg", { ay: 0.54, ty: 0.6, frac: 0.42 });
  await page.keyboard.up("Space");
  await page.keyboard.up("KeyD");
});

await session(async (page) => {
  await ready(page, "swarm-protocol");
  for (let i = 0; i < 4; i += 1) {
    await page.evaluate(() => window.__GW_DEBUG_CMD__?.grantXp?.(90));
    await page.waitForTimeout(40);
    const state = await page.evaluate(() => window.__GW_DEBUG__?.runState);
    if (state === "choosing") {
      await page.evaluate((pick) => window.__GW_DEBUG_CMD__?.pickUpgrade?.(pick), i % 3);
      await page.waitForTimeout(60);
    }
  }
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(2800);
  await page.keyboard.up("KeyD");
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(2200);
  await snapFull(page, "swarm-protocol-01-full.jpg");
  await snapSubject(page, "swarm-protocol-01.jpg", { ax: 0.5, ay: 0.5, tx: 0.5, ty: 0.5, frac: 0.5 });
  await page.waitForTimeout(1600);
  await snapSubject(page, "swarm-protocol-02.jpg", { ax: 0.5, ay: 0.5, tx: 0.5, ty: 0.5, frac: 0.42 });
  await page.keyboard.up("KeyW");
  await page.keyboard.down("KeyA");
  await page.waitForTimeout(1400);
  await snapSubject(page, "swarm-protocol-03.jpg", { ax: 0.5, ay: 0.5, tx: 0.48, ty: 0.48, frac: 0.46 });
  await page.keyboard.up("KeyA");
});

await session(async (page) => {
  await ready(page, "swarm-protocol");
  for (let i = 0; i < 5; i += 1) {
    await page.evaluate(() => window.__GW_DEBUG_CMD__?.grantXp?.(70));
    await page.waitForTimeout(30);
    const state = await page.evaluate(() => window.__GW_DEBUG__?.runState);
    if (state === "choosing") {
      await page.evaluate((pick) => window.__GW_DEBUG_CMD__?.pickUpgrade?.(pick), 0);
      await page.waitForTimeout(50);
    }
  }
  await page.keyboard.down("KeyS");
  await page.waitForTimeout(3500);
  await snapFull(page, "swarm-protocol-04-full.jpg");
  await snapSubject(page, "swarm-protocol-04.jpg", { ax: 0.5, ay: 0.5, tx: 0.5, ty: 0.5, frac: 0.48 });
  await page.waitForTimeout(1800);
  await snapSubject(page, "swarm-protocol-05.jpg", { ax: 0.5, ay: 0.5, tx: 0.5, ty: 0.5, frac: 0.4 });
  await page.keyboard.up("KeyS");
});

await session(async (page) => {
  await ready(page, "neon-drift", 1);
  await page.evaluate(() => window.__GW_DEBUG_CMD__?.setDrive?.(1, 0.82));
  await page.waitForTimeout(900);
  await snapSubject(page, "neon-drift-01.jpg", { ax: 0.48, ay: 0.4, tx: 0.5, ty: 0.45, frac: 0.52 });
  await page.waitForTimeout(400);
  await snapSubject(page, "neon-drift-02.jpg", { ax: 0.5, ay: 0.42, tx: 0.5, ty: 0.48, frac: 0.44 });
});

await session(async (page) => {
  await ready(page, "knockout-circuit", 4);
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(700);
  await page.keyboard.down("Space");
  await page.waitForTimeout(180);
  await snapSubject(page, "knockout-circuit-01.jpg", { ay: 0.5, ty: 0.52, frac: 0.5 });
  await page.keyboard.up("Space");
  await page.keyboard.up("KeyD");
});

await browser.close();
console.log("candidates", out);

if (process.env.APPLY_PICKS === "1") {
  const art = join(root, "apps/web/public/art");
  const picks = {
    "velocity-run": process.env.VELOCITY_PICK ?? "velocity-run-01.jpg",
    "swarm-protocol": process.env.SWARM_PICK ?? "swarm-protocol-02.jpg",
  };
  for (const [slug, file] of Object.entries(picks)) {
    copyFileSync(join(out, file), join(art, `${slug}-backdrop.jpg`));
    copyFileSync(join(out, file), join(art, `${slug}-hero.jpg`));
    console.log("applied", slug, file);
  }
}
