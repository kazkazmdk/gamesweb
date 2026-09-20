import { getManifest } from "@gamesweb/game-sdk";
import { buildGameEditorial, hasStrategyPage } from "./games";
export { hasStrategyPage };
import { applyGate } from "./quality";
import { gameImage, isoDate } from "./site";
import { seoTaxonomy } from "./taxonomy";
import type { IndexableEntity } from "./types";

export type GuidePage = {
  entity: IndexableEntity;
  gameSlug: string;
  kind: "how-to-play" | "strategy";
  lead: string;
  sections: Array<{ heading: string; body: string; bullets?: string[] }>;
  faq: Array<{ q: string; a: string }>;
};

const FIRST_30: Record<string, string> = {
  "neon-drift":
    "Accelerate into the first corner and hold a slide before the apex. If you straighten out to 'be safe', the combo never starts.",
  "velocity-run":
    "Run the low safe ledges on a first finish. Learn the beacon heading, then start taking the high fast pads.",
  "swarm-protocol":
    "Move immediately. Auto-fire covers the nearest hostile. Grab the first cores and pick a build before the density rises.",
  "sky-stack":
    "Watch one full pass of the first slab, then place. The leftover shrinks from the side that missed.",
  "knockout-circuit":
    "Walk the first spinner window instead of dashing it. Learn the finish banner heading before you hunt shortcuts.",
  "pocket-striker":
    "Aim with a short pull on the first table. A full-power first stroke usually overshoots the pocket.",
  "territory-rush":
    "Paint a small home loop first. A long opening trail is a gift to NEEDLE.",
  "crowd-control":
    "Stay centered until you can read both gate signs. The first multiply on a 12-pack is smaller than it looks.",
};

const FAILURE: Record<string, string> = {
  "neon-drift": "Crashing or grassing before the bank throws away the live combo. Walls reset more than your line.",
  "velocity-run": "Death closes the attempt. Checkpoints only printed a split — they do not hold a ghost of you.",
  "swarm-protocol": "Standing still to aim. The weapon already tracks. Getting clipped during an elite dash is the usual death.",
  "sky-stack": "A late place. The trailing edge is what shrinks, and a late tap looks safe until it is not.",
  "knockout-circuit": "Dashing every gap. Dash recover on a mover or spinner is how most gold times vanish.",
  "pocket-striker": "Over-power into a bumper. The ball keeps energy and the stroke is gone.",
  "territory-rush": "A long exposed trail. Bots cut it. You lose the claim and the body.",
  "crowd-control": "Taking ×N with a tiny pack, then a tax gate. The finish multiplier cannot rescue a count of four.",
};

const STRATEGY: Record<
  string,
  { title: string; h1: string; lead: string; sections: GuidePage["sections"] }
> = {
  "neon-drift": {
    title: "Neon Drift combo banking",
    h1: "Bank the slide, then spend the exit",
    lead: "Neon Drift only banks the points accumulated during a live slide after the car regains grip. Strategy is when you choose to keep the angle versus when you cash it.",
    sections: [
      {
        heading: "Hold versus bank",
        body: "A long Harbour Loop sweeper can carry combo across a sector. Hairpin District punishes the same greed — the switchback dumps you onto grass if you refuse to countersteer.",
      },
      {
        heading: "Near-miss is a line, not a bonus crate",
        body: "The inner curb bonus only counts while you are still in the slide. Straightening to clip the wall and then drifting again starts a new combo.",
      },
      {
        heading: "Boost ribbons",
        body: "Boost pads sit on authored track samples. They are worth a banked sector if you arrive already sliding, and they are a crash if you arrive pointed at the barrier.",
      },
    ],
  },
  "velocity-run": {
    title: "Velocity Run routing",
    h1: "Safe, fast, and expert are three different clocks",
    lead: "Each course marks ledges as safe, fast, or expert. Gold is usually a fast line with no death. Platinum is an expert skip that still hits every checkpoint split.",
    sections: [
      {
        heading: "Training roofs",
        body: "Gate A through Skyline Drill teach HVAC height. Fast pads sit above the safe stairs. Expert pads skip a whole storey — miss and the attempt ends.",
      },
      {
        heading: "Transit canyon",
        body: "Needle and Metro Core use movers and glass gaps. The clock loss is waiting, not falling, if you refuse the high line.",
      },
      {
        heading: "Ascent finish",
        body: "Rushline to Expert Ascent is a communications climb. Platinum medals assume you already know which pistons to ignore.",
      },
    ],
  },
  "swarm-protocol": {
    title: "Swarm Protocol build decisions",
    h1: "Pick a verb by minute two",
    lead: "Upgrades rewrite the sixth minute. Auto-fire means the decision is density versus pierce versus area, not aim skill.",
    sections: [
      {
        heading: "Projectile families",
        body: "Split Fire and Twin grow the volley. Chain Surge spends that volley across a crowd. Pierce and Rail keep a corridor clean instead.",
      },
      {
        heading: "Body upgrades",
        body: "Orbital / Blade / Dash Burn are melee radius. They want you inside the swarm. Missile and Plasma want you at the edge.",
      },
      {
        heading: "When the Core arrives",
        body: "The Core is a late clock, not a random boss crate. A magnet-heavy build that never learned to dash will still die in the telegraph.",
      },
    ],
  },
  "knockout-circuit": {
    title: "Knockout Circuit map lines",
    h1: "Race the banner, not the ghost",
    lead: "Ghosts are recorded positions. Beating them is a route and dash-window problem, not a draft.",
    sections: [
      {
        heading: "Factory maps",
        body: "Starter Gates, Liftwell, Hammer Run, and Conveyor are mover-and-spinner reads. The expert line is almost always above the first spinner.",
      },
      {
        heading: "Skyworks",
        body: "Risk Line and Tile Drop use falling tiles. Standing on a fall platform is a time tax even if you do not die.",
      },
      {
        heading: "Signal Core",
        body: "Disc Yard and Bridge Rush mix beams and inflatable gates. Dash through the gate window; do not dash the beam.",
      },
    ],
  },
  "pocket-striker": {
    title: "Pocket Striker bank-shot tables",
    h1: "Par is a physics hint, not a grade",
    lead: "Eighteen tables publish par. A bank is a cushion then pocket on the same stroke. Perfect is hole-out in one.",
    sections: [
      {
        heading: "Workshop",
        body: "Bench Bank through Anvil Corner use force pads and vises. Thin power into a pad is cleaner than a full send over a bumper.",
      },
      {
        heading: "Garden",
        body: "Hedge Cut through Grove Corridor are corridors and islands. Stone Islands is a three-shot if you treat the islands as banks, not walls.",
      },
      {
        heading: "Arcade Lab",
        body: "Neon Bank through Pulse Circuit add portals and rotators. Portal Pair is a two-stroke if you enter the first ring with leftover spin.",
      },
    ],
  },
  "territory-rush": {
    title: "Territory Rush loop risk",
    h1: "The trail is the bet",
    lead: "A larger loop paints more floor and leaves a longer cuttable line. Score is paint share, plus cuts, plus the largest single fill.",
    sections: [
      {
        heading: "Small cash versus greedy loop",
        body: "Early 8–12 cell loops lock a home. The debug-sized parade loop is a late-clock play when bots are already busy.",
      },
      {
        heading: "Bot tells",
        body: "BRICK turns on a square. NEEDLE hunts exposed trails. SWEEP walks a wide rhythm. Cut NEEDLE's trail; do not race SWEEP to a wall.",
      },
      {
        heading: "When to ignore a bot",
        body: "A bot already looping far from you is free paint. Crossing the map to cut them spends the clock you needed for majority.",
      },
    ],
  },
  "crowd-control": {
    title: "Crowd Control gate math",
    h1: "Read +N against ×N before you steer",
    lead: "Gates add, multiply, or tax. A ×4 on 8 people is 32. A +30 on 40 people is 70. Tax after a multiply is how parades die.",
    sections: [
      {
        heading: "Early gates",
        body: "On a 10–12 opening pack, +N usually beats ×N. Multiply later, after you have a count worth doubling.",
      },
      {
        heading: "Hidden cuts",
        body: "Left routes can skip a fight and a tax. Right routes can feed a richer multiply. Ghosts remember which one they took.",
      },
      {
        heading: "Finish multiplier",
        body: "The end cash applies to whoever is still in the pack. Surviving a late tax with 80 people beats a greedy ×4 that arrives with 20.",
      },
    ],
  },
};

export function buildHowToPlay(slug: string): GuidePage {
  const game = getManifest(slug);
  if (!game) throw new Error(slug);
  const editorial = buildGameEditorial(slug);
  const tax = seoTaxonomy(slug);
  const path = `/games/${slug}/how-to-play`;
  const related = [
    { href: `/games/${slug}`, label: game.title },
    { href: "/guides", label: "Guides" },
    { href: "/games", label: "Games" },
    ...(editorial.strategyPath ? [{ href: editorial.strategyPath, label: `${game.title} strategy` }] : []),
  ];
  const entity = applyGate(
    {
      id: `howto:${slug}`,
      kind: "how-to-play",
      path,
      slug: `${slug}-how-to-play`,
      title: `How to play ${game.title}`,
      h1: `How to play ${game.title}`,
      description: `${game.title} controls, first 30 seconds, scoring, and the usual way a run ends. ${tax.kindLabel}.`,
      canonical: path,
      indexable: true,
      indexStatus: "INDEXABLE",
      indexReason: "authored how-to",
      updatedAt: isoDate(),
      image: gameImage(slug, "tile"),
      imageAlt: `${game.title} controls and opening play`,
      breadcrumbs: [
        { name: "Home", href: "/" },
        { name: "Games", href: "/games" },
        { name: game.title, href: `/games/${slug}` },
        { name: "How to play", href: path },
      ],
      relatedLinks: related,
      gameSlug: slug,
      parentPath: `/games/${slug}`,
    },
    `${editorial.overview} ${FIRST_30[slug]} ${FAILURE[slug]} ${game.howToPlay.join(" ")}`,
  );
  return {
    entity,
    gameSlug: slug,
    kind: "how-to-play",
    lead: editorial.overview,
    sections: [
      { heading: "Objective", body: editorial.objective },
      { heading: "Controls", body: "Desktop and touch use the same verbs.", bullets: game.controls.map((c) => `${c.input} — ${c.action}`) },
      { heading: "First 30 seconds", body: FIRST_30[slug]! },
      { heading: "Scoring", body: editorial.scoring },
      { heading: "How a run usually fails", body: FAILURE[slug]! },
      { heading: "Modes", body: editorial.modesNote },
      { heading: "Session", body: editorial.session },
    ],
    faq: editorial.faq,
  };
}

export function buildStrategy(slug: string): GuidePage | null {
  if (!hasStrategyPage(slug)) return null;
  const game = getManifest(slug)!;
  const row = STRATEGY[slug]!;
  const editorial = buildGameEditorial(slug);
  const path = `/games/${slug}/strategy`;
  const entity = applyGate(
    {
      id: `strategy:${slug}`,
      kind: "strategy",
      path,
      slug: `${slug}-strategy`,
      title: row.title,
      h1: row.h1,
      description: row.lead,
      canonical: path,
      indexable: true,
      indexStatus: "INDEXABLE",
      indexReason: "authored strategy",
      updatedAt: isoDate(),
      image: gameImage(slug, "backdrop"),
      imageAlt: `${game.title} intermediate decisions`,
      breadcrumbs: [
        { name: "Home", href: "/" },
        { name: "Games", href: "/games" },
        { name: game.title, href: `/games/${slug}` },
        { name: "Strategy", href: path },
      ],
      relatedLinks: [
        { href: `/games/${slug}`, label: game.title },
        { href: `/games/${slug}/how-to-play`, label: `How to play ${game.title}` },
        { href: "/guides", label: "Guides" },
        { href: "/games", label: "Games" },
      ],
      gameSlug: slug,
      parentPath: `/games/${slug}`,
    },
    `${row.lead} ${row.sections.map((s) => s.body).join(" ")}`,
  );
  return {
    entity,
    gameSlug: slug,
    kind: "strategy",
    lead: row.lead,
    sections: row.sections,
    faq: editorial.faq.slice(0, 2),
  };
}

export function allGuides(): GuidePage[] {
  const slugs = [
    "neon-drift",
    "velocity-run",
    "swarm-protocol",
    "sky-stack",
    "knockout-circuit",
    "pocket-striker",
    "territory-rush",
    "crowd-control",
  ];
  return slugs.flatMap((slug) => {
    const pages = [buildHowToPlay(slug)];
    const strategy = buildStrategy(slug);
    if (strategy) pages.push(strategy);
    return pages;
  });
}
