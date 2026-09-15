import { test, expect } from "@playwright/test";

test("visual games home and arcade", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Neon Drift" })).toBeVisible();
  await page.screenshot({ path: "test-results/visual-home-neon-1440.png", fullPage: true });
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("heading", { name: "Velocity Run" })).toBeVisible();
  await page.screenshot({ path: "test-results/visual-home-velocity-1440.png", fullPage: true });
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("heading", { name: "Swarm Protocol" })).toBeVisible();
  await page.screenshot({ path: "test-results/visual-home-swarm-1440.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Neon Drift" })).toBeVisible();
  await page.screenshot({ path: "test-results/visual-home-neon-390.png", fullPage: true });

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/");
  await page.screenshot({ path: "test-results/visual-home-neon-1920.png", fullPage: true });

  await page.setViewportSize({ width: 1440, height: 900 });
  for (const path of ["/arcade", "/games/neon-drift", "/leaderboards", "/achievements", "/me", "/settings", "/friends", "/challenges"]) {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.screenshot({ path: `test-results/visual${path.replaceAll("/", "-")}-1440.png`, fullPage: true });
  }
});
