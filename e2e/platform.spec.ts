import { test, expect } from "@playwright/test";

test("home surfaces player widgets", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Continue playing" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Daily challenges" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Friends playing" })).toBeVisible();
});

test("play discovery does not repeat catalog rows", async ({ page }) => {
  await page.goto("/play");
  await expect(page.getByRole("heading", { name: "Three ways to play" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Competitive" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Quick sessions" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "All games" })).toHaveCount(0);
});

test("challenges show mission progress", async ({ page }) => {
  await page.goto("/challenges");
  await expect(page.getByRole("heading", { name: "Daily Challenges" })).toBeVisible();
  await expect(page.getByText(/reset/i).first()).toBeVisible();
  await expect(page.getByRole("progressbar").first()).toBeVisible();
});

test("leaderboard switches game and mode", async ({ page }) => {
  await page.goto("/leaderboards");
  await expect(page.getByRole("tab", { name: "Neon Drift" })).toBeVisible();
  await page.getByRole("tab", { name: "Velocity Run" }).click();
  await expect(page.getByRole("tab", { name: "Gate A" })).toBeVisible();
  await page.getByRole("tab", { name: "Needle" }).click();
  await expect(page.getByRole("tab", { name: "Needle" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Friends" }).click();
  await expect(page.getByRole("tab", { name: "Friends" })).toHaveAttribute("aria-selected", "true");
});

test("friends empty state stays honest", async ({ page }) => {
  await page.goto("/friends");
  await expect(page.getByRole("heading", { name: "Friends" })).toBeVisible();
  await expect(page.getByText("No friends yet")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy link" })).toBeVisible();
});

test("profile shows real stats", async ({ page }) => {
  await page.goto("/me");
  await expect(page.getByText("Runs")).toBeVisible();
  await expect(page.getByText("PBs")).toBeVisible();
  await expect(page.getByText("Achievements")).toBeVisible();
});

test("settings keep labeled controls", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Account" })).toBeVisible();
  await expect(page.getByLabel("Display name")).toBeVisible();
  await expect(page.getByRole("switch", { name: "Mute" })).toBeVisible();
  await expect(page.getByLabel("Master")).toBeVisible();
});

test("auth previews local progress", async ({ page }) => {
  await page.goto("/auth");
  await expect(page.getByText("Save this run")).toBeVisible();
  await expect(page.getByText(/^Lv /)).toBeVisible();
  await expect(page.getByText("PBs")).toBeVisible();
});

test("mobile navigation uses five destinations", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Mobile" });
  await expect(nav.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Play" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Challenges" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Friends" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Me" })).toBeVisible();
});

test("game hub leads with your run", async ({ page }) => {
  await page.goto("/games/neon-drift");
  await expect(page.getByRole("heading", { name: "Your run" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The game" })).toBeVisible();
});
