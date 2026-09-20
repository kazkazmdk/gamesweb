import { MAPS } from "../../../../games/knockout-circuit/src/systems/maps";
import { TRACKS } from "../../../../games/neon-drift/src/systems/track";
import { LAYOUTS } from "../../../../games/pocket-striker/src/systems/layouts";
import { COURSES } from "../../../../games/velocity-run/src/systems/courses";
import { applyGate } from "./quality";
import { gameImage, isoDate } from "./site";
import type { IndexableEntity, PageKind } from "./types";

export type ContentUnit = {
  entity: IndexableEntity;
  gameSlug: string;
  unitKind: "track" | "course" | "map" | "table";
  sourceId: string;
  facts: Record<string, string | number | boolean>;
  environment: string;
  advice: string;
  siblings: Array<{ href: string; label: string }>;
};

const TRACK_NOTES: Record<string, { env: string; advice: string; title: string; h1: string; desc: string }> = {
  foundation: {
    title: "Harbour Loop — Neon Drift track",
    h1: "Harbour Loop",
    env: "Built-up harbour: sodium lamps, wet asphalt, warehouse blocks on the curb. The default camera sits inside the buildings, not in empty navy.",
    advice:
      "Two boost samples sit near 22% and 63% of the lap. The mid-lap pinch (t 0.16–0.28) is where a fat combo usually dies if you refuse to countersteer. Bank before the harbour wall, not after.",
    desc: "Neon Drift's teaching circuit. Wider asphalt, two boost ribbons, three sectors. Score still only banks when the slide ends.",
  },
  technical: {
    title: "Hairpin District — Neon Drift track",
    h1: "Hairpin District",
    env: "Tunnel and service-area corners: tighter walls, sodium pools, service bays instead of open harbour.",
    advice:
      "Three authored pinches (0.20–0.38, 0.48–0.62, 0.74–0.86) drop width to 136–152. Boosts sit at 34% and 79%. Commit, switch, recover — the subtitle is the line.",
    desc: "The technical Neon Drift circuit. Narrower width samples and two boosts. A straightened exit is a grass reset.",
  },
  velocity: {
    title: "Ridge Sweep — Neon Drift track",
    h1: "Ridge Sweep",
    env: "Touge / roadside: long ridge, earth shoulders, cyan race identity on a night road.",
    advice:
      "The long corner (0.08–0.42) is 220 wide on purpose so you can hold a slide across a sector. Bank after the ridge, not in the middle of it, unless the wall is already in the headlights.",
    desc: "Neon Drift's long-corner circuit. Wider samples, two boosts, cyan accent. The sport is holding the slide, not clipping apex bricks.",
  },
};

const COURSE_NOTES: Record<string, { env: string; advice: string }> = {
  "course-1": {
    env: "HVAC / service roof. Ivory concrete, orange safety, plant boxes inside the opening camera.",
    advice: "Gate A is the teaching line: low safe stairs, high fast pads, one expert skip over the first spike. Platinum is 32.0s.",
  },
  "course-1b": {
    env: "HVAC roof with scaffold stairs. Same service kit, more vertical.",
    advice: "Scaffold Run climbs then crosses. The laser on the expert pad is a death, not a time tax. Platinum 28.0s.",
  },
  "course-1c": {
    env: "Service roof timing pads — the 'Arrow Yard' HVAC deck.",
    advice: "Pads are short. Buffer the jump before each lip. Platinum 30.0s.",
  },
  "course-1d": {
    env: "Skyline Drill: long HVAC gaps with a piston on the late fast pad.",
    advice: "The expert 70-wide pad is a commit. Missing it is a death. Platinum 34.0s.",
  },
  "course-2": {
    env: "Transit / glass canyon. Steel-blue sky, crane silhouettes, glass edges.",
    advice: "Needle is switchbacks. Waiting on the low line is how silver happens. Platinum 48.0s.",
  },
  "course-2b": {
    env: "Fan Corridor — transit fans and glass rails.",
    advice: "The corridor punishes late fast-falls. Hold the high fans. Check the authored medals before you invent a skip.",
  },
  "course-2c": {
    env: "Metro Core glass canyon with crane spans.",
    advice: "Metro Core is a routing exam: safe downstairs, fast upstairs, expert across the void.",
  },
  "course-2d": {
    env: "Energy Gates in the transit kit — glowing gate arches, not rooftop HVAC.",
    advice: "Gates are timing, not walls. A buffered jump through a closing gate is the gold line.",
  },
  "course-3": {
    env: "Communications / high-rise finish. Peach sky, antenna masts, glass parapets.",
    advice: "Rushline is the ascent opener. Platinum  assumes you already skip the first stairs.",
  },
  "course-3b": {
    env: "Wind Spine communications mast run.",
    advice: "Crosswinds are visual. The clock loss is the low safe walk. Take the spine.",
  },
  "course-3c": {
    env: "Drop Gallery — high-rise voids with a communications kit.",
    advice: "Fast-fall is the verb. Holding jump into a gallery drop is a death.",
  },
  "course-3d": {
    env: "Expert Ascent, the communications finish.",
    advice: "Platinum is a clean ghost. If you still need the safe stairs, you are on silver.",
  },
};

const MAP_NOTES: Record<string, { env: string; advice: string }> = {
  "map-a": {
    env: "Factory floor, yellow foam, opening spinner and a vertical gate.",
    advice: "Starter Gates: walk the first spinner, take the high fast pads after the gate, dash only the last spinner window.",
  },
  "map-b": {
    env: "Factory liftwell — vertical movers and beams.",
    advice: "Liftwell is a climb. Beams are timed. The fast pad at 520,1120 skips a mover wait.",
  },
  "map-c": {
    env: "Skyworks — warm sky, falling tiles, expert upper line.",
    advice: "Risk Line: the expert route is real (720/420, 920/340, 1240/220). The safe floor still finishes; it does not gold.",
  },
  "map-d": {
    env: "Factory hammer run — coral foam hammer (spinner) and a late beam.",
    advice: "Hammer Run is a read of two spinner phases. The fast pad at 1920 is the only skip.",
  },
  "map-e": {
    env: "Signal Core disc yard — plastic disc beams, cyan ground.",
    advice: "Disc Yard: do not dash the beam. Dash the inflatable gate at 1180.",
  },
  "map-f": {
    env: "Factory conveyor — paired movers, then a beam.",
    advice: "Conveyor: two movers in antiphase. Standing on the first until the second arrives is the silver habit.",
  },
  "map-g": {
    env: "Skyworks tile drop — three falling tiles before a spinner.",
    advice: "Tile Drop: a fall platform is a time tax even if you live. Step through, do not camp.",
  },
  "map-h": {
    env: "Signal Core bridge — mover, beam, spinner, expert island, inflatable gate.",
    advice: "Bridge Rush: the 1720 expert pad plus the 1960 fall is the greedy line. Safe floor still exists under the gate.",
  },
};

const TABLE_NOTES: Record<string, { env: string; advice: string }> = {
  l1: { env: "Workshop bench with a long rail and one bumper.", advice: "Bench Bank, par 2. Use the force pad at 200,360 to start the bank; the bumper at 250,300 is a redirect, not a wall." },
  l2: { env: "Workshop vise with a moving blocker in the corridor.", advice: "Vise Run, par 3. Wait a half-cycle on the y-blocker or bank the lower vise mouth." },
  l3: { env: "Workshop clamp arm — a rotator in the lower well.", advice: "Clamp Arm, par 3. The rotator at 360,280 sweeps 110px. Enter after it passes the hole line." },
  l4: { env: "Workshop crate — a breakable 2-hit plank guards the hole.", advice: "Crate Break, par 3. Spend stroke 1 on the crate if you cannot thread the 22px shelf." },
  l5: { env: "Workshop shelf with a timed gate.", advice: "Shelf Gate, par 3. The gate phase 0 / speed 1.6 opens a vertical window above the shelf." },
  l6: { env: "Workshop anvil corner, bumper plus a push pad.", advice: "Anvil Corner, par 2. The pad at 500,80 shoves left-down into the hole if you arrive thin." },
  l7: { env: "Garden hedge with a center bumper.", advice: "Hedge Cut, par 2. A center bumper bank is cleaner than threading both hedge gaps." },
  l8: { env: "Garden stone islands — three blocks and a pad.", advice: "Stone Islands, par 3. Treat the islands as banks. The pad at 120,180 starts the first hop." },
  l9: { env: "Garden trellis with a slow gate.", advice: "Trellis Gate, par 3. Gate speed 1.3, phase 1. Wait the window; the trellis wall is solid." },
  l10: { env: "Garden fountain — rotator stacked on a bumper.", advice: "Fountain Spin, par 3. The 130px arm and the 18px bumper share a center. Thin power after the arm passes." },
  l11: { env: "Garden bridge with a 1-hp breakable plank.", advice: "Bridge Break, par 3. One stroke breaks the plank. A bank around it is the ace if you already know the angle." },
  l12: { env: "Garden grove — three corridor walls.", advice: "Grove Corridor, par 3. No gadgets. The line is three gaps. Over-power bounces you back a stroke." },
  l13: { env: "Arcade neon bench with a bumper and an up-pad.", advice: "Neon Bank, par 2. Same idea as Bench Bank, hotter felt. The pad is vertical (−80)." },
  l14: { env: "Arcade portal pair around a tall wall.", advice: "Portal Pair, par 2. Enter the 160,400 ring toward the 560,80 exit. Leftover spin is the hole." },
  l15: { env: "Arcade lab bounce — two walls and a center bumper.", advice: "Lab Bounce, par 3. The 24px bumper is the bank. Full power into it is a wasted stroke." },
  l16: { env: "Arcade arc gate with a side pad.", advice: "Arc Gate, par 3. Pad at 140,200 shoves +60x into the gate window (speed 1.8)." },
  l17: { env: "Arcade coil — rotator plus a moving shelf.", advice: "Coil Sweep, par 3. Time the y-blocker (80–360) and the 100px coil together, or take two strokes." },
  l18: { env: "Arcade pulse circuit — portals, a 2-hp wall, a bumper.", advice: "Pulse Circuit, par 4. Break the 500,18 wall or portal around it. Par 4 is honest." },
};

function medalSec(ms: number) {
  return (ms / 1000).toFixed(1);
}

function courseFacts(course: (typeof COURSES)[number]) {
  const cps = course.solids.filter((s) => s.kind === "checkpoint").length;
  const experts = course.solids.filter((s) => s.route === "expert").length;
  const hazards = course.solids.filter((s) => s.kind === "spike" || s.kind === "laser" || s.kind === "piston" || s.kind === "hazard").length;
  return {
    world: course.world,
    width: course.width,
    height: course.height,
    checkpoints: cps,
    expertPads: experts,
    hazards,
    platinumSec: medalSec(course.medals.platinum),
    goldSec: medalSec(course.medals.gold),
    silverSec: medalSec(course.medals.silver),
    bronzeSec: medalSec(course.medals.bronze),
  };
}

function mapFacts(map: (typeof MAPS)[number]) {
  const counts = map.solids.reduce<Record<string, number>>((acc, s) => {
    acc[s.kind] = (acc[s.kind] ?? 0) + 1;
    return acc;
  }, {});
  const experts = map.solids.filter((s) => s.route === "expert").length;
  const fast = map.solids.filter((s) => s.route === "fast").length;
  return {
    env: map.env,
    width: map.width,
    height: map.height,
    experts,
    fastPads: fast,
    spinners: counts.spinner ?? 0,
    movers: counts.mover ?? 0,
    gates: counts.gate ?? 0,
    falls: counts.fall ?? 0,
    beams: counts.beam ?? 0,
  };
}

function tableFacts(table: (typeof LAYOUTS)[number]) {
  return {
    theme: table.theme,
    par: table.par,
    walls: table.walls.length,
    bumpers: table.bumpers?.length ?? 0,
    rotators: table.rotators?.length ?? 0,
    portals: table.portals?.length ?? 0,
    forcePads: table.forcePads?.length ?? 0,
    breakables: table.breakables?.length ?? 0,
    gates: table.gates?.length ?? 0,
    moving: table.movingBlockers?.length ?? 0,
  };
}

function siblingLinks(gameSlug: string, kind: string, items: Array<{ id: string; name: string }>, id: string) {
  const i = items.findIndex((x) => x.id === id);
  const prev = items[i - 1];
  const next = items[i + 1];
  const folder = kind === "track" ? "tracks" : kind === "course" ? "courses" : kind === "map" ? "maps" : "tables";
  const links = [];
  if (prev) links.push({ href: `/games/${gameSlug}/${folder}/${prev.id}`, label: prev.name });
  if (next) links.push({ href: `/games/${gameSlug}/${folder}/${next.id}`, label: next.name });
  return links;
}

function unitEntity(input: {
  kind: PageKind;
  gameSlug: string;
  sourceId: string;
  path: string;
  title: string;
  h1: string;
  description: string;
  imageAlt: string;
  image: string;
  parentLabel: string;
  related: IndexableEntity["relatedLinks"];
  body: string;
}): IndexableEntity {
  return applyGate(
    {
      id: `unit:${input.gameSlug}:${input.sourceId}`,
      kind: input.kind,
      path: input.path,
      slug: input.sourceId,
      title: input.title,
      h1: input.h1,
      description: input.description,
      canonical: input.path,
      indexable: true,
      indexStatus: "INDEXABLE",
      indexReason: "authored content unit",
      updatedAt: isoDate(),
      image: input.image,
      imageAlt: input.imageAlt,
      breadcrumbs: [
        { name: "Home", href: "/" },
        { name: "Games", href: "/games" },
        { name: input.parentLabel, href: `/games/${input.gameSlug}` },
        { name: input.h1, href: input.path },
      ],
      relatedLinks: input.related,
      gameSlug: input.gameSlug,
      parentPath: `/games/${input.gameSlug}`,
    },
    input.body,
    { gameBacked: true },
  );
}

export function neonTracks(): ContentUnit[] {
  const items = TRACKS.map((t) => ({ id: t.id, name: t.name }));
  return TRACKS.map((track) => {
    const note = TRACK_NOTES[track.id]!;
    const path = `/games/neon-drift/tracks/${track.id}`;
    const siblings = siblingLinks("neon-drift", "track", items, track.id);
    const facts = {
      id: track.id,
      name: track.name,
      subtitle: track.subtitle,
      worldW: track.worldW,
      worldH: track.worldH,
      boosts: track.boostAt.length,
      sectors: 3,
    };
    const related = [
      { href: "/games/neon-drift", label: "Neon Drift" },
      { href: "/games/neon-drift/how-to-play", label: "How to play" },
      { href: "/games/neon-drift/strategy", label: "Strategy" },
      ...siblings,
    ];
    return {
      entity: unitEntity({
        kind: "track",
        gameSlug: "neon-drift",
        sourceId: track.id,
        path,
        title: note.title,
        h1: note.h1,
        description: note.desc,
        image: gameImage("neon-drift", track.id === "foundation" ? "hero" : track.id === "technical" ? "tile" : "backdrop"),
        imageAlt: `${track.name} night circuit in Neon Drift`,
        parentLabel: "Neon Drift",
        related,
        body: `${note.env} ${note.advice} ${track.subtitle} boosts ${track.boostAt.join(",")}`,
      }),
      gameSlug: "neon-drift",
      unitKind: "track",
      sourceId: track.id,
      facts,
      environment: note.env,
      advice: note.advice,
      siblings,
    };
  });
}

export function velocityCourses(): ContentUnit[] {
  const items = COURSES.map((c) => ({ id: c.id, name: c.name }));
  return COURSES.map((course) => {
    const note = COURSE_NOTES[course.id];
    if (!note) throw new Error(`Missing course note for ${course.id}`);
    const facts = courseFacts(course);
    const path = `/games/velocity-run/courses/${course.id}`;
    const siblings = siblingLinks("velocity-run", "course", items, course.id);
    const worldLabel = course.world === "training" ? "HVAC / service roof" : course.world === "transit" ? "crane / glass canyon" : "communications / high-rise";
    const related = [
      { href: "/games/velocity-run", label: "Velocity Run" },
      { href: "/games/velocity-run/how-to-play", label: "How to play" },
      { href: "/games/velocity-run/strategy", label: "Strategy" },
      ...siblings,
    ];
    return {
      entity: unitEntity({
        kind: "course",
        gameSlug: "velocity-run",
        sourceId: course.id,
        path,
        title: `${course.name} — Velocity Run ${worldLabel}`,
        h1: course.name,
        description: `${course.name} is a ${course.world} rooftop course in Velocity Run. ${course.subtitle}. Platinum ${facts.platinumSec}s, ${facts.checkpoints} checkpoints, ${facts.expertPads} expert pads.`,
        image: gameImage("velocity-run", course.world === "training" ? "hero" : course.world === "transit" ? "tile" : "backdrop"),
        imageAlt: `${course.name} on the ${worldLabel}`,
        parentLabel: "Velocity Run",
        related,
        body: `${note.env} ${note.advice} ${JSON.stringify(facts)}`,
      }),
      gameSlug: "velocity-run",
      unitKind: "course",
      sourceId: course.id,
      facts,
      environment: note.env,
      advice: note.advice,
      siblings,
    };
  });
}

export function knockoutMaps(): ContentUnit[] {
  const items = MAPS.map((m) => ({ id: m.id, name: m.name }));
  return MAPS.map((map) => {
    const note = MAP_NOTES[map.id];
    if (!note) throw new Error(`Missing map note for ${map.id}`);
    const facts = mapFacts(map);
    const path = `/games/knockout-circuit/maps/${map.id}`;
    const siblings = siblingLinks("knockout-circuit", "map", items, map.id);
    const related = [
      { href: "/games/knockout-circuit", label: "Knockout Circuit" },
      { href: "/games/knockout-circuit/how-to-play", label: "How to play" },
      { href: "/games/knockout-circuit/strategy", label: "Strategy" },
      ...siblings,
    ];
    return {
      entity: unitEntity({
        kind: "map",
        gameSlug: "knockout-circuit",
        sourceId: map.id,
        path,
        title: `${map.name} — Knockout Circuit ${map.env} map`,
        h1: map.name,
        description: `${map.name} is a ${map.env} obstacle map. ${facts.spinners} spinners, ${facts.movers} movers, ${facts.experts} expert pads. Ghosts are recorded runs.`,
        image: gameImage("knockout-circuit", map.env === "factory" ? "hero" : map.env === "skyworks" ? "tile" : "backdrop"),
        imageAlt: `${map.name} ${map.env} obstacle map`,
        parentLabel: "Knockout Circuit",
        related,
        body: `${note.env} ${note.advice} ${JSON.stringify(facts)}`,
      }),
      gameSlug: "knockout-circuit",
      unitKind: "map",
      sourceId: map.id,
      facts,
      environment: note.env,
      advice: note.advice,
      siblings,
    };
  });
}

export function pocketTables(): ContentUnit[] {
  const items = LAYOUTS.map((t) => ({ id: t.id, name: t.name }));
  return LAYOUTS.map((table) => {
    const note = TABLE_NOTES[table.id];
    if (!note) throw new Error(`Missing table note for ${table.id}`);
    const facts = tableFacts(table);
    const path = `/games/pocket-striker/tables/${table.id}`;
    const siblings = siblingLinks("pocket-striker", "table", items, table.id);
    const related = [
      { href: "/games/pocket-striker", label: "Pocket Striker" },
      { href: "/games/pocket-striker/how-to-play", label: "How to play" },
      { href: "/games/pocket-striker/strategy", label: "Strategy" },
      ...siblings,
    ];
    const gadgets = [
      facts.bumpers && `${facts.bumpers} bumper`,
      facts.rotators && `${facts.rotators} rotator`,
      facts.portals && `${facts.portals} portal`,
      facts.forcePads && `${facts.forcePads} force pad`,
      facts.breakables && `${facts.breakables} breakable`,
      facts.gates && `${facts.gates} gate`,
      facts.moving && `${facts.moving} mover`,
    ].filter(Boolean);
    return {
      entity: unitEntity({
        kind: "table",
        gameSlug: "pocket-striker",
        sourceId: table.id,
        path,
        title: `${table.name} — Pocket Striker ${table.theme} table`,
        h1: table.name,
        description: `${table.name} is a ${table.theme} table, par ${table.par}. ${gadgets.join(", ") || "Corridor only"}. Strokes are the score.`,
        image: gameImage("pocket-striker", table.theme === "workshop" ? "hero" : table.theme === "garden" ? "tile" : "backdrop"),
        imageAlt: `${table.name} ${table.theme} table`,
        parentLabel: "Pocket Striker",
        related,
        body: `${note.env} ${note.advice} ${JSON.stringify(facts)}`,
      }),
      gameSlug: "pocket-striker",
      unitKind: "table",
      sourceId: table.id,
      facts,
      environment: note.env,
      advice: note.advice,
      siblings,
    };
  });
}

export function allContentUnits(): ContentUnit[] {
  return [...neonTracks(), ...velocityCourses(), ...knockoutMaps(), ...pocketTables()];
}

export function findContentUnit(gameSlug: string, kind: ContentUnit["unitKind"], id: string) {
  return allContentUnits().find((u) => u.gameSlug === gameSlug && u.unitKind === kind && u.sourceId === id);
}

export function unitsForGame(gameSlug: string) {
  return allContentUnits().filter((u) => u.gameSlug === gameSlug);
}
