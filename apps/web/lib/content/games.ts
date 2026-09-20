import { GAME_MANIFESTS, getManifest, type GameManifest } from "@gamesweb/game-sdk";
import { applyGate } from "./quality";
import { gameImage, isoDate } from "./site";
import { gameSeoTitle, seoTaxonomy } from "./taxonomy";
import type { IndexableEntity, RelatedLink } from "./types";

export type GameEditorial = {
  entity: IndexableEntity;
  overview: string;
  objective: string;
  scoring: string;
  session: string;
  socialTruth: string;
  tips: string[];
  modesNote: string;
  screenshots: Array<{ src: string; alt: string }>;
  faq: Array<{ q: string; a: string }>;
  howToPlay: string[];
  controls: GameManifest["controls"];
  contentUnitKind?: "track" | "course" | "map" | "table";
  contentUnitIndexPath?: string;
  strategyPath?: string | null;
};

const SOCIAL_TRUTH: Record<string, string> = {
  "neon-drift": "Solo score-attack with optional ghost races, async challenges, and party codes. No live multiplayer lobby.",
  "velocity-run": "Solo time-trial. Ghosts are recorded runs, not live racers. Challenges compare the same course seed.",
  "swarm-protocol": "Solo arena survival. Async duels compare seed and build, not a shared live arena.",
  "sky-stack": "One-thumb solo climb. Same-seed challenges compare first slabs. No live stack versus another player.",
  "knockout-circuit": "Solo obstacle race against recorded ghosts. Other silhouettes are replays, never live players.",
  "pocket-striker": "Solo or async 1v1. Strokes are the score. There is no live simultaneous table.",
  "territory-rush": "90-second arena against named deterministic bots. Bots are labeled as bots — they are not fake humans.",
  "crowd-control": "Solo runner. Ghosts remember the route they took. Forward motion is automatic; lane and gate choices are yours.",
};

const OVERVIEW: Record<string, string> = {
  "neon-drift":
    "Neon Drift is an arcade slide on wet night asphalt. Points only bank when the car regains grip. A crash before the bank discards the live combo.",
  "velocity-run":
    "Velocity Run is a rooftop time-trial. Checkpoints print split deltas against your ghost. A death closes the attempt so the clock stays honest.",
  "swarm-protocol":
    "Swarm Protocol is a compact arena survival run. Auto-fire tracks the nearest hostiles. Cores level you; one of three upgrades rewrites the next minute.",
  "sky-stack":
    "Sky Stack is a one-tap climb. Perfect overlap keeps the slab width and feeds fever. A miss ends the tower.",
  "knockout-circuit":
    "Knockout Circuit is an obstacle race across Factory, Skyworks, and Signal Core. Dash has a readable recover. Shortcuts are marked as expert routes in the map data.",
  "pocket-striker":
    "Pocket Striker is a physics table game. Pull back to aim, release to strike, ride the cushions. Fewer strokes win. A bank is a cushion then pocket on the same stroke.",
  "territory-rush":
    "Territory Rush is a 90-second area-control arena. Your trail is a claim in progress. Return to your color to fill the loop. Cutting a bot trail eliminates them — they can cut you too.",
  "crowd-control":
    "Crowd Control is a skill runner with a living count. Gates add, multiply, or tax the pack. Hidden left routes can be faster; right routes can be richer.",
};

const OBJECTIVE: Record<string, string> = {
  "neon-drift": "Finish two laps with the highest banked score. Live combo is worthless until it banks.",
  "velocity-run": "Reach the beacon. Lower time is better. Medals are platinum / gold / silver / bronze from authored targets.",
  "swarm-protocol": "Survive the protocol, collect cores, and defeat the Core. Endless is optional after the result.",
  "sky-stack": "Place moving slabs. Height and perfect streak are the score. Fever multiplies while the streak holds.",
  "knockout-circuit": "Reach the finish banner. Lower time is better. Hazard hits cost time, not a separate health bar.",
  "pocket-striker": "Pocket the striker in as few strokes as the layout par allows.",
  "territory-rush": "Hold the largest painted share of the floor when the 90-second clock ends.",
  "crowd-control": "Steer the pack through gates and fights, then cash a finish multiplier with as many people as you can keep.",
};

const SCORING: Record<string, string> = {
  "neon-drift":
    "Score accrues during a live slide (angle, speed, near-miss, sector chain) and only banks when grip returns. Straightening out or dropping below drift speed fades the combo.",
  "velocity-run":
    "Time from start to beacon. Bronze/silver land on first finishes. Gold needs a committed line. Platinum is a clean ghost-level run. Checkpoints do not save you.",
  "swarm-protocol":
    "Score comes from survival time, kills, and build depth. The Core kill is victory. Dash i-frames are visible; elites telegraph before they dash.",
  "sky-stack":
    "Each placed slab scores. Perfects keep width and raise the streak. Fever raises pitch and multiplies. A miss ends the climb.",
  "knockout-circuit":
    "Elapsed time. Expert platforms skip stairs. Falling or waiting on movers is the usual time loss.",
  "pocket-striker":
    "Stroke count. Perfect is hole-out in one. Bank is cushion-then-pocket. Layouts publish a par.",
  "territory-rush":
    "Paint percentage is the headline. Eliminations, largest single fill, and capture combo add to the numeric score.",
  "crowd-control":
    "Finish pack size times the end multiplier. Mid-run fights and taxes can delete people you just multiplied.",
};

const TIPS: Record<string, string[]> = {
  "neon-drift": [
    "Hold the slide through the apex, then countersteer before the exit wall.",
    "Near-miss the inner curb — that bonus only exists if you are still drifting.",
    "Boost ribbons sit at authored track points; they are not random pickups.",
  ],
  "velocity-run": [
    "Safe ledges sit low. Fast ledges sit high. Expert skips skip the stairs.",
    "Buffer the jump before the lip. Coyote time is short on purpose.",
    "Retry is instant. The clock only cares about a finish without a death.",
  ],
  "swarm-protocol": [
    "Positioning is the aim. Auto-fire already tracks the nearest hostile.",
    "Dash through elites on the telegraph, not after they start moving.",
    "Early pickup of chain or orbit changes how crowded the sixth minute feels.",
  ],
  "sky-stack": [
    "Place slightly early rather than late — leftover shrinks from the trailing edge.",
    "Fever is a long perfect streak, not a power-up crate.",
    "One thumb is enough. Keyboard Space and click are the same action.",
  ],
  "knockout-circuit": [
    "Dash is for gaps and spinner windows, not for every platform.",
    "Expert routes exist only where the map marks them — do not invent a third line.",
    "Ghosts show position, not their exact jump timing.",
  ],
  "pocket-striker": [
    "A thin power bar into a cushion is usually cleaner than a full send.",
    "Force pads and rotators are layout-authored, not random.",
    "Par is a first-party number on the table, not a global handicap.",
  ],
  "territory-rush": [
    "A long trail is a bigger fill and a longer vulnerable line.",
    "Bots have tells: BRICK turns square, NEEDLE cuts, SWEEP sweeps.",
    "Return to your color to cash the loop. Crossing empty floor does not paint it yet.",
  ],
  "crowd-control": [
    "Read the gate sign before you commit a lane. +N and ×N are not the same risk.",
    "A ×4 on a tiny pack can lose to a +30 on a large one.",
    "Dash is a lateral burst, not a skip of the next gate.",
  ],
};

const MODES: Record<string, string> = {
  "neon-drift": "Three authored tracks — Harbour Loop, Hairpin District, Ridge Sweep — plus a daily seed.",
  "velocity-run": "Twelve authored rooftop courses in three worlds: training HVAC, transit glass canyon, communications ascent.",
  "swarm-protocol": "Survival and same-seed challenge. Upgrades, not maps, are the run-to-run difference.",
  "sky-stack": "Climb and daily. The first slabs can be seeded for a challenge.",
  "knockout-circuit": "Eight authored maps across Factory, Skyworks, and Signal Core, plus daily.",
  "pocket-striker": "Eighteen authored tables in Workshop, Garden, and Arcade Lab, plus daily.",
  "territory-rush": "Two arena dressings (toy city / plaza) on the same capture rules, plus daily.",
  "crowd-control": "Rush route and daily. Gate math and hidden cuts change the pack more than cosmetics.",
};

const EXTRA_FAQ: Record<string, Array<{ q: string; a: string }>> = {
  "neon-drift": [
    { q: "When do points count?", a: "Only after the slide banks. Live combo is a pending total." },
    { q: "How many tracks are there?", a: "Three authored circuits: Harbour Loop, Hairpin District, and Ridge Sweep." },
  ],
  "velocity-run": [
    { q: "Do checkpoints save a death?", a: "No. They print splits. Death closes the attempt." },
    { q: "How many courses?", a: "Twelve authored courses across three rooftop worlds." },
  ],
  "swarm-protocol": [
    { q: "Is aiming required?", a: "Not at first. Auto-fire keeps skill in positioning, dash, and builds." },
    { q: "What ends a run?", a: "Death, or defeating the Core. Endless is optional after the result screen." },
  ],
  "sky-stack": [
    { q: "What is fever?", a: "A long perfect streak. Pitch rises and score multiplies until you miss." },
    { q: "Is there a second action?", a: "No. Place is the only verb." },
  ],
  "knockout-circuit": [
    { q: "Are the other runners live?", a: "No. They are ghosts of recorded runs." },
    { q: "How many maps?", a: "Eight authored maps in Factory, Skyworks, and Signal Core." },
  ],
  "pocket-striker": [
    { q: "What is a perfect?", a: "Hole-out in one stroke." },
    { q: "What is a bank?", a: "You hit a cushion, then the pocket, on that stroke." },
  ],
  "territory-rush": [
    { q: "Are the others players?", a: "No. They are deterministic bots with names and styles, labeled as bots." },
    { q: "How long is a match?", a: "About 90 seconds. Paint share at the clock is the headline." },
  ],
  "crowd-control": [
    { q: "Is it auto-run?", a: "Forward motion is automatic. Lane, gate, fight, and dash are on you." },
    { q: "Do gates always help?", a: "Tax gates remove people. A multiply on a small pack can still lose the finish." },
  ],
};

const UNIT_KIND: Partial<Record<string, GameEditorial["contentUnitKind"]>> = {
  "neon-drift": "track",
  "velocity-run": "course",
  "knockout-circuit": "map",
  "pocket-striker": "table",
};

const HAS_STRATEGY = new Set([
  "neon-drift",
  "velocity-run",
  "swarm-protocol",
  "knockout-circuit",
  "pocket-striker",
  "territory-rush",
  "crowd-control",
]);

export function gameHubPath(slug: string) {
  return `/games/${slug}`;
}

export function buildGameEditorial(slug: string): GameEditorial {
  const game = getManifest(slug);
  if (!game) throw new Error(`Unknown game ${slug}`);
  const tax = seoTaxonomy(slug);
  const howTo = `/games/${slug}/how-to-play`;
  const strategy = HAS_STRATEGY.has(slug) ? `/games/${slug}/strategy` : null;
  const unitKind = UNIT_KIND[slug];
  const unitIndex =
    unitKind === "track"
      ? `/games/${slug}/tracks`
      : unitKind === "course"
        ? `/games/${slug}/courses`
        : unitKind === "map"
          ? `/games/${slug}/maps`
          : unitKind === "table"
            ? `/games/${slug}/tables`
            : undefined;

  const related: RelatedLink[] = [
    { href: "/games", label: "All games" },
    { href: howTo, label: `How to play ${game.title}` },
    ...(strategy ? [{ href: strategy, label: `${game.title} strategy` }] : []),
    { href: "/guides", label: "Guides" },
    ...GAME_MANIFESTS.filter((g) => g.slug !== slug)
      .slice(0, 3)
      .map((g) => ({ href: `/games/${g.slug}`, label: g.title })),
  ];

  const entity = applyGate(
    {
      id: `hub:${slug}`,
      kind: "game-hub",
      path: `/games/${slug}`,
      slug,
      title: gameSeoTitle(slug),
      h1: game.title,
      description: `${game.description} ${tax.kindLabel}. ${game.sessionHint}.`,
      canonical: `/games/${slug}`,
      indexable: true,
      indexStatus: "INDEXABLE",
      indexReason: "primary game hub",
      updatedAt: isoDate(),
      image: gameImage(slug, "hero"),
      imageAlt: `${game.title} browser ${tax.shortKind} — ${game.tagline}`,
      breadcrumbs: [
        { name: "Home", href: "/" },
        { name: "Games", href: "/games" },
        { name: game.title, href: `/games/${slug}` },
      ],
      relatedLinks: related,
      gameSlug: slug,
    },
    `${OVERVIEW[slug]} ${OBJECTIVE[slug]} ${SCORING[slug]} ${TIPS[slug]?.join(" ")}`,
  );

  return {
    entity,
    overview: OVERVIEW[slug]!,
    objective: OBJECTIVE[slug]!,
    scoring: SCORING[slug]!,
    session: `${game.sessionHint}. Typical window ${game.sessionDuration.minSec}–${game.sessionDuration.maxSec} seconds.`,
    socialTruth: SOCIAL_TRUTH[slug]!,
    tips: TIPS[slug]!,
    modesNote: MODES[slug]!,
    screenshots: [
      { src: gameImage(slug, "hero"), alt: `${game.title} opening view` },
      { src: gameImage(slug, "backdrop"), alt: `${game.title} playfield` },
    ],
    faq: [...game.faq, ...(EXTRA_FAQ[slug] ?? [])],
    howToPlay: game.howToPlay,
    controls: game.controls,
    contentUnitKind: unitKind,
    contentUnitIndexPath: unitIndex,
    strategyPath: strategy,
  };
}

export function allGameEditorials(): GameEditorial[] {
  return GAME_MANIFESTS.map((g) => buildGameEditorial(g.slug));
}

export function hasStrategyPage(slug: string) {
  return HAS_STRATEGY.has(slug);
}
