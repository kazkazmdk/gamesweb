import { chromium } from "@playwright/test";

const BASE =
  process.env.BASE_URL ??
  "https://gamesweb-git-cursor-infra-preview-c08e-loan-s-projects2z.vercel.app";

function dump(label, data) {
  console.log("\n==== " + label + " ====");
  console.log(JSON.stringify(data, null, 2));
}

async function inspect(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const paused = Array.from(document.querySelectorAll("p,button")).some((el) =>
      /Paused|Resume/.test(el.textContent || ""),
    );
    const loading = Array.from(document.querySelectorAll("p")).some((el) =>
      /Hold the slide|The world did not boot/.test(el.textContent || ""),
    );
    const overlay = Array.from(document.querySelectorAll("div")).filter((el) => {
      const s = getComputedStyle(el);
      return s.position === "absolute" && Number(s.zIndex) >= 10 && s.pointerEvents !== "none";
    }).slice(0, 8).map((el) => ({
      z: getComputedStyle(el).zIndex,
      pe: getComputedStyle(el).pointerEvents,
      text: (el.innerText || "").slice(0, 40),
    }));
    const kb = window.__GW_DEBUG__ ?? null;
    return {
      href: location.href,
      title: document.title,
      hidden: document.hidden,
      hasFocus: document.hasFocus(),
      active: document.activeElement?.tagName + (document.activeElement?.getAttribute?.("aria-label") || document.activeElement?.textContent?.slice(0, 24) || ""),
      canvas: canvas
        ? {
            w: canvas.width,
            h: canvas.height,
            cw: canvas.clientWidth,
            ch: canvas.clientHeight,
            tabIndex: canvas.tabIndex,
          }
        : null,
      pausedUi: paused,
      loadingUi: loading,
      debug: kb,
      overlaySample: overlay.slice(0, 5),
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
dump("home", {
  title: await page.title(),
  play: await page.getByRole("link", { name: /Play/i }).first().isVisible(),
});

await page.getByRole("link", { name: /^Play$/i }).first().click();
await page.locator("canvas").waitFor({ timeout: 25000 });
await page.waitForTimeout(2000);
dump("after PLAY click", await inspect(page));

await page.locator("canvas").click({ position: { x: 420, y: 280 } });
await page.waitForTimeout(400);
dump("after canvas click", await inspect(page));

const before = await inspect(page);
await page.keyboard.down("KeyW");
await page.waitForTimeout(1200);
const afterW = await inspect(page);
await page.keyboard.down("KeyD");
await page.waitForTimeout(1200);
const afterWD = await inspect(page);
await page.keyboard.up("KeyD");
await page.keyboard.up("KeyW");

dump("W response", {
  before: { x: before.debug?.playerX, y: before.debug?.playerY, ang: before.debug?.playerAngle, speed: before.debug?.speed, throttle: before.debug?.throttle, paused: before.debug?.paused, tick: before.debug?.tick },
  afterW: { x: afterW.debug?.playerX, y: afterW.debug?.playerY, ang: afterW.debug?.playerAngle, speed: afterW.debug?.speed, throttle: afterW.debug?.throttle, paused: afterW.debug?.paused, tick: afterW.debug?.tick },
  afterWD: { x: afterWD.debug?.playerX, y: afterWD.debug?.playerY, ang: afterWD.debug?.playerAngle, speed: afterWD.debug?.speed, throttle: afterWD.debug?.throttle, paused: afterWD.debug?.paused, tick: afterWD.debug?.tick },
});

await page.keyboard.press("Escape");
await page.waitForTimeout(300);
dump("escape", await inspect(page));
const resume = page.getByRole("button", { name: /Resume/i });
if (await resume.isVisible()) await resume.click();
await page.waitForTimeout(300);
dump("resume", await inspect(page));

await page.goto(BASE + "/play/neon-drift", { waitUntil: "domcontentloaded" });
await page.locator("canvas").waitFor({ timeout: 25000 });
await page.waitForTimeout(1500);
await page.locator("canvas").click({ position: { x: 420, y: 280 } });
const d0 = await inspect(page);
await page.keyboard.down("KeyW");
await page.waitForTimeout(1200);
const d1 = await inspect(page);
await page.keyboard.up("KeyW");
dump("direct /play/neon-drift W", {
  before: { x: d0.debug?.playerX, speed: d0.debug?.speed, throttle: d0.debug?.throttle, paused: d0.debug?.paused, tick: d0.debug?.tick, ready: d0.debug?.ready },
  after: { x: d1.debug?.playerX, speed: d1.debug?.speed, throttle: d1.debug?.throttle, paused: d1.debug?.paused, tick: d1.debug?.tick },
});

dump("errors", errors);
await browser.close();
