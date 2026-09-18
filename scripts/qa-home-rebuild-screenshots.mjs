import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3010";
const out = process.env.OUT_DIR ?? join(dirname(fileURLToPath(import.meta.url)), "../docs/qa-home-rebuild");
mkdirSync(out, { recursive: true });
mkdirSync(join(out, "comparisons"), { recursive: true });

const GUEST = {
  settings: { reducedMotion: true, muted: true, master: 0.1, music: 0, sfx: 0, haptics: false, shake: 0, ghost: true, shareActivity: true, sharePresence: true, sharePublicActivity: true },
};

async function seed(page, populated) {
  await page.addInitScript(
    ({ populated }) => {
      localStorage.setItem("gw:reduced-motion", "1");
      document.documentElement.classList.add("reduce-motion");
      if (populated) {
        const player = {
          id: "visual-player-0002",
          authId: null,
          isGuest: false,
          username: "lane",
          displayName: "Lane",
          avatar: "orb-3",
          xp: 420,
          streak: 4,
          lastSeenDay: "2026-09-15",
          createdAt: 1757937600000,
          achievements: ["neon-drift:first-slide"],
          achievementUnlocks: {},
          questProgress: {},
          questCompleted: [],
          stats: {},
          saves: {},
          scores: [
            { id: "s1", gameId: "neon-drift", mode: "foundation", score: 82400, at: 1757937600000, verified: "verified", metadata: {} },
          ],
          history: [{ gameId: "neon-drift", at: 1757937600000, durationMs: 90000, score: 82400, result: "finish" }],
          settings: { master: 0.1, music: 0, sfx: 0, muted: true, reducedMotion: true, shareActivity: true, sharePresence: true, sharePublicActivity: true, ghost: true, haptics: false, shake: 0 },
          friends: [{ id: "mika", username: "mika", displayName: "Mika", avatar: "orb-1", status: "accepted", presence: "online" }],
          pbCount: 1,
          sessionGames: ["neon-drift"],
          uniqueGamesToday: ["neon-drift"],
          dayKey: "2026-09-15",
          gamesPlayedToday: 1,
          pendingSavePrompt: false,
          backend: "local",
          pendingInvite: null,
          syncStatus: "idle",
        };
        localStorage.setItem("gamesweb.player", JSON.stringify(player));
      }
    },
    { populated },
  );
}

async function ready(page) {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { level: 1 }).waitFor({ timeout: 20000 });
  await page.waitForTimeout(400);
}

const browser = await chromium.launch({ headless: true });

async function shot(name, size, arrows = 0, populated = false, full = false) {
  const page = await browser.newPage({ viewport: size });
  await seed(page, populated);
  await ready(page);
  for (let i = 0; i < arrows; i += 1) await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(250);
  await page.screenshot({ path: join(out, name), fullPage: full });
  await page.close();
}

await shot("home-neon-1440.png", { width: 1440, height: 900 });
await shot("home-velocity-1440.png", { width: 1440, height: 900 }, 1);
await shot("home-swarm-1440.png", { width: 1440, height: 900 }, 2);
await shot("home-sky-1440.png", { width: 1440, height: 900 }, 3);
await shot("home-neon-1920.png", { width: 1920, height: 1080 });
await shot("home-neon-1366.png", { width: 1366, height: 768 });
await shot("home-neon-390.png", { width: 390, height: 844 });
await shot("home-swarm-390.png", { width: 390, height: 844 }, 2);
await shot("home-sky-390.png", { width: 390, height: 844 }, 3);
await shot("home-new-player-1440.png", { width: 1440, height: 900 });
await shot("home-returning-1440.png", { width: 1440, height: 900 }, 0, true);
await shot("home-neon-1440-full.png", { width: 1440, height: 900 }, 0, false, true);
await shot("home-neon-390-full.png", { width: 390, height: 844 }, 0, false, true);
await shot("home-tablet-768.png", { width: 768, height: 1024 });

await browser.close();
console.log(`wrote shots to ${out}`);
