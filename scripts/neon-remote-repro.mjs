import { chromium } from "@playwright/test";

const BASE =
  process.env.BASE_URL ??
  "https://gamesweb-git-cursor-infra-preview-c08e-loan-s-projects2z.vercel.app";

async function inspect(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const paused = Array.from(document.querySelectorAll("p,button")).some((el) =>
      /Paused|Resume/.test(el.textContent || ""),
    );
    const results = Array.from(document.querySelectorAll("p,button")).some((el) =>
      /Retry|CRASH|FINISH/i.test(el.textContent || ""),
    );
    return {
      href: location.href,
      hasFocus: document.hasFocus(),
      active: document.activeElement?.tagName,
      canvas: canvas ? { w: canvas.width, h: canvas.height, tab: canvas.tabIndex } : null,
      pausedUi: paused,
      resultsUi: results,
      debug: window.__GW_DEBUG__ ?? null,
    };
  });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => {
  window.__GW_ALLOW_DEBUG__ = true;
});
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror:" + e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push("console:" + m.text());
});

console.log("BASE", BASE);

await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.getByRole("link", { name: /^Play$/i }).first().click();
await page.locator("canvas").waitFor({ timeout: 25000 });
await page.waitForFunction(() => window.__GW_DEBUG__?.ready === true, null, { timeout: 20000 });
await page.locator("canvas").click({ position: { x: 420, y: 280 } });

const t0 = await inspect(page);
await page.keyboard.down("KeyW");
await page.waitForTimeout(1500);
const afterW = await inspect(page);
await page.keyboard.down("KeyD");
await page.waitForTimeout(1200);
const afterWD = await inspect(page);
await page.keyboard.up("KeyD");
await page.keyboard.down("KeyA");
await page.waitForTimeout(1200);
const afterWA = await inspect(page);
await page.keyboard.up("KeyA");
await page.keyboard.down("Space");
await page.waitForTimeout(500);
const afterSpace = await inspect(page);
await page.keyboard.up("Space");

console.log("W throttle/speed", t0.debug?.throttle, afterW.debug?.throttle, t0.debug?.speed, afterW.debug?.speed);
console.log("W+D angle", t0.debug?.playerAngle, afterWD.debug?.playerAngle);
console.log("W+A angle", afterWA.debug?.playerAngle);
console.log("Space", afterSpace.debug?.speed, afterSpace.debug?.score, afterSpace.debug?.ended);

await page.keyboard.up("Space");
await page.keyboard.up("KeyW");
await page.keyboard.up("KeyA");
await page.keyboard.up("KeyD");
if ((await inspect(page)).debug?.ended) {
  await page.keyboard.press("r");
  await page.waitForFunction(() => window.__GW_DEBUG__?.runState === "playing" && !window.__GW_DEBUG__?.ended, null, {
    timeout: 8000,
  });
  await page.locator("canvas").click({ position: { x: 420, y: 280 }, force: true });
  await page.waitForTimeout(200);
  await page.keyboard.down("KeyW");
}

const startScore = (await inspect(page)).debug?.score ?? 0;
const start = Date.now();
let lastSteer = "D";
while (Date.now() - start < 30000) {
  const now = await inspect(page);
  if (now.debug?.ended) {
    console.log("ended during 30s", now.debug?.score, now.debug?.ended, now.resultsUi);
    break;
  }
  if (lastSteer === "D") {
    await page.keyboard.up("KeyA");
    await page.keyboard.down("KeyD");
    lastSteer = "A";
  } else {
    await page.keyboard.up("KeyD");
    await page.keyboard.down("KeyA");
    lastSteer = "D";
  }
  await page.waitForTimeout(800);
}
await page.keyboard.up("Space");
await page.keyboard.up("KeyA");
await page.keyboard.up("KeyD");
await page.keyboard.up("KeyW");
const end = await inspect(page);
console.log("30s", {
  elapsed: Date.now() - start,
  startScore,
  endScore: end.debug?.score,
  speed: end.debug?.speed,
  paused: end.debug?.paused,
  ended: end.debug?.ended,
  tick: end.debug?.tick,
  resultsUi: end.resultsUi,
});

await page.keyboard.press("Escape");
await page.waitForTimeout(400);
const paused = await inspect(page);
console.log("escape", { pausedUi: paused.pausedUi, debugPaused: paused.debug?.paused, resultsUi: paused.resultsUi });
const resume = page.getByRole("button", { name: /Resume/i });
if (await resume.isVisible()) await resume.click();
await page.waitForTimeout(300);

await page.keyboard.press("r");
await page.waitForTimeout(800);
const afterR = await inspect(page);
console.log("after R", afterR.debug?.score, afterR.debug?.runState, afterR.debug?.paused, afterR.resultsUi);

await page.goto(BASE + "/play/neon-drift", { waitUntil: "domcontentloaded" });
await page.locator("canvas").waitFor({ timeout: 25000 });
await page.waitForFunction(() => window.__GW_DEBUG__?.ready === true, null, { timeout: 20000 });
await page.locator("canvas").click({ position: { x: 420, y: 280 }, force: true });
const d0 = await inspect(page);
await page.keyboard.down("KeyW");
await page.waitForTimeout(1200);
const d1 = await inspect(page);
await page.keyboard.up("KeyW");
console.log("direct W", {
  overlay: d0.resultsUi,
  before: d0.debug?.throttle,
  after: d1.debug?.throttle,
  speed0: d0.debug?.speed,
  speed1: d1.debug?.speed,
});

console.log("errors", errors);
if (errors.length) process.exitCode = 1;
await browser.close();
