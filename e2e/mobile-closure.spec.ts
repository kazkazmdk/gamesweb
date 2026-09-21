import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";

const OUT = "docs/qa-production-closure/mobile";
const SURFACES = [
  ["/", "home"],
  ["/games", "catalog"],
  ["/games/neon-drift", "hub"],
  ["/games/neon-drift/guide", "guide"],
  ["/collections/quick-games", "collection"],
  ["/party", "party"],
] as const;

test("touched surfaces at 390 / 768 / 1440", async ({ page }) => {
  test.setTimeout(120_000);
  mkdirSync(OUT, { recursive: true });
  for (const width of [390, 768, 1440] as const) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    for (const [path, name] of SURFACES) {
      await page.goto(path);
      await page.waitForTimeout(250);
      await page.screenshot({ path: `${OUT}/${name}-${width}.png`, fullPage: false });
    }
  }
});
