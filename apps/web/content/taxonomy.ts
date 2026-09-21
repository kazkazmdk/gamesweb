export const GAME_SEO_KIND: Record<string, string> = {
  "neon-drift": "Drift Game",
  "velocity-run": "Parkour Game",
  "swarm-protocol": "Survival Game",
  "sky-stack": "Stacking Game",
  "knockout-circuit": "Obstacle Game",
  "pocket-striker": "Physics Sports Game",
  "territory-rush": "Territory Game",
  "crowd-control": "Crowd Runner",
};

export const GENRE_SEO_KIND: Record<string, string> = {
  Driving: "Drift Game",
  Platformer: "Parkour Game",
  Survival: "Survival Game",
  Arcade: "Stacking Game",
  Obstacle: "Obstacle Game",
  Physics: "Physics Sports Game",
  Arena: "Territory Game",
  Runner: "Crowd Runner",
};

export function gameSeoKind(slug: string, genre: string): string {
  const bySlug = GAME_SEO_KIND[slug];
  if (bySlug) return bySlug;
  const byGenre = GENRE_SEO_KIND[genre];
  if (byGenre) return byGenre;
  throw new Error(`Missing SEO kind for slug="${slug}" genre="${genre}"`);
}

export function gameSeoTitle(title: string, slug: string, genre: string): string {
  return `${title} — Free Online ${gameSeoKind(slug, genre)}`;
}

export const PRIVATE_PREFIXES = [
  "/play",
  "/auth",
  "/me",
  "/settings",
  "/friends",
  "/inbox",
  "/party",
  "/crew",
  "/challenges",
  "/leaderboards",
  "/achievements",
  "/daily",
  "/grand-prix",
  "/profile",
  "/c/",
  "/arcade",
  "/api/",
] as const;
