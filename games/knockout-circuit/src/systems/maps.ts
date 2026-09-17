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

export type MapDef = {
  id: string;
  name: string;
  width: number;
  height: number;
  solids: Rect[];
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
    theme: { sky: 0x1b1408, ground: 0x3a2a12, accent: 0xffb703, danger: 0xff5d4a },
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
    theme: { sky: 0x14181e, ground: 0x243040, accent: 0xffb703, danger: 0xff6b4a },
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
    theme: { sky: 0x1a0f12, ground: 0x3a2218, accent: 0xffb703, danger: 0xff4d6d },
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
];
