import type { CollectionRecord } from "./types";
import { SEO_UPDATED } from "./types";

export const COLLECTIONS: CollectionRecord[] = [
  {
    slug: "quick-games",
    title: "Quick Browser Games",
    h1: "Quick browser games",
    description:
      "Gamesweb sessions that resolve in about a minute: Sky Stack, Pocket Striker, Crowd Control, and Velocity Run.",
    rationale:
      "These four titles publish session hints at or under 90 seconds and retry instantly. They are the short-run shelf — not the six-minute Swarm protocol.",
    audience: "A spare minute, a phone, or a first Gamesweb session.",
    pick: "Sky Stack if you want one thumb. Pocket Striker if you want aim. Crowd Control if you want a route. Velocity if you want a short parkour clock.",
    games: ["sky-stack", "pocket-striker", "crowd-control", "velocity-run"],
    updatedAt: SEO_UPDATED,
  },
  {
    slug: "skill-games",
    title: "Skill Browser Games",
    h1: "Skill browser games",
    description:
      "Input-heavy Gamesweb titles where a missed timing is the whole story: Neon Drift, Velocity Run, Knockout Circuit, and Swarm Protocol.",
    rationale:
      "Each game tags itself skill and asks for a mechanical read — drift angle, jump buffer, dash window, or upgrade pick — rather than a single tap.",
    audience: "Players who want a miss to be the whole story.",
    pick: "Neon for analog slip. Velocity for route memory. Knockout for dash windows. Swarm when you want a longer build.",
    games: ["neon-drift", "velocity-run", "knockout-circuit", "swarm-protocol"],
    updatedAt: SEO_UPDATED,
  },
  {
    slug: "score-attack-games",
    title: "Score-Attack Browser Games",
    h1: "Score-attack browser games",
    description:
      "Higher-is-better Gamesweb runs: Neon Drift banks, Sky Stack floors, Swarm survival, Territory fills, and Crowd packs.",
    rationale:
      "These five manifests set scoreDirection to higher. Time-attack parkour and obstacle maps are excluded on purpose.",
    audience: "Anyone chasing a number that can still go up.",
    pick: "Neon and Swarm for high ceilings. Sky Stack and Crowd for short banks. Territory when you want a fill percentage.",
    games: ["neon-drift", "sky-stack", "swarm-protocol", "territory-rush", "crowd-control"],
    updatedAt: SEO_UPDATED,
  },
  {
    slug: "keyboard-games",
    title: "Keyboard Browser Games",
    h1: "Keyboard browser games",
    description:
      "Gamesweb titles with a real WASD or arrow map: Neon, Velocity, Swarm, Knockout, Territory, and Crowd.",
    rationale:
      "Each lists keyboard as a first-class input and exposes a movement grammar. Pocket Striker is pointer-first, so it stays off this shelf.",
    audience: "Desktop players who want WASD or arrows, not a pointer-only table.",
    pick: "Start with Velocity or Knockout if you want a clean map. Neon if you want analog feel. Swarm if you want hold-to-move plus dash.",
    games: ["neon-drift", "velocity-run", "swarm-protocol", "knockout-circuit", "territory-rush", "crowd-control"],
    updatedAt: SEO_UPDATED,
  },
  {
    slug: "mobile-games",
    title: "Mobile Browser Games",
    h1: "Mobile browser games",
    description:
      "Touch-ready Gamesweb games with on-screen controls: Sky Stack, Crowd Control, Pocket Striker, and Neon Drift.",
    rationale:
      "These four are the most honest thumbs-first sessions — one-thumb place, pack steer, pull-back aim, or a stick-assisted drift. All eight run on phones; this shelf is the ones that feel authored for a thumb.",
    audience: "Thumbs-first sessions on a 390-wide screen.",
    pick: "Sky Stack for one tap. Crowd for lane steer. Pocket for pull-back. Neon only if you want the assisted stick.",
    games: ["sky-stack", "crowd-control", "pocket-striker", "neon-drift"],
    updatedAt: SEO_UPDATED,
  },
  {
    slug: "competitive-games",
    title: "Competitive Browser Games",
    h1: "Competitive browser games",
    description:
      "Gamesweb games built for ghosts, same-seed challenges, and rival boards: Velocity Run, Knockout Circuit, Neon Drift, and Territory Rush.",
    rationale:
      "These four ship ghost support and/or async-duel challenge types with a clock or area that compares cleanly. They are not live multiplayer lobbies.",
    audience: "Friends sending a same-seed link, not a live lobby.",
    pick: "Velocity or Knockout for a clean clock. Neon for a score bank. Territory for a fill duel.",
    games: ["velocity-run", "knockout-circuit", "neon-drift", "territory-rush"],
    updatedAt: SEO_UPDATED,
  },
  {
    slug: "arcade-games",
    title: "Arcade Browser Games",
    h1: "Arcade browser games",
    description:
      "Short authored arcade loops on Gamesweb: Neon Drift, Sky Stack, Crowd Control, and Knockout Circuit.",
    rationale:
      "Arcade here means a readable retry loop with spectacle — slide, stack, pack, or toy-show race — not a meta progression hub.",
    audience: "Players who want a readable retry loop more than a campaign.",
    pick: "Neon for spectacle slide. Sky Stack for height. Crowd for a boulevard. Knockout for oversized props.",
    games: ["neon-drift", "sky-stack", "crowd-control", "knockout-circuit"],
    updatedAt: SEO_UPDATED,
  },
];

export function collectionBySlug(slug: string): CollectionRecord | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}
