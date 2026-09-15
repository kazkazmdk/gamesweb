import { expect, test, type Page } from "@playwright/test";

type GwDebug = {
  gameId: string;
  ready: boolean;
  runState: string;
  playerX: number;
  playerY: number;
  playerAngle?: number;
  score: number;
  paused: boolean;
  timeMs?: number;
  kills?: number;
  level?: number;
};

async function debugOf(page: Page): Promise<GwDebug | null> {
  return page.evaluate(() => (window as unknown as { __GW_DEBUG__?: GwDebug }).__GW_DEBUG__ ?? null);
}

async function waitReady(page: Page, gameId: string) {
  await page.addInitScript(() => {
    (window as Window & { __GW_ALLOW_DEBUG__?: boolean }).__GW_ALLOW_DEBUG__ = true;
  });
  await page.goto(`/play/${gameId}`);
  await page.locator("canvas").waitFor({ timeout: 20_000 });
  await page.locator("canvas").click({ position: { x: 120, y: 120 }, timeout: 20_000 });
  await expect
    .poll(async () => {
      const d = await debugOf(page);
      return d?.ready && d.gameId === gameId ? d.gameId : null;
    }, { timeout: 20_000 })
    .toBe(gameId);
}

test("neon drift steers, scores, pauses, and retries", async ({ page }) => {
  await waitReady(page, "neon-drift");
  const before = await debugOf(page);
  expect(before?.runState).toBe("playing");
  await page.keyboard.down("KeyW");
  await page.keyboard.down("KeyD");
  await page.evaluate(() => {
    (window as unknown as { __GW_DEBUG_CMD__?: { setDrive?: (t: number, s: number) => void } }).__GW_DEBUG_CMD__?.setDrive?.(1, 1);
  });
  await expect
    .poll(async () => {
      const d = await debugOf(page);
      if (!d || !before) return 0;
      return Math.abs((d.playerAngle ?? 0) - (before.playerAngle ?? 0)) + Math.abs(d.playerX - before.playerX);
    })
    .toBeGreaterThan(2);
  await page.keyboard.up("KeyD");
  await page.keyboard.up("KeyW");

  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.getByRole("button", { name: "Resume" })).toHaveCount(0);

  const mid = await debugOf(page);
  await page.keyboard.press("r");
  await page.waitForTimeout(250);
  const after = await debugOf(page);
  expect(after?.score ?? 0).toBeLessThanOrEqual(mid?.score ?? 0);
  expect(after?.runState).toBe("playing");
});

test("velocity run moves, jumps, dies, and starts a new attempt", async ({ page }) => {
  await waitReady(page, "velocity-run");
  const before = await debugOf(page);
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(400);
  const moved = await debugOf(page);
  expect(moved!.playerX).toBeGreaterThan(before!.playerX);
  await page.keyboard.up("KeyD");
  await page.evaluate(() => {
    (window as unknown as { __GW_DEBUG_CMD__?: { jump?: () => void } }).__GW_DEBUG_CMD__?.jump?.();
  });
  await page.keyboard.down("Space");
  await expect
    .poll(async () => {
      const d = await debugOf(page);
      return d?.playerY ?? moved!.playerY;
    })
    .not.toBe(moved!.playerY);
  await page.keyboard.up("Space");

  const jumped = await debugOf(page);
  const deathsBefore = jumped!.sessionDeaths ?? jumped!.deaths ?? 0;
  await page.evaluate(() => {
    (window as unknown as { __GW_DEBUG_CMD__?: { killPlayer?: () => void } }).__GW_DEBUG_CMD__?.killPlayer?.();
  });
  await expect
    .poll(async () => (await debugOf(page))?.sessionDeaths ?? 0)
    .toBeGreaterThan(deathsBefore);
  await page.waitForTimeout(200);
  const next = await debugOf(page);
  expect(next?.timeMs ?? 0).toBeLessThan(50);
  expect(next?.runState).toBe("playing");
});

test("swarm protocol moves, levels, and takes an upgrade", async ({ page }) => {
  await waitReady(page, "swarm-protocol");
  const before = await debugOf(page);
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(400);
  const moved = await debugOf(page);
  expect(Math.abs(moved!.playerY - before!.playerY) + Math.abs(moved!.playerX - before!.playerX)).toBeGreaterThan(4);
  await page.keyboard.up("KeyW");

  await page.evaluate(() => {
    const cmd = (window as unknown as { __GW_DEBUG_CMD__?: { grantXp?: (n: number) => void } }).__GW_DEBUG_CMD__;
    cmd?.grantXp?.(400);
  });
  await expect.poll(async () => (await debugOf(page))?.runState).toBe("choosing");
  await page.evaluate(() => {
    (window as unknown as { __GW_DEBUG_CMD__?: { pickUpgrade?: (i: number) => void } }).__GW_DEBUG_CMD__?.pickUpgrade?.(0);
  });
  await expect.poll(async () => (await debugOf(page))?.runState).toBe("playing");
  const after = await debugOf(page);
  expect(after!.level ?? 1).toBeGreaterThanOrEqual(2);
});
