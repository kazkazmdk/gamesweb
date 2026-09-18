export type Rect = { x: number; y: number; w: number; h: number };
export type MovingBlocker = {
  x: number;
  y: number;
  w: number;
  h: number;
  axis: "x" | "y";
  min: number;
  max: number;
  speed: number;
  t: number;
};
export type Rotator = { x: number; y: number; len: number; speed: number; a: number };
export type Portal = { x: number; y: number; r: number; pair: number };
export type ForcePad = { x: number; y: number; w: number; h: number; ax: number; ay: number };
export type Breakable = { x: number; y: number; w: number; h: number; hp: number };
export type Gate = { x: number; y: number; w: number; h: number; open?: boolean; t?: number; phase?: number; speed?: number };

export type Layout = {
  id: string;
  name: string;
  par: number;
  theme: "workshop" | "garden" | "arcade";
  ball: { x: number; y: number };
  hole: { x: number; y: number; r: number };
  walls: Rect[];
  bumpers?: Array<{ x: number; y: number; r: number }>;
  movingBlockers?: MovingBlocker[];
  rotators?: Rotator[];
  portals?: Portal[];
  forcePads?: ForcePad[];
  breakables?: Breakable[];
  gates?: Gate[];
  w: number;
  h: number;
};

const W = 720;
const H = 480;
const B = 18;

function box(x: number, y: number, w: number, h: number): Rect {
  return { x, y, w, h };
}

function frame(): Rect[] {
  return [box(0, 0, W, B), box(0, H - B, W, B), box(0, 0, B, H), box(W - B, 0, B, H)];
}

export const LAYOUTS: Layout[] = [
  {
    id: "l1",
    name: "Bench Bank",
    par: 2,
    theme: "workshop",
    w: W,
    h: H,
    ball: { x: 80, y: 400 },
    hole: { x: 80, y: 80, r: 17 },
    walls: [...frame(), box(160, 150, 380, 22), box(500, 150, 22, 180)],
    bumpers: [{ x: 250, y: 300, r: 20 }],
    forcePads: [{ x: 200, y: 360, w: 70, h: 36, ax: 0, ay: -70 }],
  },
  {
    id: "l2",
    name: "Vise Run",
    par: 3,
    theme: "workshop",
    w: W,
    h: H,
    ball: { x: 70, y: 240 },
    hole: { x: 640, y: 240, r: 16 },
    walls: [...frame(), box(220, 0, 22, 190), box(220, 290, 22, 190)],
    movingBlockers: [{ x: 360, y: 200, w: 26, h: 80, axis: "y", min: 80, max: 320, speed: 18, t: 0 }],
  },
  {
    id: "l3",
    name: "Clamp Arm",
    par: 3,
    theme: "workshop",
    w: W,
    h: H,
    ball: { x: 80, y: 80 },
    hole: { x: 620, y: 400, r: 16 },
    walls: [...frame(), box(300, 40, 24, 200)],
    rotators: [{ x: 360, y: 280, len: 110, speed: 1.4, a: 0.4 }],
  },
  {
    id: "l4",
    name: "Crate Break",
    par: 3,
    theme: "workshop",
    w: W,
    h: H,
    ball: { x: 80, y: 400 },
    hole: { x: 640, y: 80, r: 16 },
    walls: [...frame(), box(160, 200, 360, 22)],
    breakables: [{ x: 500, y: 80, w: 28, h: 130, hp: 2 }],
  },
  {
    id: "l5",
    name: "Shelf Gate",
    par: 3,
    theme: "workshop",
    w: W,
    h: H,
    ball: { x: 90, y: 400 },
    hole: { x: 620, y: 90, r: 16 },
    walls: [...frame(), box(180, 160, 300, 22)],
    gates: [{ x: 500, y: 18, w: 20, h: 200, phase: 0, speed: 1.6, t: 0 }],
  },
  {
    id: "l6",
    name: "Anvil Corner",
    par: 2,
    theme: "workshop",
    w: W,
    h: H,
    ball: { x: 80, y: 80 },
    hole: { x: 80, y: 400, r: 17 },
    walls: [...frame(), box(140, 200, 420, 24)],
    bumpers: [{ x: 360, y: 140, r: 22 }],
    forcePads: [{ x: 500, y: 80, w: 80, h: 40, ax: -40, ay: 50 }],
  },
  {
    id: "l7",
    name: "Hedge Cut",
    par: 2,
    theme: "garden",
    w: W,
    h: H,
    ball: { x: 80, y: 240 },
    hole: { x: 630, y: 240, r: 17 },
    walls: [...frame(), box(250, 80, 28, 130), box(250, 280, 28, 130)],
    bumpers: [{ x: 360, y: 240, r: 22 }],
  },
  {
    id: "l8",
    name: "Stone Islands",
    par: 3,
    theme: "garden",
    w: W,
    h: H,
    ball: { x: 70, y: 80 },
    hole: { x: 640, y: 400, r: 16 },
    walls: [...frame(), box(200, 90, 90, 80), box(400, 220, 90, 80), box(240, 320, 80, 70)],
    forcePads: [{ x: 120, y: 180, w: 50, h: 40, ax: 50, ay: 20 }],
  },
  {
    id: "l9",
    name: "Trellis Gate",
    par: 3,
    theme: "garden",
    w: W,
    h: H,
    ball: { x: 80, y: 400 },
    hole: { x: 640, y: 80, r: 16 },
    walls: [...frame(), box(300, 180, 24, 220)],
    gates: [{ x: 500, y: 18, w: 18, h: 220, phase: 1, speed: 1.3, t: 0.4 }],
  },
  {
    id: "l10",
    name: "Fountain Spin",
    par: 3,
    theme: "garden",
    w: W,
    h: H,
    ball: { x: 80, y: 400 },
    hole: { x: 620, y: 90, r: 16 },
    walls: [...frame()],
    rotators: [{ x: 360, y: 240, len: 130, speed: 1.1, a: 0 }],
    bumpers: [{ x: 360, y: 240, r: 18 }],
  },
  {
    id: "l11",
    name: "Bridge Break",
    par: 3,
    theme: "garden",
    w: W,
    h: H,
    ball: { x: 80, y: 400 },
    hole: { x: 640, y: 80, r: 16 },
    walls: [...frame(), box(180, 200, 200, 22)],
    breakables: [{ x: 420, y: 200, w: 90, h: 22, hp: 1 }],
  },
  {
    id: "l12",
    name: "Grove Corridor",
    par: 3,
    theme: "garden",
    w: W,
    h: H,
    ball: { x: 70, y: 240 },
    hole: { x: 650, y: 240, r: 16 },
    walls: [...frame(), box(180, 0, 20, 190), box(180, 290, 20, 190), box(380, 80, 20, 320), box(540, 0, 20, 190), box(540, 290, 20, 190)],
  },
  {
    id: "l13",
    name: "Neon Bank",
    par: 2,
    theme: "arcade",
    w: W,
    h: H,
    ball: { x: 90, y: 400 },
    hole: { x: 90, y: 80, r: 16 },
    walls: [...frame(), box(180, 150, 400, 20)],
    bumpers: [{ x: 420, y: 280, r: 22 }],
    forcePads: [{ x: 300, y: 360, w: 80, h: 36, ax: 0, ay: -80 }],
  },
  {
    id: "l14",
    name: "Portal Pair",
    par: 2,
    theme: "arcade",
    w: W,
    h: H,
    ball: { x: 80, y: 80 },
    hole: { x: 640, y: 400, r: 16 },
    walls: [...frame(), box(300, 0, 24, 280)],
    portals: [
      { x: 160, y: 400, r: 18, pair: 1 },
      { x: 560, y: 80, r: 18, pair: 0 },
    ],
  },
  {
    id: "l15",
    name: "Lab Bounce",
    par: 3,
    theme: "arcade",
    w: W,
    h: H,
    ball: { x: 80, y: 80 },
    hole: { x: 640, y: 400, r: 16 },
    walls: [...frame(), box(200, 0, 22, 260), box(480, 220, 22, 260)],
    bumpers: [{ x: 360, y: 240, r: 24 }],
  },
  {
    id: "l16",
    name: "Arc Gate",
    par: 3,
    theme: "arcade",
    w: W,
    h: H,
    ball: { x: 80, y: 400 },
    hole: { x: 640, y: 80, r: 15 },
    walls: [...frame(), box(240, 180, 22, 220)],
    gates: [{ x: 500, y: 18, w: 18, h: 240, phase: 0.2, speed: 1.8, t: 0 }],
    forcePads: [{ x: 140, y: 200, w: 50, h: 40, ax: 60, ay: 0 }],
  },
  {
    id: "l17",
    name: "Coil Sweep",
    par: 3,
    theme: "arcade",
    w: W,
    h: H,
    ball: { x: 80, y: 240 },
    hole: { x: 640, y: 240, r: 16 },
    walls: [...frame(), box(500, 0, 22, 180), box(500, 300, 22, 180)],
    rotators: [{ x: 320, y: 240, len: 100, speed: 1.7, a: 0.8 }],
    movingBlockers: [{ x: 200, y: 200, w: 70, h: 18, axis: "y", min: 80, max: 360, speed: 16, t: 0.5 }],
  },
  {
    id: "l18",
    name: "Pulse Circuit",
    par: 4,
    theme: "arcade",
    w: W,
    h: H,
    ball: { x: 80, y: 400 },
    hole: { x: 640, y: 80, r: 15 },
    walls: [...frame(), box(160, 200, 200, 20)],
    portals: [
      { x: 200, y: 360, r: 16, pair: 1 },
      { x: 520, y: 280, r: 16, pair: 0 },
    ],
    breakables: [{ x: 500, y: 18, w: 22, h: 160, hp: 2 }],
    bumpers: [{ x: 360, y: 120, r: 18 }],
  },
];
