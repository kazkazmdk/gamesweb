import { test, expect } from "@playwright/test";
import { shot, stabilizeVisual } from "./visual-helpers";

test.describe("visual regression", () => {
  test("Games Home Neon 1440", async ({ page }) => {
    await stabilizeVisual(page, { width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.getByText("Guest / this device")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Neon Drift" })).toBeVisible();
    await page.screenshot({ path: "test-results/visual-home-neon-1440.png", fullPage: false });
    await expect(page).toHaveScreenshot("home-neon-1440.png", shot);
  });

  test("Games Home Velocity 1440", async ({ page }) => {
    await stabilizeVisual(page, { width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.getByText("Guest / this device")).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("heading", { name: "Velocity Run" })).toBeVisible();
    await page.screenshot({ path: "test-results/visual-home-velocity-1440.png", fullPage: false });
    await expect(page).toHaveScreenshot("home-velocity-1440.png", shot);
  });

  test("Games Home Swarm 1440", async ({ page }) => {
    await stabilizeVisual(page, { width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.getByText("Guest / this device")).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("heading", { name: "Swarm Protocol" })).toBeVisible();
    await page.screenshot({ path: "test-results/visual-home-swarm-1440.png", fullPage: false });
    await expect(page).toHaveScreenshot("home-swarm-1440.png", shot);
  });

  test("Games Home mobile 390", async ({ page }) => {
    await stabilizeVisual(page, { width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByText("Guest / this device")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Neon Drift" })).toBeVisible();
    await page.screenshot({ path: "test-results/visual-home-neon-390.png", fullPage: false });
    await expect(page).toHaveScreenshot("home-neon-390.png", shot);
  });

  test("Arcade 1440", async ({ page }) => {
    await stabilizeVisual(page, { width: 1440, height: 900 });
    await page.goto("/arcade");
    await expect(page.getByText("Guest / this device")).toBeVisible();
    await expect(page.locator("h1").first()).toBeVisible();
    await page.screenshot({ path: "test-results/visual-arcade-1440.png", fullPage: false });
    await expect(page).toHaveScreenshot("arcade-1440.png", shot);
  });

  test("Achievements 1440", async ({ page }) => {
    await stabilizeVisual(page, { width: 1440, height: 900 });
    await page.goto("/achievements");
    await expect(page.getByText("Guest / this device")).toBeVisible();
    await expect(page.locator("h1").first()).toBeVisible();
    await page.screenshot({ path: "test-results/visual-achievements-1440.png", fullPage: false });
    await expect(page).toHaveScreenshot("achievements-1440.png", shot);
  });

  test("Settings 1440", async ({ page }) => {
    await stabilizeVisual(page, { width: 1440, height: 900 });
    await page.goto("/settings");
    await expect(page.getByText("Guest / this device")).toBeVisible();
    await expect(page.locator("h1").first()).toBeVisible();
    await page.screenshot({ path: "test-results/visual-settings-1440.png", fullPage: false });
    await expect(page).toHaveScreenshot("settings-1440.png", shot);
  });
});

test("visual extra surfaces", async ({ page }) => {
  await stabilizeVisual(page, { width: 1440, height: 900 });
  for (const path of ["/games/neon-drift", "/leaderboards", "/me", "/friends", "/challenges"]) {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.screenshot({ path: `test-results/visual${path.replaceAll("/", "-")}-1440.png`, fullPage: false });
  }
});
