import { expect, test, type Page } from "@playwright/test";

const GAMES = [
  "neon-drift",
  "velocity-run",
  "swarm-protocol",
  "sky-stack",
  "knockout-circuit",
  "pocket-striker",
  "territory-rush",
  "crowd-control",
] as const;

type GwDebug = {
  gameId: string;
  ready: boolean;
  runState: string;
  playerX: number;
  playerY: number;
  score: number;
  paused: boolean;
  timeMs?: number;
  tick?: number;
};

type GwCmd = {
  finishRun?: () => void;
};

const BENIGN = [/Download the React DevTools/i, /\[Phaser\]/i, /Failed to load resource/i];

async function debugOf(page: Page): Promise<GwDebug | null> {
  return page.evaluate(() => (window as unknown as { __GW_DEBUG__?: GwDebug }).__GW_DEBUG__ ?? null);
}

async function waitReady(page: Page, gameId: string) {
  await page.addInitScript(() => {
    (window as Window & { __GW_ALLOW_DEBUG__?: boolean }).__GW_ALLOW_DEBUG__ = true;
  });
  await page.goto(`/play/${gameId}`);
  await page.locator("canvas").waitFor({ timeout: 20_000 });
  await expect
    .poll(async () => {
      const d = await debugOf(page);
      return d?.ready && d.gameId === gameId ? d.gameId : null;
    }, { timeout: 20_000 })
    .toBe(gameId);
}

function attachConsoleGuard(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return () => {
    const real = errors.filter((e) => !BENIGN.some((r) => r.test(e)));
    expect(real, real.join("\n")).toEqual([]);
  };
}

for (const gameId of GAMES) {
  test(`${gameId} pause freezes simulation and resume continues`, async ({ page }) => {
    test.setTimeout(60_000);
    const done = attachConsoleGuard(page);
    await waitReady(page, gameId);
    const before = await debugOf(page);
    expect(before?.paused).toBeFalsy();
    const moving = { x: before?.playerX ?? 0, y: before?.playerY ?? 0, score: before?.score ?? 0, time: before?.timeMs ?? 0, tick: before?.tick ?? 0 };
    await page.waitForTimeout(800);
    const mid = await debugOf(page);
    const delta =
      Math.abs((mid?.playerX ?? 0) - moving.x) +
      Math.abs((mid?.playerY ?? 0) - moving.y) +
      Math.abs((mid?.score ?? 0) - moving.score) +
      Math.abs((mid?.timeMs ?? 0) - moving.time) +
      Math.abs((mid?.tick ?? 0) - moving.tick);
    expect(delta, `${gameId} should move before pause`).toBeGreaterThan(0);

    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
    const frozen = await debugOf(page);
    expect(frozen?.paused).toBe(true);
    await page.waitForTimeout(1200);
    const still = await debugOf(page);
    expect(still?.paused).toBe(true);
    expect(still?.tick ?? 0).toBe(frozen?.tick ?? 0);

    await page.getByRole("button", { name: "Resume" }).click();
    await expect(page.getByRole("button", { name: "Resume" })).toHaveCount(0);
    await expect.poll(async () => (await debugOf(page))?.paused).toBe(false);
    const resumed = await debugOf(page);
    await page.waitForTimeout(700);
    const after = await debugOf(page);
    const resumeDelta =
      Math.abs((after?.playerX ?? 0) - (resumed?.playerX ?? 0)) +
      Math.abs((after?.score ?? 0) - (resumed?.score ?? 0)) +
      Math.abs((after?.timeMs ?? 0) - (resumed?.timeMs ?? 0)) +
      Math.abs((after?.tick ?? 0) - (resumed?.tick ?? 0));
    expect(resumeDelta, `${gameId} should move after resume`).toBeGreaterThan(0);
    done();
  });

  test(`${gameId} retry starts a fresh run`, async ({ page }) => {
    test.setTimeout(60_000);
    const done = attachConsoleGuard(page);
    await waitReady(page, gameId);
    await page.evaluate(() => {
      (window as unknown as { __GW_DEBUG_CMD__?: GwCmd }).__GW_DEBUG_CMD__?.finishRun?.();
    });
    const overlay = page.getByText("R or Space retries");
    await expect(overlay).toBeVisible({ timeout: 8_000 });
    const phasers = await page.evaluate(() => document.querySelectorAll("canvas").length);
    await page.waitForTimeout(900);
    await page.keyboard.press("Space");
    await expect(overlay).toBeHidden({ timeout: 5_000 });
    await expect.poll(async () => (await debugOf(page))?.runState).toBe("playing");
    const after = await debugOf(page);
    expect(after?.paused).toBeFalsy();
    const laterPhasers = await page.evaluate(() => document.querySelectorAll("canvas").length);
    expect(laterPhasers).toBe(phasers);
    done();
  });
}
