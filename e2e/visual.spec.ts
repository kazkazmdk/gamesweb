import { test, expect } from "@playwright/test";
import { shot, stabilizeVisual } from "./visual-helpers";

test.describe("visual regression", () => {
  test("Games Home Neon 1440", async ({ page }) => {
    await stabilizeVisual(page, { width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Neon Drift" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Play|Continue/ }).first()).toBeVisible();
    await page.screenshot({ path: "test-results/visual-home-neon-1440.png", fullPage: false });
    await expect(page).toHaveScreenshot("home-neon-1440.png", shot);
  });

  test("Games Home Velocity 1440", async ({ page }) => {
    await stabilizeVisual(page, { width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Neon Drift" })).toBeVisible();
    await page.getByRole("heading", { level: 1, name: "Neon Drift" }).click();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("heading", { level: 1, name: "Velocity Run" })).toBeVisible();
    await page.screenshot({ path: "test-results/visual-home-velocity-1440.png", fullPage: false });
    await expect(page).toHaveScreenshot("home-velocity-1440.png", shot);
  });

  test("Games Home Swarm 1440", async ({ page }) => {
    await stabilizeVisual(page, { width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Neon Drift" })).toBeVisible();
    await page.getByRole("heading", { level: 1, name: "Neon Drift" }).click();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("heading", { level: 1, name: "Velocity Run" })).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("heading", { level: 1, name: "Swarm Protocol" })).toBeVisible();
    await page.screenshot({ path: "test-results/visual-home-swarm-1440.png", fullPage: false });
    await expect(page).toHaveScreenshot("home-swarm-1440.png", shot);
  });

  test("Games Home Neon 1920", async ({ page }) => {
    await stabilizeVisual(page, { width: 1920, height: 1080 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Neon Drift" })).toBeVisible();
    await page.screenshot({ path: "test-results/visual-home-neon-1920.png", fullPage: false });
    await expect(page).toHaveScreenshot("home-neon-1920.png", shot);
  });

  test("Games Home mobile 390", async ({ page }) => {
    await stabilizeVisual(page, { width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Neon Drift" })).toBeVisible();
    await page.screenshot({ path: "test-results/visual-home-neon-390.png", fullPage: false });
    await expect(page).toHaveScreenshot("home-neon-390.png", shot);
  });

  test("Games Home Neon activities", async ({ page }) => {
    await stabilizeVisual(page, { width: 1440, height: 900 });
    await page.goto("/");
    await page.getByRole("heading", { level: 1, name: "Neon Drift" }).waitFor();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByText("Today")).toBeVisible();
    await page.screenshot({ path: "test-results/visual-home-neon-activities-1440.png", fullPage: false });
    await expect(page).toHaveScreenshot("home-neon-activities-1440.png", shot);
  });

  test("Arcade 1440", async ({ page }) => {
    await stabilizeVisual(page, { width: 1440, height: 900 });
    await page.goto("/arcade");
    await expect(page.locator("h1").first()).toBeVisible();
    await page.screenshot({ path: "test-results/visual-arcade-1440.png", fullPage: false });
    await expect(page).toHaveScreenshot("arcade-1440.png", shot);
  });

  test("Profile new player 1440", async ({ page }) => {
    await stabilizeVisual(page, { width: 1440, height: 900 });
    await page.goto("/me");
    await expect(page.locator("h1").first()).toBeVisible();
    await page.screenshot({ path: "test-results/visual-profile-empty-1440.png", fullPage: false });
    await expect(page).toHaveScreenshot("profile-empty-1440.png", shot);
  });

  test("Profile populated 1440", async ({ page }) => {
    await stabilizeVisual(page, { width: 1440, height: 900, populated: true });
    await page.goto("/me");
    await expect(page.locator("h1").first()).toBeVisible();
    await page.screenshot({ path: "test-results/visual-profile-populated-1440.png", fullPage: false });
    await expect(page).toHaveScreenshot("profile-populated-1440.png", shot);
  });

  test("Achievements 1440", async ({ page }) => {
    await stabilizeVisual(page, { width: 1440, height: 900, populated: true });
    await page.goto("/achievements");
    await expect(page.locator("h1").first()).toBeVisible();
    await page.screenshot({ path: "test-results/visual-achievements-1440.png", fullPage: false });
    await expect(page).toHaveScreenshot("achievements-1440.png", shot);
  });

  test("Settings categories 1440", async ({ page }) => {
    await stabilizeVisual(page, { width: 1440, height: 900 });
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Account" })).toBeVisible();
    await page.screenshot({ path: "test-results/visual-settings-account-1440.png", fullPage: false });
    await page.getByRole("button", { name: "Gameplay" }).click();
    await page.screenshot({ path: "test-results/visual-settings-gameplay-1440.png", fullPage: false });
    await page.getByRole("button", { name: "Controls" }).click();
    await page.screenshot({ path: "test-results/visual-settings-controls-1440.png", fullPage: false });
    await page.getByRole("button", { name: "Privacy" }).click();
    await page.screenshot({ path: "test-results/visual-settings-privacy-1440.png", fullPage: false });
    await expect(page).toHaveScreenshot("settings-privacy-1440.png", shot);
  });

  test("Game Hub Neon 1440", async ({ page }) => {
    await stabilizeVisual(page, { width: 1440, height: 900 });
    await page.goto("/games/neon-drift");
    await expect(page.getByRole("heading", { level: 1, name: "Neon Drift" })).toBeVisible();
    await page.screenshot({ path: "test-results/visual-hub-neon-1440.png", fullPage: false });
    await expect(page).toHaveScreenshot("hub-neon-1440.png", shot);
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
