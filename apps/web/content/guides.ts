import { getManifest } from "@gamesweb/game-sdk";

export type GuideKind = "how-to-play" | "tips";

export type GuidePage = {
  slug: string;
  kind: GuideKind;
  title: string;
  description: string;
  problem: string;
  sections: Array<{ heading: string; body: string[] }>;
};

const GAMES = [
  "neon-drift",
  "velocity-run",
  "swarm-protocol",
  "sky-stack",
  "knockout-circuit",
  "pocket-striker",
  "territory-rush",
  "crowd-control",
] as const;

const EXTRA: Record<string, { how: GuidePage["sections"]; tips: GuidePage["sections"] }> = {
  "neon-drift": {
    how: [
      {
        heading: "The scoring loop",
        body: [
          "LIVE is the drift you are holding. BANK is what you cash when the slide ends cleanly.",
          "A combo multiplies the bank. Straightening out or dropping below drift speed fades the combo.",
          "Tracks: Foundation (harbour), Technical (district), Velocity (ridge). Keys 1 / 2 / 3 switch them.",
        ],
      },
      {
        heading: "First 30 seconds",
        body: [
          "Accelerate into the first corner and hold Space or the stick into the slide.",
          "Countersteer to keep the angle. The first teaching corner is authored to show LIVE rising.",
          "Two laps finish the circuit. R retries instantly.",
        ],
      },
    ],
    tips: [
      {
        heading: "Keep the combo",
        body: [
          "Do not straighten between linked hairpins. The combo is the score.",
          "Near-miss the inner curb for a bank bonus — Paint Swap in achievements.",
          "Grass is recoverable. Rejoin asphalt; Dirt Warning unlocks if you do.",
        ],
      },
      {
        heading: "Read the roadside",
        body: [
          "Service cubes and sodium lamps mark the industrial pull-off.",
          "A dark collar is the tunnel. Chevrons mark the mountain hairpin.",
          "If the frame is only navy void, you are off the authored shoulder — steer back to the wet line.",
        ],
      },
    ],
  },
  "velocity-run": {
    how: [
      {
        heading: "The clock",
        body: [
          "Lower is better. Death closes the attempt. Checkpoints print splits against your ghost — they do not save you.",
          "Safe ledges sit low. Fast ledges sit high. Expert skips skip the stairs.",
          "Hub lists 12 authored courses. Keys 1 / 2 / 3 switch the three worlds: HVAC roof, transit canyon, telecom ascent.",
        ],
      },
    ],
    tips: [
      {
        heading: "Momentum",
        body: [
          "Jump buffer and coyote time are real. Tap early at the lip, not after you fall.",
          "Fast-fall (S / ↓) is a commit, not a cancel. Use it onto a lower safe ledge.",
          "Read the next kit before you jump: HVAC units, glass canyon, crane, or masts.",
        ],
      },
    ],
  },
  "swarm-protocol": {
    how: [
      {
        heading: "The deck",
        body: [
          "Weapons track the nearest hostile. Skill is space, dash i-frames, and the three-card build.",
          "Cores level you. The late Core is victory. Continue Endless is optional after the result.",
          "Families have silhouettes: skitterers, swarmers, spores, shells, elites, boss mass.",
        ],
      },
    ],
    tips: [
      {
        heading: "Peak density",
        body: [
          "When the deck fills, kite around reactors — do not stand in the fungus pocket.",
          "Dash through elites only on the telegraph. Orbiting shield and chain rewrite the sixth minute.",
          "Prioritize elites and splitters before the mass. The mass is score; the elite is the wipe.",
        ],
      },
    ],
  },
  "sky-stack": {
    how: [
      {
        heading: "Place",
        body: [
          "Space, click, or tap places the moving slab. Perfect overlap keeps width and feeds fever.",
          "A miss ends the climb. Retry is instant. Height changes the sky: peach, blue, gold, lavender.",
        ],
      },
    ],
    tips: [
      {
        heading: "Fever",
        body: [
          "Fever is a long perfect streak. Pitch rises and the score multiplies. Do not chase fever by placing late.",
          "The leftover slab is the next width. A sliver still climbs; a panic tap does not.",
        ],
      },
    ],
  },
  "knockout-circuit": {
    how: [
      {
        heading: "The show",
        body: [
          "Move, jump, dash. Three maps: factory lot, skyworks, signal. Ghosts are position markers.",
          "Obstacles are authored toys: hammer, inflate gate, disc — not anonymous bars.",
          "Keys 1 / 2 / 3 switch maps.",
        ],
      },
    ],
    tips: [
      {
        heading: "Read the next foam",
        body: [
          "The next danger is in frame before it matters. Wait the spinner, then dash.",
          "Fall tiles and timing doors are show beats. Do not treat them like Velocity roofs.",
        ],
      },
    ],
  },
  "pocket-striker": {
    how: [
      {
        heading: "The table",
        body: [
          "Aim on the felt. Release to strike. Par is per layout: workshop, garden, arcade.",
          "The board sits in a rec-room. Clutter stays off the shot path.",
        ],
      },
    ],
    tips: [
      {
        heading: "Contact",
        body: [
          "Bank the cushion, not the lamp. The prediction dots are the line.",
          "Each layout is a different physical setup — not a hue swap. Reset aim after a plaque flip.",
        ],
      },
    ],
  },
  "territory-rush": {
    how: [
      {
        heading: "Paint",
        body: [
          "Trail out of your color, close a loop, own the inside. Percent is the score.",
          "Bots cut open trails. A long trail is more paint and more risk.",
          "Houses sit on unclaimed cells. Owned paint hides them — the fill is the picture.",
        ],
      },
    ],
    tips: [
      {
        heading: "Loop risk",
        body: [
          "Short loops are safe and small. The authored closeLoop capture is the map-scale beat.",
          "Cut a bot trail when they overextend. Half-map (50%) unlocks Half Map.",
        ],
      },
    ],
  },
  "crowd-control": {
    how: [
      {
        heading: "The pack",
        body: [
          "Steer the pack into +N and ×N gates. Tax / subtract gates shrink it.",
          "10 is a crew. 30 is a pack. 80+ is a mass. 120 is a horde.",
          "Finish arena multiplies what you kept.",
        ],
      },
    ],
    tips: [
      {
        heading: "Read the signs",
        body: [
          "Gates are huge graphic boards, not thin bars. Commit early — the decision frame is the sign.",
          "After a multiply, the pack re-expands. After a tax, it compresses. Clash only when the count wins.",
        ],
      },
    ],
  },
};

export function guidePages(): GuidePage[] {
  return GAMES.flatMap((slug) => {
    const game = getManifest(slug);
    if (!game) return [];
    const extra = EXTRA[slug];
    const how: GuidePage = {
      slug,
      kind: "how-to-play",
      title: `How to play ${game.title}`,
      description: `${game.title} how-to-play: ${game.howToPlay[0]} ${game.sessionHint}.`,
      problem: `Learn the real ${game.title} loop before the first retry.`,
      sections: [
        { heading: "Objective", body: [game.description, game.tagline] },
        { heading: "First run", body: game.howToPlay },
        {
          heading: "Controls",
          body: game.controls.map((c) => `${c.input}: ${c.action}`),
        },
        ...extra.how,
      ],
    };
    const tips: GuidePage = {
      slug,
      kind: "tips",
      title: `${game.title} strategy and tips`,
      description: `${game.title} tips from the live mechanics — not generic high-score advice.`,
      problem: `Improve a real ${game.title} run using the scoring and failure rules in the game.`,
      sections: extra.tips,
    };
    return [how, tips];
  });
}

export function getGuide(slug: string, kind: GuideKind) {
  return guidePages().find((g) => g.slug === slug && g.kind === kind);
}
