import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import { COLLECTIONS } from "./collections";
import { guidePages } from "./guides";
import { CONTENT_UPDATED } from "@/lib/seo";

export type IndexablePage = {
  path: string;
  title: string;
  description: string;
  lastModified: string;
  image?: string;
};

const DAY = CONTENT_UPDATED;

export function indexablePages(): IndexablePage[] {
  const games = GAME_MANIFESTS.map((g) => ({
    path: `/games/${g.slug}`,
    title: `${g.title} — ${g.tagline}`,
    description: g.description,
    lastModified: DAY,
    image: g.hero,
  }));
  const guides = guidePages().map((g) => ({
    path: `/guides/${g.slug}/${g.kind}`,
    title: g.title,
    description: g.description,
    lastModified: DAY,
  }));
  const collections = COLLECTIONS.map((c) => ({
    path: `/collections/${c.slug}`,
    title: c.title,
    description: c.description,
    lastModified: DAY,
  }));
  return [
    {
      path: "/",
      title: "Gamesweb — Instant browser arcade",
      description: "Eight authored browser games on one player identity. Play Neon Drift, Velocity Run, and the rest of the Gamesweb catalog.",
      lastModified: DAY,
    },
    {
      path: "/games",
      title: "Gamesweb games catalog",
      description: "All eight Gamesweb games with genre, controls, session length, and links to hubs and guides.",
      lastModified: DAY,
    },
    ...games,
    {
      path: "/guides",
      title: "Gamesweb guides",
      description: "How-to-play and strategy guides written from the live Gamesweb mechanics.",
      lastModified: DAY,
    },
    ...guides,
    {
      path: "/collections",
      title: "Gamesweb collections",
      description: "Small editorial groupings of Gamesweb games that actually share a use case.",
      lastModified: DAY,
    },
    ...collections,
    {
      path: "/about",
      title: "About Gamesweb",
      description: "What Gamesweb is: a first-party browser arcade, not a portal of licensed flash games.",
      lastModified: DAY,
    },
    {
      path: "/privacy",
      title: "Privacy — Gamesweb",
      description: "How Gamesweb stores guest identity, scores, and optional account data.",
      lastModified: DAY,
    },
    {
      path: "/terms",
      title: "Terms — Gamesweb",
      description: "Terms for playing the eight Gamesweb originals in a browser.",
      lastModified: DAY,
    },
  ];
}

export const PRIVATE_PREFIXES = [
  "/play",
  "/auth",
  "/settings",
  "/me",
  "/friends",
  "/crew",
  "/party",
  "/inbox",
  "/daily",
  "/grand-prix",
  "/leaderboards",
  "/challenges",
  "/achievements",
  "/profile",
  "/c/",
  "/arcade",
];
