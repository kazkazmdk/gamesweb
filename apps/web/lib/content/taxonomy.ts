import { getManifest } from "@gamesweb/game-sdk";
import type { SeoTaxonomy } from "./types";

const TAXONOMY: Record<string, SeoTaxonomy> = {
  "neon-drift": {
    slug: "neon-drift",
    genre: "Driving",
    kindLabel: "free browser drift game",
    titlePattern: "Neon Drift — free browser drift game",
    shortKind: "drift game",
  },
  "velocity-run": {
    slug: "velocity-run",
    genre: "Platformer",
    kindLabel: "free browser parkour time-trial game",
    titlePattern: "Velocity Run — free browser parkour time-trial game",
    shortKind: "parkour time-trial",
  },
  "swarm-protocol": {
    slug: "swarm-protocol",
    genre: "Survival",
    kindLabel: "free browser arena survival game",
    titlePattern: "Swarm Protocol — free browser arena survival game",
    shortKind: "arena survival game",
  },
  "sky-stack": {
    slug: "sky-stack",
    genre: "Arcade",
    kindLabel: "free browser stacking arcade game",
    titlePattern: "Sky Stack — free browser stacking arcade game",
    shortKind: "stacking arcade game",
  },
  "knockout-circuit": {
    slug: "knockout-circuit",
    genre: "Obstacle",
    kindLabel: "free browser obstacle race game",
    titlePattern: "Knockout Circuit — free browser obstacle race game",
    shortKind: "obstacle race",
  },
  "pocket-striker": {
    slug: "pocket-striker",
    genre: "Physics",
    kindLabel: "free browser physics precision game",
    titlePattern: "Pocket Striker — free browser physics precision game",
    shortKind: "physics precision game",
  },
  "territory-rush": {
    slug: "territory-rush",
    genre: "Arena",
    kindLabel: "free browser territory area-control game",
    titlePattern: "Territory Rush — free browser territory area-control game",
    shortKind: "territory game",
  },
  "crowd-control": {
    slug: "crowd-control",
    genre: "Runner",
    kindLabel: "free browser crowd runner game",
    titlePattern: "Crowd Control — free browser crowd runner game",
    shortKind: "crowd runner",
  },
};

export function seoTaxonomy(slug: string): SeoTaxonomy {
  const row = TAXONOMY[slug];
  if (!row) {
    throw new Error(`No SEO taxonomy for "${slug}". Add an explicit mapping — never infer Survival.`);
  }
  const manifest = getManifest(slug);
  if (manifest && manifest.genre !== row.genre) {
    throw new Error(`Taxonomy genre ${row.genre} does not match manifest genre ${manifest.genre} for ${slug}`);
  }
  return row;
}

export function gameSeoTitle(slug: string): string {
  return seoTaxonomy(slug).titlePattern;
}

export function allTaxonomy(): SeoTaxonomy[] {
  return Object.values(TAXONOMY);
}

export const SURVIVAL_SLUGS = ["swarm-protocol"] as const;
