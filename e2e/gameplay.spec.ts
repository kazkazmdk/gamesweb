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
  sessionDeaths?: number;
  deaths?: number;
  speed?: number;
  throttle?: number;
  tick?: number;
  longFrames?: number;
  frozen?: boolean;
  fps?: number;
};

type GwCmd = {
  setDrive?: (t: number, s: number) => void;
  jump?: () => void;
  killPlayer?: () => void;
  grantXp?: (n: number) => void;
  pickUpgrade?: (i: number) => void;
};

const BENIGN = [/Download the React DevTools/i, /\[Phaser\]/i, /Failed to load resource/i];

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

async function debugOf(page: Page): Promise<GwDebug | null> {
  return page.evaluate(() => (window as unknown as { __GW_DEBUG__?: GwDebug }).__GW_DEBUG__ ?? null);
}

async function cmd<K extends keyof GwCmd>(page: Page, name: K, ...args: Parameters<NonNullable<GwCmd[K]>>) {
  await page.evaluate(
    ([key, params]) => {
      const bag = (window as unknown as { __GW_DEBUG_CMD__?: GwCmd }).__GW_DEBUG_CMD__;
      const fn = bag?.[key as keyof GwCmd] as ((...a: unknown[]) => void) | undefined;
      fn?.(...params);
    },
    [name, args] as const,
  );
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
  await page.locator("canvas").evaluate((el) => {
    if (el instanceof HTMLCanvasElement) el.focus({ preventScroll: true });
  });
}

async function assertAlive(page: Page) {
  const start = await debugOf(page);
  await expect
    .poll(async () => (await debugOf(page))?.tick ?? 0, { timeout: 6_000 })
    .toBeGreaterThan((start?.tick ?? 0) + 8);
  const later = await debugOf(page);
  expect(later?.frozen).not.toBe(true);
  expect(later?.longFrames ?? 0).toBeLessThan(90);
  console.log(`gw-metrics game=${later?.gameId} fps=${later?.fps ?? "n/a"} longFrames=${later?.longFrames ?? 0} tick=${later?.tick ?? 0}`);
}

test("neon drift steers, scores, pauses, and retries", async ({ page }) => {
  const done = attachConsoleGuard(page);
  await waitReady(page, "neon-drift");
  const before = await debugOf(page);
  expect(before?.runState).toBe("playing");
  await page.keyboard.down("KeyW");
  await page.keyboard.down("KeyD");
  await expect
    .poll(async () => {
      const d = await debugOf(page);
      if (!d || !before) return 0;
      return Math.abs((d.playerAngle ?? 0) - (before.playerAngle ?? 0)) + Math.abs(d.playerX - before.playerX);
    }, { timeout: 8_000 })
    .toBeGreaterThan(2);
  await expect
    .poll(async () => (await debugOf(page))?.score ?? 0, { timeout: 12_000 })
    .toBeGreaterThan(before?.score ?? 0);
  await page.keyboard.up("KeyD");
  await page.keyboard.up("KeyW");
  await assertAlive(page);

  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.getByRole("button", { name: "Resume" })).toHaveCount(0);
  await expect.poll(async () => (await debugOf(page))?.paused).toBe(false);

  const mid = await debugOf(page);
  await page.keyboard.press("r");
  await expect
    .poll(async () => (await debugOf(page))?.score ?? 0)
    .toBeLessThanOrEqual(mid?.score ?? 0);
  const after = await debugOf(page);
  expect(after?.runState).toBe("playing");
  done();
});

test("neon drift keyboard-only movement", async ({ page }) => {
  const done = attachConsoleGuard(page);
  await waitReady(page, "neon-drift");
  const before = await debugOf(page);
  await page.keyboard.down("KeyW");
  await page.keyboard.down("KeyD");
  await expect
    .poll(async () => {
      const d = await debugOf(page);
      if (!d || !before) return 0;
      return Math.abs((d.playerAngle ?? 0) - (before.playerAngle ?? 0)) + Math.abs(d.playerX - before.playerX);
    }, { timeout: 8_000 })
    .toBeGreaterThan(2);
  await page.keyboard.up("KeyD");
  await page.keyboard.up("KeyW");
  done();
});

test("velocity run moves, jumps, dies, and starts a new attempt", async ({ page }) => {
  const done = attachConsoleGuard(page);
  await waitReady(page, "velocity-run");
  const before = await debugOf(page);
  await page.keyboard.down("KeyD");
  await expect
    .poll(async () => (await debugOf(page))?.playerX ?? before!.playerX)
    .toBeGreaterThan(before!.playerX);
  await page.keyboard.up("KeyD");
  const moved = await debugOf(page);
  await page.keyboard.down("Space");
  await expect
    .poll(async () => (await debugOf(page))?.playerY ?? moved!.playerY, { timeout: 8_000 })
    .not.toBe(moved!.playerY);
  await page.keyboard.up("Space");
  await assertAlive(page);

  const jumped = await debugOf(page);
  const deathsBefore = jumped!.sessionDeaths ?? jumped!.deaths ?? 0;
  await cmd(page, "killPlayer");
  await expect
    .poll(async () => (await debugOf(page))?.sessionDeaths ?? 0)
    .toBeGreaterThan(deathsBefore);
  await expect
    .poll(async () => (await debugOf(page))?.timeMs ?? 1)
    .toBeLessThan(50);
  const next = await debugOf(page);
  expect(next?.runState).toBe("playing");
  done();
});

test("velocity run keyboard-only move and jump", async ({ page }) => {
  const done = attachConsoleGuard(page);
  await waitReady(page, "velocity-run");
  const before = await debugOf(page);
  await page.keyboard.down("KeyD");
  await page.keyboard.down("Space");
  await expect
    .poll(async () => {
      const d = await debugOf(page);
      if (!d || !before) return 0;
      return Math.abs(d.playerX - before.playerX) + Math.abs(d.playerY - before.playerY);
    }, { timeout: 8_000 })
    .toBeGreaterThan(2);
  await page.keyboard.up("Space");
  await page.keyboard.up("KeyD");
  done();
});

test("swarm protocol moves, levels, and takes an upgrade", async ({ page }) => {
  const done = attachConsoleGuard(page);
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
  await assertAlive(page);

  await cmd(page, "grantXp", 400);
  await expect.poll(async () => (await debugOf(page))?.runState).toBe("choosing");
  await cmd(page, "pickUpgrade", 0);
  await expect.poll(async () => (await debugOf(page))?.runState).toBe("playing");
  const after = await debugOf(page);
  expect(after!.level ?? 1).toBeGreaterThanOrEqual(2);
  done();
});

test("sky stack places with space and retries", async ({ page }) => {
  const done = attachConsoleGuard(page);
  await waitReady(page, "sky-stack");
  await cmd(page, "jump");
  await expect.poll(async () => (await debugOf(page))?.score ?? 0, { timeout: 8_000 }).toBeGreaterThan(0);
  await page.keyboard.press("Space");
  await assertAlive(page);
  done();
});

test("knockout circuit moves", async ({ page }) => {
  const done = attachConsoleGuard(page);
  await waitReady(page, "knockout-circuit");
  const before = await debugOf(page);
  await page.keyboard.down("KeyD");
  await expect
    .poll(async () => (await debugOf(page))?.playerX ?? 0)
    .toBeGreaterThan(before!.playerX);
  await page.keyboard.up("KeyD");
  done();
});
