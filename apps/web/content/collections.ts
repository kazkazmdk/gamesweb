import type { CollectionRecord } from "./types";
import { SEO_UPDATED } from "./types";

export const COLLECTIONS: CollectionRecord[] = [
  {
    slug: "quick-games",
    title: "Quick Browser Games",
    h1: "Quick browser games",
    description:
      "Gamesweb sessions that resolve in about a minute: Sky Stack, Pocket Striker, Crowd Control, Velocity Run, and a 20–40 second Swing Vector canyon.",
    rationale:
      "These five publish session hints at or under 90 seconds and retry instantly. Swing Vector is a short latch-and-release. Prism Drop's 60–120 second well stays off this minute shelf, and so does the six-minute Swarm protocol.",
    audience: "A spare minute, a phone, or a first Gamesweb session.",
    pick: "Sky Stack if you want one thumb. Pocket Striker if you want aim. Crowd Control if you want a route. Velocity if you want a short parkour clock. Swing Vector if you want one canyon.",
    games: ["sky-stack", "pocket-striker", "crowd-control", "velocity-run", "swing-vector"],
    updatedAt: SEO_UPDATED,
  },
  {
    slug: "skill-games",
    title: "Skill Browser Games",
    h1: "Skill browser games",
    description:
      "Input-heavy Gamesweb titles where a missed timing is the whole story: Neon Drift, Velocity Run, Knockout Circuit, Swarm Protocol, and Swing Vector's orbit release.",
    rationale:
      "Each game tags itself skill and asks for a mechanical read — drift angle, jump buffer, dash window, upgrade pick, or a pylon orbit — rather than a single tap.",
    audience: "Players who want a miss to be the whole story.",
    pick: "Neon for analog slip. Velocity for route memory. Knockout for dash windows. Swarm when you want a longer build. Swing Vector when the read is the release angle.",
    games: ["neon-drift", "velocity-run", "knockout-circuit", "swarm-protocol", "swing-vector"],
    updatedAt: SEO_UPDATED,
  },
  {
    slug: "score-attack-games",
    title: "Score-Attack Browser Games",
    h1: "Score-attack browser games",
    description:
      "Higher-is-better Gamesweb runs: Neon Drift banks, Sky Stack floors, Swarm survival, Territory fills, Crowd packs, and Prism Drop's synthesis ladder.",
    rationale:
      "These six manifests set scoreDirection to higher. Prism Drop's ladder climbs. Swing Vector, parkour, and obstacle maps are millisecond clocks, so they stay off this shelf.",
    audience: "Anyone chasing a number that can still go up.",
    pick: "Neon and Swarm for high ceilings. Sky Stack and Crowd for short banks. Territory when you want a fill percentage. Prism Drop when the number is a fused rung.",
    games: ["neon-drift", "sky-stack", "swarm-protocol", "territory-rush", "crowd-control", "prism-drop"],
    updatedAt: SEO_UPDATED,
  },
  {
    slug: "keyboard-games",
    title: "Keyboard Browser Games",
    h1: "Keyboard browser games",
    description:
      "Gamesweb titles with a real key map: Neon, Velocity, Swarm, Knockout, Territory, Crowd, Prism Drop's cradle, and Swing Vector's hold-to-latch.",
    rationale:
      "Each lists keyboard as a first-class input and exposes a movement or latch grammar. Pocket Striker stays off this shelf because the shot is pointer-only.",
    audience: "Desktop players who want keys in the loop, not a pointer-only table.",
    pick: "Velocity or Knockout for a clean move map. Neon for analog feel. Swarm for hold-to-move plus dash. Prism Drop to slide a cradle. Swing Vector to hold a latch.",
    games: ["neon-drift", "velocity-run", "swarm-protocol", "knockout-circuit", "territory-rush", "crowd-control", "prism-drop", "swing-vector"],
    updatedAt: SEO_UPDATED,
  },
  {
    slug: "mobile-games",
    title: "Mobile Browser Games",
    h1: "Mobile browser games",
    description:
      "Touch-ready Gamesweb games with on-screen controls: Sky Stack, Crowd Control, Pocket Striker, Neon Drift, Prism Drop, and Swing Vector.",
    rationale:
      "These six are the honest thumbs-first sessions — place, pack steer, pull-back aim, a stick-assisted slide, a tilting merge well, and a hold-to-latch canyon. The whole catalog runs on phones; this shelf is the set authored around a thumb.",
    audience: "Thumbs-first sessions on a 390-wide screen.",
    pick: "Sky Stack for one tap. Crowd for lane steer. Pocket for pull-back. Neon for the assisted stick. Prism Drop to tilt a well. Swing Vector to hold and release.",
    games: ["sky-stack", "crowd-control", "pocket-striker", "neon-drift", "prism-drop", "swing-vector"],
    updatedAt: SEO_UPDATED,
  },
  {
    slug: "competitive-games",
    title: "Competitive Browser Games",
    h1: "Competitive browser games",
    description:
      "Gamesweb games built for ghosts, same-seed challenges, and rival boards: Velocity Run, Knockout Circuit, Neon Drift, Territory Rush, and Swing Vector canyons.",
    rationale:
      "These five ship ghost support or an async-duel type with a clock, a bank, or an area that compares cleanly. Swing Vector stores a canyon tape. They are recorded rivals, not a live room.",
    audience: "Friends sending a same-seed link, not a live lobby.",
    pick: "Velocity or Knockout for a clean clock. Neon for a score bank. Territory for a fill duel. Swing Vector for a canyon tape.",
    games: ["velocity-run", "knockout-circuit", "neon-drift", "territory-rush", "swing-vector"],
    updatedAt: SEO_UPDATED,
  },
  {
    slug: "arcade-games",
    title: "Arcade Browser Games",
    h1: "Arcade browser games",
    description:
      "Short authored arcade loops on Gamesweb: Neon Drift, Sky Stack, Crowd Control, Knockout Circuit, Prism Drop's well, and Swing Vector's slingshot.",
    rationale:
      "Arcade here means a readable retry loop with spectacle — slide, stack, pack, toy-show race, merging well, or pylon slingshot — not a meta progression hub.",
    audience: "Players who want a readable retry loop more than a campaign.",
    pick: "Neon for spectacle slide. Sky Stack for height. Crowd for a boulevard. Knockout for oversized props. Prism Drop for a fusing pile. Swing Vector for a slingshot gate.",
    games: ["neon-drift", "sky-stack", "crowd-control", "knockout-circuit", "prism-drop", "swing-vector"],
    updatedAt: SEO_UPDATED,
  },
  {
    slug: "physics-games",
    title: "Physics Browser Games",
    h1: "Physics browser games",
    description:
      "Five Gamesweb games where the miss is a physics event: a cushion bank, a prism fusion, a pylon slingshot, a held drift angle, or a sliced stacking slab.",
    rationale:
      "This shelf is momentum literacy. Pocket Striker resolves on cushions and pads. Prism Drop resolves when equal masses fuse inside a well. Swing Vector stores pace in a tethered arc. Neon Drift scores slip. Sky Stack cuts leftover width. None of them are a naked timer.",
    audience: "Players who want weight, bounce, and a readable collision more than a route chart.",
    pick: "Pocket for cushions. Prism for fusing masses. Swing for the tether. Neon for slip angle. Sky Stack for the sliced overhang.",
    games: ["pocket-striker", "prism-drop", "swing-vector", "neon-drift", "sky-stack"],
    updatedAt: SEO_UPDATED,
  },
  {
    slug: "puzzle-merge-games",
    title: "Puzzle & Strategy Browser Games",
    h1: "Puzzle and strategy browser games",
    description:
      "Planning-first Gamesweb boards: fuse Prism Drop's 2-to-2048 ladder, budget Pocket Striker strokes, close Territory Rush loops, and choose Crowd Control gates before the pack arrives.",
    rationale:
      "The intent is a plan that survives contact. Prism Drop is a containment ladder of doubling values. Pocket Striker is a stroke budget against a printed par. Territory Rush is loop geometry on a floor. Crowd Control is gate arithmetic. Reflex shelves live elsewhere.",
    audience: "People who like to read the position, then commit one decisive move.",
    pick: "Prism when you want the ladder. Pocket when you want par. Territory when you want area. Crowd when you want the richer gate.",
    games: ["prism-drop", "pocket-striker", "territory-rush", "crowd-control"],
    updatedAt: SEO_UPDATED,
  },
  {
    slug: "one-button-games",
    title: "One-Button & Simple Control Browser Games",
    h1: "One-button browser games",
    description:
      "Gamesweb sessions with a tiny verb set: place a slab, hold a grapple, drop a prism and tilt the well, or steer a pack. No camera rig and no upgrade tree.",
    rationale:
      "The control surface is the filter. Sky Stack is a single place. Swing Vector is hold, then release. Prism Drop is aim, drop, and one Pulse Tilt. Crowd Control steers, and the dash exists only when a gate demands it.",
    audience: "Anyone who wants a phone-sized verb instead of a crowded keymap.",
    pick: "Sky Stack for a tap. Swing Vector for a hold. Prism Drop for a drop plus a tilt. Crowd Control if you still want a lane choice.",
    games: ["sky-stack", "swing-vector", "prism-drop", "crowd-control"],
    updatedAt: SEO_UPDATED,
  },
  {
    slug: "play-with-friends",
    title: "Browser Games to Play With Friends",
    h1: "Browser games to play with friends",
    description:
      "Group-friendly Gamesweb sessions you can hand across a couch: Knockout banner times, Velocity rooftop splits, Territory paint, Prism wells, and Pocket tables.",
    rationale:
      "A friend shows up as a turn, a shared screen, or a result you can brag about later. Knockout Circuit and Velocity Run compare banner times. Territory Rush compares paint. Pocket Striker compares putts. Prism Drop is the well you pass between drops.",
    audience: "Groups who want a shared result without sitting in a waiting room.",
    pick: "Knockout or Velocity for a banner. Territory for paint. Prism for turn-taking drops. Pocket for a putt dare.",
    games: ["knockout-circuit", "velocity-run", "territory-rush", "prism-drop", "pocket-striker"],
    updatedAt: SEO_UPDATED,
  },
];

export function collectionBySlug(slug: string): CollectionRecord | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}
