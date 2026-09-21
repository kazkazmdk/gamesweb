export type CollectionDef = {
  slug: string;
  title: string;
  description: string;
  intro: string;
  games: string[];
  compare: string[];
};

export const COLLECTIONS: CollectionDef[] = [
  {
    slug: "quick-games",
    title: "Quick Gamesweb sessions",
    description: "Gamesweb runs that resolve in about a minute: Sky Stack, Pocket Striker, Crowd Control, and Velocity Run.",
    intro:
      "These four share a short retry loop. Sky Stack is one tap. Pocket is one shot. Crowd is a boulevard pack. Velocity is a rooftop split. Pick by how you want the minute to feel — not by a fake ranking.",
    games: ["sky-stack", "pocket-striker", "crowd-control", "velocity-run"],
    compare: ["Session length", "Input density", "Failure cost", "Score vs time"],
  },
  {
    slug: "skill-games",
    title: "High-skill Gamesweb titles",
    description: "Input-heavy Gamesweb games where a missed timing is the whole story: Neon Drift, Velocity Run, Knockout Circuit, and Swarm Protocol.",
    intro:
      "Neon asks for a held slide. Velocity asks for a line. Knockout asks for the next foam beat. Swarm asks for space inside a mass. Same platform, four different skills.",
    games: ["neon-drift", "velocity-run", "knockout-circuit", "swarm-protocol"],
    compare: ["Timing window", "Recovery", "Read-ahead", "Failure state"],
  },
  {
    slug: "high-score-games",
    title: "High-score Gamesweb games",
    description: "Gamesweb titles that bank a number: Neon Drift, Swarm Protocol, Sky Stack, Territory Rush, and Crowd Control.",
    intro:
      "Higher is better here. Neon banks a combo. Swarm banks salvage. Sky banks floors. Territory banks paint percent. Crowd banks pack size. The boards are not interchangeable.",
    games: ["neon-drift", "swarm-protocol", "sky-stack", "territory-rush", "crowd-control"],
    compare: ["What the number means", "How a combo dies", "Session length"],
  },
  {
    slug: "competitive-games",
    title: "Ghost and challenge games",
    description: "Gamesweb games built for ghosts, same-seed challenges, and rival boards: Velocity Run, Knockout Circuit, Neon Drift, and Territory Rush.",
    intro:
      "Velocity and Knockout keep ghosts as position. Neon keeps a drift tape. Territory is an arena percent. Challenge a friend on the same seed — do not invent a ranking.",
    games: ["velocity-run", "knockout-circuit", "neon-drift", "territory-rush"],
    compare: ["Ghost support", "Score direction", "Seed fairness"],
  },
  {
    slug: "mobile-friendly-games",
    title: "One-hand Gamesweb games",
    description: "Gamesweb games that stay readable on a phone: Sky Stack, Pocket Striker, Crowd Control, and Territory Rush.",
    intro:
      "Sky is a thumb tap. Pocket aims on a table. Crowd steers a pack. Territory claims a board. Desktop still works; these four do not require a keyboard to make sense.",
    games: ["sky-stack", "pocket-striker", "crowd-control", "territory-rush"],
    compare: ["Touch control", "Portrait vs landscape", "Readability at 390"],
  },
];

export function getCollection(slug: string) {
  return COLLECTIONS.find((c) => c.slug === slug);
}
