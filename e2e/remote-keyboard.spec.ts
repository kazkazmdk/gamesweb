import { expect, test, type Page } from "@playwright/test";

type GwDebug = {
  gameId: string;
  ready: boolean;
  playerX: number;
  playerY: number;
  playerAngle?: number;
  score: number;
  paused: boolean;
  speed?: number;
  throttle?: number;
  tick?: number;
  ended?: boolean;
  headingError?: number;
  lateral?: number;
  lookError?: number;
};

async function debugOf(page: Page): Promise<GwDebug | null> {
  return page.evaluate(() => (window as unknown as { __GW_DEBUG__?: GwDebug }).__GW_DEBUG__ ?? null);
}

async function waitReady(page: Page, gameId: string) {
  await page.addInitScript(() => {
    (window as Window & { __GW_ALLOW_DEBUG__?: boolean }).__GW_ALLOW_DEBUG__ = true;
  });
  await page.goto(`/play/${gameId}?gwinput=1`);
  await page.locator("canvas").waitFor({ timeout: 25_000 });
  await expect
    .poll(async () => {
      const d = await debugOf(page);
      return d?.ready && d.gameId === gameId ? d.gameId : null;
    }, { timeout: 25_000 })
    .toBe(gameId);
  await page.locator("canvas").click({ position: { x: 420, y: 280 } });
}

test("remote neon keyboard drive", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await waitReady(page, "neon-drift");
  const before = await debugOf(page);
  await page.keyboard.down("KeyW");
  await expect
    .poll(async () => (await debugOf(page))?.throttle ?? 0, { timeout: 8_000 })
    .toBeGreaterThan(0.5);
  await expect
    .poll(async () => (await debugOf(page))?.speed ?? 0, { timeout: 8_000 })
    .toBeGreaterThan((before?.speed ?? 0) + 20);
  await page.keyboard.down("KeyD");
  await expect
    .poll(async () => Math.abs(((await debugOf(page))?.playerAngle ?? 0) - (before?.playerAngle ?? 0)), { timeout: 8_000 })
    .toBeGreaterThan(0.05);
  await page.keyboard.up("KeyD");
  await page.keyboard.down("KeyA");
  await page.waitForTimeout(400);
  await page.keyboard.up("KeyA");
  await page.keyboard.down("Space");
  await page.waitForTimeout(300);
  await page.keyboard.up("Space");
  await page.keyboard.up("KeyW");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.getByRole("button", { name: "Resume" })).toHaveCount(0);
  await page.keyboard.press("r");
  await expect.poll(async () => (await debugOf(page))?.paused).toBe(false);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("remote neon 30s keyboard session", async ({ page }) => {
  test.setTimeout(90_000);
  await waitReady(page, "neon-drift");
  await page.keyboard.down("KeyW");
  const startScore = (await debugOf(page))?.score ?? 0;
  const start = Date.now();
  while (Date.now() - start < 30_000) {
    const d = await debugOf(page);
    expect(d?.ended, "crashed during 30s session").toBeFalsy();
    const cmd = d?.lookError ?? d?.headingError ?? 0;
    if (cmd > 0.06) {
      await page.keyboard.up("KeyD");
      await page.keyboard.down("KeyA");
    } else if (cmd < -0.06) {
      await page.keyboard.up("KeyA");
      await page.keyboard.down("KeyD");
    } else {
      await page.keyboard.up("KeyA");
      await page.keyboard.up("KeyD");
    }
    if (Math.abs(cmd) > 0.5) await page.keyboard.up("KeyW");
    else await page.keyboard.down("KeyW");
    if (Math.abs(cmd) > 0.28 && (d?.speed ?? 0) > 120) {
      await page.keyboard.down("Space");
    } else {
      await page.keyboard.up("Space");
    }
    await page.waitForTimeout(16);
  }
  await page.keyboard.up("Space");
  await page.keyboard.up("KeyA");
  await page.keyboard.up("KeyD");
  await page.keyboard.up("KeyW");
  const end = await debugOf(page);
  expect(end?.ended).toBeFalsy();
  expect(end?.score ?? 0).toBeGreaterThan(startScore);
});

test("remote velocity keyboard", async ({ page }) => {
  await waitReady(page, "velocity-run");
  const before = await debugOf(page);
  await page.keyboard.down("KeyD");
  await expect
    .poll(async () => (await debugOf(page))?.playerX ?? before!.playerX)
    .toBeGreaterThan(before!.playerX);
  await page.keyboard.down("Space");
  await expect
    .poll(async () => (await debugOf(page))?.playerY ?? before!.playerY)
    .not.toBe(before!.playerY);
  await page.keyboard.up("Space");
  await page.keyboard.up("KeyD");
});

test("remote swarm keyboard", async ({ page }) => {
  await waitReady(page, "swarm-protocol");
  const before = await debugOf(page);
  await page.keyboard.down("KeyW");
  await expect
    .poll(async () => {
      const d = await debugOf(page);
      if (!d || !before) return 0;
      return Math.abs(d.playerY - before.playerY) + Math.abs(d.playerX - before.playerX);
    })
    .toBeGreaterThan(4);
  await page.keyboard.up("KeyW");
});
