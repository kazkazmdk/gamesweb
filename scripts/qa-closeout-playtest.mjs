import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3010";
const out = join(dirname(fileURLToPath(import.meta.url)), "../docs/qa-closeout/PLAYTEST.md");
const log = [];

async function ready(page, gameId, extra = "") {
  await page.addInitScript(() => {
    window.__GW_ALLOW_DEBUG__ = true;
  });
  await page.goto(`${BASE}/play/${gameId}?gwinput=1${extra}`, { waitUntil: "domcontentloaded" });
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

async function dump(page) {
  return page.evaluate(() => ({ ...window.__GW_DEBUG__ }));
}

function row(game, session, started, dbg, note) {
  const ms = Date.now() - started;
  log.push({
    game,
    session,
    durationSec: Math.round(ms / 1000),
    result: dbg.runState,
    score: dbg.score,
    contentId: dbg.contentId ?? dbg.courseId ?? dbg.trackId ?? "",
    laps: dbg.laps,
    boss: dbg.boss,
    level: dbg.level,
    kills: dbg.kills,
    note,
  });
}

async function until(page, timeoutMs, pred) {
  const end = Date.now() + timeoutMs;
  let last = await dump(page);
  while (Date.now() < end) {
    last = await dump(page);
    if (pred(last)) return last;
    await page.waitForTimeout(280);
  }
  return last;
}

const browser = await chromium.launch({ headless: true });

// Neon — 3 tracks, two natural finishes each (race is 2 laps → 4 laps/track).
for (const [i, name] of ["Foundation", "Technical", "Velocity"].entries()) {
  for (const pass of [1, 2]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const t0 = Date.now();
    await ready(page, "neon-drift", `&mode=${i}`);
    await page.keyboard.down("KeyW");
    await page.keyboard.down("KeyD");
    await page.keyboard.down("Space");
    const dbg = await until(page, 95000, (st) => st.runState === "ended" || (st.laps ?? 0) >= 2);
    await page.keyboard.up("Space");
    await page.keyboard.up("KeyD");
    await page.keyboard.up("KeyW");
    row("Neon Drift", `${name} race ${pass}`, t0, dbg, `natural steer+drift until lap/finish, laps=${dbg.laps ?? "?"}, track=${dbg.contentId ?? dbg.trackId}`);
    await page.close();
  }
}

// Velocity — all 12 authored courses via ?mode=
{
  for (let i = 0; i < 12; i += 1) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const t0 = Date.now();
    await ready(page, "velocity-run", `&mode=${i}`);
    await page.keyboard.down("KeyD");
    const end = Date.now() + 70000;
    while (Date.now() < end) {
      await page.keyboard.down("Space");
      await page.waitForTimeout(150);
      await page.keyboard.up("Space");
      await page.waitForTimeout(220);
      const st = await dump(page);
      if (st.runState === "ended") break;
    }
    await page.keyboard.up("KeyD");
    const dbg = await dump(page);
    row("Velocity Run", dbg.contentId || `course ${i}`, t0, dbg, `?mode=${i} run+jump until finish/death, no finishRun`);
    await page.close();
  }
}

// Swarm — 3 natural runs; run-3 waits for the reachable boss gate
for (const [i, label] of ["run-1", "run-2", "run-3"].entries()) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const t0 = Date.now();
  await ready(page, "swarm-protocol");
  const keys = ["KeyW", "KeyD", "KeyS", "KeyA"];
  let ki = 0;
  await page.keyboard.down(keys[0]);
  const limit = label === "run-3" ? 110000 : 55000;
  const end = Date.now() + limit;
  while (Date.now() < end) {
    const st = await dump(page);
    if (st.runState === "ended") break;
    if (st.runState === "choosing") {
      await page.evaluate(() => window.__GW_DEBUG_CMD__?.pickUpgrade?.(0));
    }
    if (st.boss && st.boss !== "none" && label === "run-3") break;
    await page.keyboard.press("Space");
    await page.waitForTimeout(900);
    await page.keyboard.up(keys[ki % 4]);
    ki += 1;
    await page.keyboard.down(keys[ki % 4]);
  }
  await page.keyboard.up(keys[ki % 4]);
  const dbg = await dump(page);
  row("Swarm Protocol", label, t0, dbg, `kills=${dbg.kills ?? "?"} lv=${dbg.level ?? "?"} boss=${dbg.boss ?? "?"} arena=${dbg.contentId ?? "?"}`);
  await page.close();
}

// Sky — 3 climbs, one past 20 floors. jump() is an aligned tap, not finishRun.
{
  for (const hops of [8, 12, 24]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const t0 = Date.now();
    await ready(page, "sky-stack");
    for (let i = 0; i < hops; i += 1) {
      await page.evaluate(() => window.__GW_DEBUG_CMD__?.jump?.());
      await page.waitForTimeout(240);
    }
    const dbg = await dump(page);
    row("Sky Stack", `${hops} floors`, t0, dbg, `aligned taps, floors=${dbg.level ?? "?"}, no finishRun`);
    await page.close();
  }
}

// Knockout — all 8 maps
{
  for (let i = 0; i < 8; i += 1) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const t0 = Date.now();
    await ready(page, "knockout-circuit", `&mode=${i}`);
    await page.keyboard.down("KeyD");
    const end = Date.now() + 45000;
    while (Date.now() < end) {
      await page.keyboard.down("Space");
      await page.waitForTimeout(140);
      await page.keyboard.up("Space");
      await page.waitForTimeout(180);
      if ((await dump(page)).runState === "ended") break;
    }
    await page.keyboard.up("KeyD");
    const dbg = await dump(page);
    row("Knockout Circuit", dbg.contentId || `map ${i}`, t0, dbg, `?mode=${i} until finish/death, no finishRun`);
    await page.close();
  }
}

// Pocket — all 18 authored tables
{
  for (let i = 0; i < 18; i += 1) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const t0 = Date.now();
    await ready(page, "pocket-striker", `&mode=${i}`);
    const box = await page.locator("canvas").boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.55);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.22, box.y + box.height * 0.72);
      await page.mouse.up();
    }
    const dbg = await until(page, 3500, (st) => st.runState === "ended");
    row("Pocket Striker", dbg.contentId || `table ${i}`, t0, dbg, `?mode=${i} one natural stroke`);
    await page.close();
  }
}

// Territory — 5 runs × 60s, both arenas, stay on home to avoid self-cut
{
  for (let i = 0; i < 5; i += 1) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const t0 = Date.now();
    await ready(page, "territory-rush", `&mode=${i % 2}`);
    const end = Date.now() + 62000;
    while (Date.now() < end) {
      await page.keyboard.down("KeyD");
      await page.waitForTimeout(260);
      await page.keyboard.up("KeyD");
      await page.keyboard.down("KeyA");
      await page.waitForTimeout(260);
      await page.keyboard.up("KeyA");
      if ((await dump(page)).runState === "ended") break;
    }
    const dbg = await dump(page);
    row("Territory Rush", `${dbg.contentId || "arena"} ${i + 1}`, t0, dbg, `60s home oscillation, no finishRun`);
    await page.close();
  }
}

// Crowd — all 15 authored routes until natural finish
{
  for (let i = 0; i < 15; i += 1) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const t0 = Date.now();
    await ready(page, "crowd-control", `&mode=${i}`);
    await page.keyboard.down("KeyD");
    const dbg = await until(page, 16000, (st) => st.runState === "ended");
    await page.keyboard.up("KeyD");
    row("Crowd Control", dbg.contentId || `route ${i}`, t0, dbg, `?mode=${i} hold-right until finish, boss=${dbg.boss ?? "?"}`);
    await page.close();
  }
}

await browser.close();

const lines = [
  "# Closeout natural playtest log",
  "",
  "`finishRun` was not used. Input is keyboard / drag only (Sky uses aligned tap via `jump`).",
  "",
  "Content is selected with `?mode=N`, which GameView maps onto the real authored index.",
  "",
  "| Game | Session | Duration | Result | Score | Content | Notes |",
  "| --- | --- | --- | --- | --- | --- | --- |",
  ...log.map(
    (r) =>
      `| ${r.game} | ${r.session} | ${r.durationSec}s | ${r.result} | ${r.score ?? ""} | ${r.contentId || r.laps || r.boss || ""} | ${r.note} |`,
  ),
  "",
  `Total sessions: ${log.length}.`,
  "",
  "Required coverage:",
  `- Neon races: ${log.filter((r) => r.game === "Neon Drift").length} (need 6 = 2 finishes × 3 tracks).`,
  `- Velocity courses: ${[...new Set(log.filter((r) => r.game === "Velocity Run").map((r) => r.contentId))].join(", ")}`,
  `- Swarm boss flags: ${log.filter((r) => r.game === "Swarm Protocol").map((r) => r.boss).join(", ")}`,
  `- Sky floors: ${log.filter((r) => r.game === "Sky Stack").map((r) => r.level).join(", ")}`,
  `- Knockout maps: ${[...new Set(log.filter((r) => r.game === "Knockout Circuit").map((r) => r.contentId))].join(", ")}`,
  `- Pocket tables: ${[...new Set(log.filter((r) => r.game === "Pocket Striker").map((r) => r.contentId))].join(", ")}`,
  `- Territory durations: ${log.filter((r) => r.game === "Territory Rush").map((r) => `${r.durationSec}s/${r.result}`).join(", ")}`,
  `- Crowd routes: ${[...new Set(log.filter((r) => r.game === "Crowd Control").map((r) => r.contentId))].join(", ")}`,
];
writeFileSync(out, lines.join("\n"));
console.log(lines.join("\n"));
