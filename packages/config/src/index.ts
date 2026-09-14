export const brand = {
  productName: "Gamesweb",
  shortName: "Gamesweb",
  wordmark: "gamesweb",
  tagline: "Play first. Keep going.",
  description:
    "Instant browser games bound by one player identity — XP, records, challenges, friends.",
  locale: "en",
  social: {
    twitter: "",
    discord: "",
  },
  defaultAccent: "#d7c4a3",
  themeColor: "#0c0c0d",
  backgroundColor: "#0c0c0d",
} as const;

export type Brand = typeof brand;

export const storageKeys = {
  guest: "gamesweb.guest",
  player: "gamesweb.player",
  settings: "gamesweb.settings",
  syncQueue: "gamesweb.sync",
  analytics: "gamesweb.analytics",
  session: "gamesweb.session",
} as const;

export const motion = {
  instant: 100,
  fast: 160,
  standard: 260,
  large: 450,
} as const;

export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(80 * Math.pow(level - 1, 1.42) + 40 * (level - 1));
}

export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 2; i <= level; i += 1) {
    total += xpRequiredForLevel(i);
  }
  return total;
}

export function levelFromXp(xp: number): { level: number; intoLevel: number; needed: number } {
  let level = 1;
  let remaining = Math.max(0, xp);
  while (level < 99) {
    const need = xpRequiredForLevel(level + 1);
    if (remaining < need) {
      return { level, intoLevel: remaining, needed: need };
    }
    remaining -= need;
    level += 1;
  }
  return { level: 99, intoLevel: remaining, needed: xpRequiredForLevel(100) };
}

export const xpRewards = {
  firstPlayOfDay: 40,
  runComplete: 18,
  runCompletePerMinute: 6,
  personalBest: 35,
  challenge: 60,
  achievement: 25,
  newGameTried: 45,
  minRunSecondsForFullXp: 20,
} as const;

export const routes = {
  home: "/",
  play: "/play",
  playGame: (slug: string) => `/play/${slug}`,
  gameHub: (slug: string) => `/games/${slug}`,
  challenges: "/challenges",
  leaderboards: "/leaderboards",
  friends: "/friends",
  profile: (username: string) => `/profile/${username}`,
  me: "/me",
  settings: "/settings",
  auth: "/auth",
  about: "/about",
  privacy: "/privacy",
  terms: "/terms",
} as const;

export const deviceBreakpoints = {
  mobileMax: 767,
  tabletMax: 1199,
} as const;
