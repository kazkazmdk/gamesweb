import { getManifest } from "@gamesweb/game-sdk";
import { applyGate } from "./quality";
import { gameImage, isoDate } from "./site";
import type { IndexableEntity } from "./types";

export type CollectionDef = {
  slug: string;
  title: string;
  h1: string;
  intent: string;
  description: string;
  why: string;
  games: string[];
  comparison: string;
};

const COLLECTIONS: CollectionDef[] = [
  {
    slug: "browser-games",
    title: "Browser games on Gamesweb",
    h1: "Eight browser games, one player",
    intent: "Find first-party Gamesweb titles that run in the tab with no install.",
    description:
      "Gamesweb is eight authored browser games bound by one player identity. This collection is the full public catalog, not a scraped list of third-party titles.",
    why: "Every title here ships inside Gamesweb: same XP, records, and challenge codes. None of them require a download.",
    games: [
      "neon-drift",
      "velocity-run",
      "swarm-protocol",
      "sky-stack",
      "knockout-circuit",
      "pocket-striker",
      "territory-rush",
      "crowd-control",
    ],
    comparison: "Sessions range from a 20-second Sky Stack climb to a 6–8 minute Swarm Protocol run. Input is keyboard and touch on all eight.",
  },
  {
    slug: "skill-games",
    title: "Skill games on Gamesweb",
    h1: "Skill games that punish a late input",
    intent: "Games where a single mistimed action ends or taxes the run.",
    description:
      "These Gamesweb titles keep the verb small and the timing honest: drift bank, jump buffer, dash window, loop close, gate read.",
    why: "Each game here fails a specific input — not a hidden stat check. Neon banks only on grip. Velocity deaths close the clock. Territory trails can be cut.",
    games: ["neon-drift", "velocity-run", "knockout-circuit", "territory-rush", "crowd-control", "pocket-striker"],
    comparison: "Velocity and Knockout are clocks. Neon and Pocket are pending scores until you cash them. Territory and Crowd are spatial bets.",
  },
  {
    slug: "quick-games",
    title: "Quick browser games",
    h1: "Runs that fit in one minute",
    intent: "Short authored sessions you can retry immediately.",
    description:
      "Sky Stack, Pocket Striker, Velocity Run, and Crowd Control publish session windows that usually resolve under 90 seconds.",
    why: "Manifest sessionDuration max is 90 seconds or less for each of these four. Retry is instant. None of them ask you to sit through a sixth minute.",
    games: ["sky-stack", "pocket-striker", "velocity-run", "crowd-control"],
    comparison: "Sky Stack is one tap. Pocket is a few strokes. Velocity is a rooftop clock. Crowd is a gate read on an auto-run road.",
  },
  {
    slug: "mobile-games",
    title: "Mobile browser games",
    h1: "Touch-first Gamesweb titles",
    intent: "Play the same first-party games on a phone without an app store build.",
    description:
      "All eight Gamesweb titles list touch as an input method and mobile as a supported device. This collection is the ones that stay readable at 390px.",
    why: "Sky Stack and Crowd Control are one-thumb. Pocket is a drag-to-aim. Neon, Velocity, Knockout, Territory, and Swarm keep on-screen verbs at phone width.",
    games: ["sky-stack", "crowd-control", "pocket-striker", "territory-rush", "neon-drift"],
    comparison: "Portrait-friendly: Sky Stack. Either orientation: Pocket and Crowd. Landscape with touch sticks: Neon, Territory.",
  },
  {
    slug: "competitive-games",
    title: "Competitive async games",
    h1: "Boards, ghosts, and challenge codes",
    intent: "Compare a recorded run, not a live lobby.",
      description:
      "These games keep global / friends / rivals boards and support challenge types that compare a score, time, or seed. They compare recorded runs, not a shared live lobby.",
    why: "Velocity, Knockout, and Neon record ghosts. Territory and Crowd still publish boards and same-seed challenges. Nobody here is a fake live racer.",
    games: ["velocity-run", "knockout-circuit", "neon-drift", "territory-rush", "crowd-control"],
    comparison: "Lower-is-better clocks: Velocity, Knockout. Higher-is-better scores: Neon, Territory, Crowd. Ghosts exist on Velocity, Knockout, Neon, Crowd.",
  },
  {
    slug: "one-thumb-games",
    title: "One-thumb browser games",
    h1: "One thumb is enough",
    intent: "Games whose core verb works with a single thumb.",
    description:
      "Sky Stack is a tap. Crowd Control is a steer. Pocket Striker is a pull-and-release. None of them require a second stick for the basic loop.",
    why: "Manifest skills and input copy match: Sky lists one-thumb, Crowd steers an auto-run pack, Pocket aims with one pointer.",
    games: ["sky-stack", "crowd-control", "pocket-striker"],
    comparison: "Sky Stack has one action. Crowd adds dash as an optional burst. Pocket adds power as part of the same drag.",
  },
  {
    slug: "time-attack-games",
    title: "Time-attack browser games",
    h1: "The clock is the sport",
    intent: "Authored courses and maps where a finish time is the score.",
    description:
      "Velocity Run and Knockout Circuit are lower-is-better clocks with medals or banners. Neon Drift is a score-attack that still races a two-lap circuit against a ghost.",
    why: "All three expose ghost support and authored routes. Velocity has 12 courses, Knockout 8 maps, Neon 3 tracks.",
    games: ["velocity-run", "knockout-circuit", "neon-drift"],
    comparison: "Velocity medals are millisecond targets. Knockout is banner-to-banner. Neon banks a score over two laps, then compares the ghost.",
  },
];

export function allCollections(): CollectionDef[] {
  return COLLECTIONS;
}

export function getCollection(slug: string): CollectionDef | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}

export function buildCollectionEntity(def: CollectionDef): IndexableEntity {
  if (def.games.length < 3) {
    return applyGate(
      stub(def),
      def.description,
      { thin: true, gameBacked: true, internalLinks: 0 },
    );
  }
  for (const slug of def.games) {
    if (!getManifest(slug)) throw new Error(`Collection ${def.slug} references missing game ${slug}`);
  }
  const related = [
    { href: "/games", label: "Games" },
    { href: "/guides", label: "Guides" },
    { href: "/collections", label: "Collections" },
    ...def.games.map((slug) => ({ href: `/games/${slug}`, label: getManifest(slug)!.title })),
  ];
  return applyGate(
    {
      id: `collection:${def.slug}`,
      kind: "collection",
      path: `/collections/${def.slug}`,
      slug: def.slug,
      title: def.title,
      h1: def.h1,
      description: def.description,
      canonical: `/collections/${def.slug}`,
      indexable: true,
      indexStatus: "INDEXABLE",
      indexReason: "useful cross-game collection",
      updatedAt: isoDate(),
      image: gameImage(def.games[0]!, "tile"),
      imageAlt: `${def.h1} — ${def.games.length} Gamesweb titles`,
      breadcrumbs: [
        { name: "Home", href: "/" },
        { name: "Collections", href: "/collections" },
        { name: def.title, href: `/collections/${def.slug}` },
      ],
      relatedLinks: related,
    },
    `${def.why} ${def.comparison} ${def.games.join(" ")}`,
    { gameBacked: true, internalLinks: related.length },
  );
}

function stub(def: CollectionDef): IndexableEntity {
  return {
    id: `collection:${def.slug}`,
    kind: "collection",
    path: `/collections/${def.slug}`,
    slug: def.slug,
    title: def.title,
    h1: def.h1,
    description: def.description,
    canonical: `/collections/${def.slug}`,
    indexable: false,
    indexStatus: "NOINDEX_THIN",
    indexReason: "collection below 3 games",
    updatedAt: isoDate(),
    image: gameImage("neon-drift"),
    imageAlt: def.title,
    breadcrumbs: [],
    relatedLinks: [],
  };
}

export function collectionIndexEntity(): IndexableEntity {
  const related = [
    { href: "/games", label: "Games" },
    { href: "/guides", label: "Guides" },
    ...COLLECTIONS.map((c) => ({ href: `/collections/${c.slug}`, label: c.title })),
  ];
  return applyGate(
    {
      id: "collection-index",
      kind: "collection-index",
      path: "/collections",
      slug: "collections",
      title: "Game collections",
      h1: "Collections",
      description: "Cross-game lists built from real Gamesweb manifests: session length, input, ghosts, and scoring direction.",
      canonical: "/collections",
      indexable: true,
      indexStatus: "INDEXABLE",
      indexReason: "directory of authored collections",
      updatedAt: isoDate(),
      image: gameImage("velocity-run", "tile"),
      imageAlt: "Gamesweb collections",
      breadcrumbs: [
        { name: "Home", href: "/" },
        { name: "Collections", href: "/collections" },
      ],
      relatedLinks: related,
    },
    COLLECTIONS.map((c) => c.intent).join(" "),
    { gameBacked: true },
  );
}
