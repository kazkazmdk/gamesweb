import { test, expect, type Page } from "@playwright/test";

const GUEST = {
  id: "visual-guest-0001",
  authId: null,
  isGuest: true,
  username: "guest-visu",
  displayName: "Player",
  avatar: "orb-0",
  xp: 0,
  streak: 0,
  lastSeenDay: "2026-09-15",
  createdAt: 1757937600000,
  achievements: [],
  achievementUnlocks: {},
  questProgress: {},
  questCompleted: [],
  stats: {},
  saves: {},
  scores: [],
  history: [],
  settings: {
    master: 0.8,
    music: 0.45,
    sfx: 0.7,
    muted: true,
    reducedMotion: true,
    shareActivity: true,
    sharePresence: true,
    sharePublicActivity: true,
    ghost: true,
    haptics: false,
    shake: 0,
  },
  friends: [],
  pbCount: 0,
  sessionGames: [],
  uniqueGamesToday: [],
  dayKey: "2026-09-15",
  gamesPlayedToday: 0,
  pendingSavePrompt: false,
  backend: "local",
  pendingInvite: null,
  syncStatus: "idle",
};

export async function stabilizeVisual(page: Page, size: { width: number; height: number }) {
  await page.setViewportSize(size);
  await page.addInitScript((player) => {
    localStorage.setItem("gamesweb.player", JSON.stringify(player));
    localStorage.setItem("gw:reduced-motion", "1");
    document.documentElement.classList.add("reduce-motion");
    const style = document.createElement("style");
    style.textContent = "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }";
    document.documentElement.appendChild(style);
  }, GUEST);
  await page.clock.setFixedTime(new Date("2026-09-15T12:00:00Z"));
}

export const shot = {
  animations: "disabled" as const,
  caret: "hide" as const,
  maxDiffPixelRatio: 0.03,
};
