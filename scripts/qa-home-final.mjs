import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3010";
const out = process.env.OUT_DIR ?? join(dirname(fileURLToPath(import.meta.url)), "../docs/qa-home-final");
mkdirSync(out, { recursive: true });

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
      challengerScore: 192400,
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

async function seed(page, kind) {
  const player = kind === "guest" ? GUEST : POPULATED;
  await page.addInitScript(
    ({ player }) => {
      localStorage.setItem("gw:reduced-motion", "1");
      document.documentElement.classList.add("reduce-motion");
      localStorage.setItem("gamesweb.player", JSON.stringify(player));
    },
    { player },
  );
}

async function ready(page) {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { level: 1 }).waitFor({ timeout: 20000 });
  await page.waitForTimeout(400);
}

const browser = await chromium.launch({ headless: true });

async function shot(name, size, { arrows = 0, kind = "guest", scroll = null } = {}) {
  const context = await browser.newContext({ viewport: size });
  const page = await context.newPage();
  await seed(page, kind);
  if (kind !== "guest") {
    await page.addInitScript(
      ({ arcade }) => {
        localStorage.setItem("gw:arcade-social", JSON.stringify(arcade));
      },
      { arcade: ARCADE },
    );
  }
  await ready(page);
  for (let i = 0; i < arrows; i += 1) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(120);
  }
  if (scroll === "events") {
    await page.getByRole("region", { name: "Today in the arcade" }).scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
  } else if (scroll === "social") {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(280);
  await page.screenshot({ path: join(out, name), fullPage: false });
  console.log("wrote", name);
  await context.close();
}

await shot("home-neon-1440.png", { width: 1440, height: 900 });
await shot("home-velocity-1440.png", { width: 1440, height: 900 }, { arrows: 1 });
await shot("home-swarm-1440.png", { width: 1440, height: 900 }, { arrows: 2 });
await shot("home-knockout-1440.png", { width: 1440, height: 900 }, { arrows: 4 });
await shot("home-crowd-1440.png", { width: 1440, height: 900 }, { arrows: 7 });
await shot("home-neon-1920.png", { width: 1920, height: 1080 });
await shot("home-velocity-1920.png", { width: 1920, height: 1080 }, { arrows: 1 });
await shot("home-velocity-1366.png", { width: 1366, height: 768 }, { arrows: 1 });
await shot("home-grand-prix-1366.png", { width: 1366, height: 768 }, { scroll: "events" });
await shot("home-neon-390.png", { width: 390, height: 844 });
await shot("home-velocity-390.png", { width: 390, height: 844 }, { arrows: 1 });
await shot("home-swarm-390.png", { width: 390, height: 844 }, { arrows: 2 });
await shot("home-crowd-390.png", { width: 390, height: 844 }, { arrows: 7 });
await shot("home-events-1440.png", { width: 1440, height: 900 }, { kind: "returning", scroll: "events" });
await shot("home-social-1440.png", { width: 1440, height: 900 }, { kind: "returning", scroll: "social" });

await browser.close();
console.log("qa", out);
