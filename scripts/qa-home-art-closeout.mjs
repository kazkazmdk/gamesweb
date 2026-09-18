import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3010";
const out = process.env.OUT_DIR ?? join(dirname(fileURLToPath(import.meta.url)), "../docs/qa-home-art-closeout");
mkdirSync(out, { recursive: true });
mkdirSync(join(out, "after"), { recursive: true });

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
  if (kind === "guest") return;
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ player, arcade }) => {
      localStorage.setItem("gamesweb.player", JSON.stringify(player));
      localStorage.setItem("gw:arcade-social", JSON.stringify(arcade));
    },
    { player: POPULATED, arcade: ARCADE },
  );
}

async function ready(page) {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { level: 1 }).waitFor({ timeout: 20000 });
  await page.waitForTimeout(500);
}

const browser = await chromium.launch({ headless: true });

async function shot(name, size, arrows = 0, kind = "guest", full = false) {
  const context = await browser.newContext({ viewport: size });
  const page = await context.newPage();
  await seed(page, kind);
  await ready(page);
  for (let i = 0; i < arrows; i += 1) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(140);
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(out, "after", name), fullPage: full });
  await context.close();
}

await shot("home-neon-1440.png", { width: 1440, height: 900 });
await shot("home-velocity-1440.png", { width: 1440, height: 900 }, 1);
await shot("home-swarm-1440.png", { width: 1440, height: 900 }, 2);
await shot("home-sky-1440.png", { width: 1440, height: 900 }, 3);
await shot("home-knockout-1440.png", { width: 1440, height: 900 }, 4);
await shot("home-pocket-1440.png", { width: 1440, height: 900 }, 5);
await shot("home-territory-1440.png", { width: 1440, height: 900 }, 6);
await shot("home-crowd-1440.png", { width: 1440, height: 900 }, 7);
await shot("home-neon-390.png", { width: 390, height: 844 });
await shot("home-swarm-390.png", { width: 390, height: 844 }, 2);
await shot("home-crowd-390.png", { width: 390, height: 844 }, 7);
await shot("home-sky-390.png", { width: 390, height: 844 }, 3);
await shot("home-new-player-1440.png", { width: 1440, height: 900 }, 0, "guest");
await shot("home-returning-1440.png", { width: 1440, height: 900 }, 0, "returning");
await shot("home-challenge-1440.png", { width: 1440, height: 900 }, 0, "returning");
await shot("home-friend-playing-1440.png", { width: 1440, height: 900 }, 0, "returning", true);
await shot("home-neon-1440-full.png", { width: 1440, height: 900 }, 0, "returning", true);
await shot("home-neon-390-full.png", { width: 390, height: 844 }, 0, "guest", true);

writeFileSync(
  join(out, "contact-sheet.html"),
  `<!doctype html>
<meta charset="utf-8" />
<title>Home art closeout contact sheet</title>
<style>
  body { margin: 0; background: #0c0c0d; color: #f3f1ec; font: 13px/1.4 ui-sans-serif, system-ui; }
  h1 { font-size: 18px; letter-spacing: .12em; text-transform: uppercase; padding: 20px; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 0 16px 16px; }
  figure { margin: 0; background: #111; }
  img { width: 100%; display: block; }
  figcaption { padding: 8px 10px; color: #8d8b86; letter-spacing: .08em; text-transform: uppercase; font-size: 11px; }
</style>
<h1>Before / After</h1>
${["neon", "velocity", "swarm", "sky"]
  .map(
    (g) => `<div class="row">
  <figure><img src="../qa-home-rebuild/home-${g}-1440.png" alt="old ${g}" /><figcaption>Old ${g}</figcaption></figure>
  <figure><img src="after/home-${g}-1440.png" alt="new ${g}" /><figcaption>New ${g}</figcaption></figure>
</div>`,
  )
  .join("")}
`,
);

await browser.close();
console.log(`wrote shots to ${out}`);
