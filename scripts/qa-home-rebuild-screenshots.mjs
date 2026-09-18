import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3010";
const out = process.env.OUT_DIR ?? join(dirname(fileURLToPath(import.meta.url)), "../docs/qa-home-rebuild");
mkdirSync(out, { recursive: true });
mkdirSync(join(out, "comparisons"), { recursive: true });

const SETTINGS = {
  master: 0.1,
  music: 0,
  sfx: 0,
  muted: true,
  reducedMotion: true,
  shareActivity: true,
  sharePresence: true,
  sharePublicActivity: true,
  ghost: true,
  haptics: false,
  shake: 0,
};

const GUEST = {
  id: "visual-guest-0001",
  authId: null,
  isGuest: true,
  username: "guest-visu",
  displayName: "Player",
  avatar: "orb-0",
  xp: 0,
  streak: 0,
  lastSeenDay: "2026-09-18",
  createdAt: 1757937600000,
  achievements: [],
  achievementUnlocks: {},
  questProgress: {},
  questCompleted: [],
  stats: {},
  saves: {},
  scores: [],
  history: [],
  settings: SETTINGS,
  friends: [],
  pbCount: 0,
  sessionGames: [],
  uniqueGamesToday: [],
  dayKey: "2026-09-18",
  gamesPlayedToday: 0,
  pendingSavePrompt: false,
  backend: "local",
  pendingInvite: null,
  syncStatus: "idle",
};

const POPULATED = {
  ...GUEST,
  id: "visual-player-0002",
  isGuest: false,
  username: "lane",
  displayName: "Lane",
  avatar: "orb-3",
  xp: 420,
  streak: 4,
  achievements: ["neon-drift:first-slide", "neon-drift:combo-5"],
  scores: [
    {
      id: "s1",
      gameId: "neon-drift",
      mode: "foundation",
      score: 82400,
      at: 1757937600000,
      verified: "verified",
      metadata: {},
    },
  ],
  history: [{ gameId: "neon-drift", at: 1757937600000, durationMs: 90000, score: 82400, result: "finish" }],
  friends: [
    {
      id: "mika",
      username: "mika",
      displayName: "Mika",
      avatar: "orb-1",
      status: "accepted",
      presence: "playing",
      gameId: "neon-drift",
    },
  ],
  pbCount: 1,
  sessionGames: ["neon-drift"],
  uniqueGamesToday: ["neon-drift"],
  gamesPlayedToday: 1,
};

const ARCADE = {
  challenges: [
    {
      id: "ch-mika",
      publicCode: "MIKA8",
      gameId: "neon-drift",
      mode: "foundation",
      seed: "visual",
      type: "beat-score",
      challengerId: "mika",
      challengerName: "Mika",
      targetId: "visual-player-0002",
      targetName: "Lane",
      challengerRunId: "r1",
      challengerScore: 90620,
      challengerGhostId: null,
      challengerMeta: {},
      status: "open",
      createdAt: 1757937600000,
      expiresAt: 1760529600000,
      metadata: {},
      winnerId: null,
      targetScore: null,
      trust: "verified",
      gameVersion: "1",
      attempts: [],
    },
  ],
  inbox: [],
  parties: [],
  rivals: [
    {
      otherId: "mika",
      otherName: "Mika",
      winsA: 2,
      winsB: 3,
      draws: 0,
      totalMatches: 5,
      lastMatch: 1757937600000,
      streak: 1,
      rivalryScore: 8,
    },
  ],
  recentPlayers: [],
  daily: { day: "2026-09-18", completed: [], score: 0 },
  grandPrix: { id: null, scores: [], points: 12 },
  crew: null,
};

async function seed(page, populated) {
  await page.addInitScript(
    ({ player, arcade }) => {
      localStorage.setItem("gw:reduced-motion", "1");
      document.documentElement.classList.add("reduce-motion");
      localStorage.setItem("gamesweb.player", JSON.stringify(player));
      if (arcade) localStorage.setItem("gw:arcade-social", JSON.stringify(arcade));
    },
    { player: populated ? POPULATED : GUEST, arcade: populated ? ARCADE : null },
  );
}

async function ready(page, populated) {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { level: 1 }).waitFor({ timeout: 20000 });
  if (populated) {
    await page.getByText("82,400").waitFor({ timeout: 8000 });
  }
  await page.waitForTimeout(350);
}

const browser = await chromium.launch({ headless: true });

async function shot(name, size, arrows = 0, populated = false, full = false) {
  const page = await browser.newPage({ viewport: size });
  await seed(page, populated);
  await ready(page, populated);
  for (let i = 0; i < arrows; i += 1) await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(280);
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
