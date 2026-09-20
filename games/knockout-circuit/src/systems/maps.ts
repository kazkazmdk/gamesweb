export type Kind = "solid" | "spike" | "spinner" | "mover" | "gate" | "fall" | "finish" | "spawn" | "beam";

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: Kind;
  route?: "safe" | "fast" | "expert";
  phase?: number;
};

export type MapEnv = "factory" | "skyworks" | "signal";

export type MapDef = {
  id: string;
  name: string;
  width: number;
  height: number;
  solids: Rect[];
  env: MapEnv;
  theme: { sky: number; ground: number; accent: number; danger: number };
};

function plat(x: number, y: number, w: number, route: Rect["route"] = "safe"): Rect {
  return { x, y, w, h: 22, kind: "solid", route };
}

export const MAPS: MapDef[] = [
  {
    id: "map-a",
    name: "Starter Gates",
    width: 2800,
    height: 720,
    env: "factory",
    theme: { sky: 0x5ad0e8, ground: 0xffd24a, accent: 0xff6b4a, danger: 0xff3b6a },
    solids: [
      { x: 40, y: 580, w: 40, h: 40, kind: "spawn" },
      plat(20, 620, 280),
      { x: 360, y: 500, w: 70, h: 70, kind: "spinner", phase: 0 },
      plat(320, 620, 220),
      { x: 620, y: 520, w: 160, h: 22, kind: "mover", phase: 0 },
      plat(860, 620, 200),
      { x: 1120, y: 430, w: 24, h: 190, kind: "gate", phase: 0 },
      plat(1080, 620, 260),
      plat(1400, 540, 180, "fast"),
      plat(1640, 460, 140, "fast"),
      plat(1880, 620, 240),
      { x: 2160, y: 520, w: 70, h: 70, kind: "spinner", phase: 1.2 },
      plat(2100, 620, 260),
      { x: 2480, y: 280, w: 36, h: 340, kind: "finish" },
      plat(2400, 620, 280),
    ],
  },
  {
    id: "map-b",
    name: "Liftwell",
    width: 1600,
    height: 2200,
    env: "factory",
    theme: { sky: 0x4ad4e0, ground: 0x4ad4e8, accent: 0xff6b4a, danger: 0xff4d62 },
    solids: [
      { x: 80, y: 2040, w: 40, h: 40, kind: "spawn" },
      plat(40, 2080, 320),
      { x: 420, y: 1960, w: 200, h: 18, kind: "mover", phase: 0 },
      plat(700, 1880, 180),
      { x: 200, y: 1760, w: 240, h: 18, kind: "beam", phase: 0 },
      plat(80, 1680, 160),
      { x: 360, y: 1580, w: 180, h: 16, kind: "fall", phase: 0 },
      plat(620, 1500, 200),
      { x: 240, y: 1380, w: 22, h: 160, kind: "gate", phase: 0.4 },
      plat(200, 1280, 220),
      plat(520, 1120, 180, "fast"),
      { x: 780, y: 980, w: 160, h: 18, kind: "mover", phase: 1 },
      plat(200, 860, 200),
      { x: 500, y: 740, w: 220, h: 16, kind: "beam", phase: 0.8 },
      plat(760, 620, 180),
      plat(420, 480, 200),
      { x: 180, y: 220, w: 36, h: 260, kind: "finish" },
      plat(120, 480, 160),
    ],
  },
  {
    id: "map-c",
    name: "Risk Line",
    width: 3200,
    height: 800,
    env: "skyworks",
    theme: { sky: 0xf4c878, ground: 0xffd24a, accent: 0xff7a3a, danger: 0xff3d6a },
    solids: [
      { x: 50, y: 620, w: 40, h: 40, kind: "spawn" },
      plat(20, 660, 260),
      plat(320, 660, 180),
      { x: 560, y: 560, w: 70, h: 70, kind: "spinner", phase: 0 },
      plat(720, 660, 160),
      plat(720, 420, 120, "expert"),
      plat(920, 340, 100, "expert"),
      { x: 1080, y: 260, w: 90, h: 16, kind: "fall", phase: 0.2 },
      plat(1240, 220, 90, "expert"),
      plat(980, 660, 220, "safe"),
      { x: 1280, y: 540, w: 160, h: 18, kind: "mover", phase: 0.5 },
      plat(1520, 660, 200),
      { x: 1800, y: 480, w: 70, h: 70, kind: "spinner", phase: 1 },
      plat(1760, 660, 200),
      plat(2040, 560, 140, "fast"),
      plat(2260, 460, 120, "fast"),
      { x: 2480, y: 360, w: 24, h: 180, kind: "gate", phase: 0.7 },
      plat(2440, 540, 180, "fast"),
      plat(2440, 700, 200, "safe"),
      { x: 2860, y: 280, w: 36, h: 420, kind: "finish" },
      plat(2760, 700, 280),
    ],
  },
  {
    id: "map-d",
    name: "Hammer Run",
    width: 3000,
    height: 760,
    env: "factory",
    theme: { sky: 0xf2b8c8, ground: 0xff6b8a, accent: 0xffd166, danger: 0xff4d6d },
    solids: [
      { x: 40, y: 600, w: 40, h: 40, kind: "spawn" },
      plat(20, 640, 260),
      { x: 360, y: 520, w: 80, h: 80, kind: "spinner", phase: 0 },
      plat(320, 640, 220),
      { x: 640, y: 430, w: 200, h: 18, kind: "beam", phase: 0.4 },
      plat(860, 640, 200),
      { x: 1120, y: 500, w: 160, h: 18, kind: "mover", phase: 0.2 },
      plat(1360, 640, 200),
      { x: 1640, y: 420, w: 70, h: 70, kind: "spinner", phase: 1.1 },
      plat(1600, 640, 220),
      plat(1920, 520, 160, "fast"),
      { x: 2200, y: 280, w: 36, h: 360, kind: "finish" },
      plat(2120, 640, 280),
    ],
  },
  {
    id: "map-e",
    name: "Disc Yard",
    width: 2600,
    height: 800,
    env: "signal",
    theme: { sky: 0x8ec8e8, ground: 0x4ad4e8, accent: 0xffd166, danger: 0xff5a6e },
    solids: [
      { x: 50, y: 640, w: 40, h: 40, kind: "spawn" },
      plat(20, 680, 280),
      { x: 380, y: 560, w: 70, h: 70, kind: "spinner", phase: 0 },
      plat(340, 680, 200),
      { x: 640, y: 500, w: 180, h: 18, kind: "mover", phase: 0.6 },
      plat(900, 680, 180),
      { x: 1180, y: 420, w: 24, h: 200, kind: "gate", phase: 0.3 },
      plat(1140, 680, 220),
      plat(1460, 560, 160, "fast"),
      { x: 1760, y: 480, w: 70, h: 70, kind: "spinner", phase: 1.4 },
      plat(1720, 680, 220),
      { x: 2140, y: 260, w: 36, h: 420, kind: "finish" },
      plat(2040, 680, 280),
    ],
  },
  {
    id: "map-f",
    name: "Conveyor",
    width: 3100,
    height: 740,
    env: "factory",
    theme: { sky: 0xf2e6d8, ground: 0xffd24a, accent: 0x3ad4c8, danger: 0xff4d62 },
    solids: [
      { x: 40, y: 580, w: 40, h: 40, kind: "spawn" },
      plat(20, 620, 240),
      { x: 340, y: 520, w: 220, h: 18, kind: "mover", phase: 0 },
      { x: 640, y: 520, w: 220, h: 18, kind: "mover", phase: 1 },
      plat(920, 620, 180),
      { x: 1180, y: 430, w: 200, h: 16, kind: "beam", phase: 0.5 },
      plat(1460, 620, 200),
      { x: 1760, y: 500, w: 70, h: 70, kind: "spinner", phase: 0.8 },
      plat(1720, 620, 220),
      plat(2040, 500, 160, "fast"),
      { x: 2360, y: 400, w: 24, h: 180, kind: "gate", phase: 0.2 },
      plat(2320, 620, 220),
      { x: 2760, y: 240, w: 36, h: 380, kind: "finish" },
      plat(2660, 620, 280),
    ],
  },
  {
    id: "map-g",
    name: "Tile Drop",
    width: 2400,
    height: 900,
    env: "skyworks",
    theme: { sky: 0xffd6a8, ground: 0xff8a4a, accent: 0xffd166, danger: 0xff3d5a },
    solids: [
      { x: 40, y: 760, w: 40, h: 40, kind: "spawn" },
      plat(20, 800, 260),
      { x: 360, y: 720, w: 180, h: 16, kind: "fall", phase: 0 },
      plat(620, 800, 160),
      { x: 860, y: 640, w: 180, h: 16, kind: "fall", phase: 0.8 },
      plat(1120, 800, 180),
      { x: 1400, y: 560, w: 160, h: 16, kind: "fall", phase: 1.2 },
      plat(1660, 720, 180, "fast"),
      { x: 1940, y: 480, w: 70, h: 70, kind: "spinner", phase: 0.4 },
      plat(1900, 800, 220),
      { x: 2220, y: 300, w: 36, h: 500, kind: "finish" },
      plat(2140, 800, 220),
    ],
  },
  {
    id: "map-h",
    name: "Bridge Rush",
    width: 3400,
    height: 780,
    env: "signal",
    theme: { sky: 0xa8d8f0, ground: 0x7ad4e8, accent: 0xff6b4a, danger: 0xff5570 },
    solids: [
      { x: 40, y: 620, w: 40, h: 40, kind: "spawn" },
      plat(20, 660, 260),
      { x: 360, y: 560, w: 220, h: 18, kind: "mover", phase: 0 },
      { x: 680, y: 480, w: 200, h: 16, kind: "beam", phase: 0.3 },
      plat(960, 660, 180),
      { x: 1220, y: 520, w: 70, h: 70, kind: "spinner", phase: 0.6 },
      plat(1180, 660, 200),
      plat(1480, 540, 140, "fast"),
      plat(1720, 420, 120, "expert"),
      { x: 1960, y: 340, w: 160, h: 16, kind: "fall", phase: 0.4 },
      plat(2200, 660, 200),
      { x: 2500, y: 500, w: 24, h: 160, kind: "gate", phase: 0.9 },
      plat(2460, 660, 220),
      { x: 2920, y: 240, w: 36, h: 420, kind: "finish" },
      plat(2820, 660, 300),
    ],
  },
];
