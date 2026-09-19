import { test, expect } from "@playwright/test";

test("games home is focus-driven", async ({ page }) => {
  await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Neon Drift" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Play|Continue/ }).first()).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("heading", { level: 1, name: "Velocity Run" })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("heading", { level: 1, name: "Swarm Protocol" })).toBeVisible();
});

test("desktop chrome stays console-minimal", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(nav.getByRole("link", { name: "Games" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Arcade" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Boards" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Friends" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Search games" })).toBeVisible();
  await expect(page.getByText("Guest / this device")).toHaveCount(0);
});

test("play index redirects to games home", async ({ page }) => {
  await page.goto("/play");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId("games-home")).toBeVisible();
});

test("arcade hub is the widget surface", async ({ page }) => {
  await page.goto("/arcade");
  await expect(page.getByRole("heading", { name: "Arcade" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Daily challenges" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Player" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Enter today|Open Daily Arcade|Protect streak|Answer|Play this game/ }).first()).toBeVisible();
});

test("achievements is a real destination", async ({ page }) => {
  await page.goto("/achievements");
  await expect(page.getByRole("heading", { name: "Achievements" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Neon Drift" })).toBeVisible();
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
  await page.getByRole("button", { name: "Audio" }).click();
  await page.getByRole("button", { name: "Social" }).click();
  await expect(page.getByRole("switch", { name: "Share game presence" })).toBeVisible();
  await page.getByRole("button", { name: "Privacy" }).click();
  await expect(page.getByRole("switch", { name: "Show recent activity on profile" })).toBeVisible();
  await page.getByRole("button", { name: "Accessibility" }).click();
  await expect(page.getByRole("switch", { name: "Haptics" })).toBeVisible();
});

test("auth previews local progress", async ({ page }) => {
  await page.goto("/auth");
  await expect(page.getByText("Save this run")).toBeVisible();
  await expect(page.getByLabel("Save this run").getByText(/^Lv /)).toBeVisible();
  await expect(page.getByText("PBs")).toBeVisible();
});

test("mobile navigation uses five destinations", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Mobile" });
  await expect(nav.getByRole("link", { name: "Games", exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Arcade", exact: true })).toBeVisible();
  await expect(nav.getByRole("button", { name: "Search", exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Friends", exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Me", exact: true })).toBeVisible();
});

test("game hub leads with your run", async ({ page }) => {
  await page.goto("/games/neon-drift");
  await expect(page.getByRole("heading", { level: 1, name: "Neon Drift" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Play|Continue/ }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "The game" })).toBeVisible();
  await page.getByRole("tab", { name: "Hairpin District" }).click();
  await expect(page.getByRole("tab", { name: "Hairpin District" })).toHaveAttribute("aria-selected", "true");
});

test("public profile missing state", async ({ page }) => {
  await page.goto("/profile/nobody-here-xyz");
  await expect(page.getByRole("heading", { name: /not found|unavailable/i })).toBeVisible();
});
