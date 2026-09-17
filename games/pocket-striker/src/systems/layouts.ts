export type Rect = { x: number; y: number; w: number; h: number };
export type Layout = {
  id: string;
  name: string;
  par: number;
  ball: { x: number; y: number };
  hole: { x: number; y: number; r: number };
  walls: Rect[];
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
  { id: "l1", name: "Open Green", par: 2, w: W, h: H, ball: { x: 90, y: 240 }, hole: { x: 620, y: 240, r: 18 }, walls: frame() },
  { id: "l2", name: "Center Post", par: 2, w: W, h: H, ball: { x: 80, y: 240 }, hole: { x: 630, y: 240, r: 18 }, walls: [...frame(), box(330, 160, 50, 160)] },
  { id: "l3", name: "Two Lanes", par: 3, w: W, h: H, ball: { x: 80, y: 80 }, hole: { x: 640, y: 400, r: 18 }, walls: [...frame(), box(200, 0, 24, 300), box(480, 180, 24, 300)] },
  { id: "l4", name: "Bank Left", par: 2, w: W, h: H, ball: { x: 90, y: 400 }, hole: { x: 90, y: 80, r: 18 }, walls: [...frame(), box(180, 140, 360, 24)] },
  { id: "l5", name: "Diamond", par: 3, w: W, h: H, ball: { x: 70, y: 70 }, hole: { x: 650, y: 410, r: 16 }, walls: [...frame(), box(240, 200, 240, 70)] },
  { id: "l6", name: "Corridor", par: 3, w: W, h: H, ball: { x: 60, y: 240 }, hole: { x: 660, y: 240, r: 16 }, walls: [...frame(), box(160, 0, 20, 200), box(160, 280, 20, 200), box(360, 80, 20, 320), box(540, 0, 20, 200), box(540, 280, 20, 200)] },
  { id: "l7", name: "L Hook", par: 3, w: W, h: H, ball: { x: 80, y: 400 }, hole: { x: 620, y: 80, r: 17 }, walls: [...frame(), box(160, 160, 400, 28)] },
  { id: "l8", name: "Islands", par: 4, w: W, h: H, ball: { x: 70, y: 240 }, hole: { x: 650, y: 240, r: 16 }, walls: [...frame(), box(200, 90, 90, 90), box(430, 300, 90, 90), box(330, 190, 70, 70)] },
  { id: "l9", name: "Narrow Mouth", par: 3, w: W, h: H, ball: { x: 80, y: 400 }, hole: { x: 640, y: 80, r: 15 }, walls: [...frame(), box(500, 0, 24, 280), box(500, 360, 24, 120)] },
  { id: "l10", name: "Cross", par: 3, w: W, h: H, ball: { x: 80, y: 80 }, hole: { x: 640, y: 400, r: 16 }, walls: [...frame(), box(300, 40, 24, 400), box(140, 220, 440, 24)] },
  { id: "l11", name: "Pocket Alley", par: 2, w: W, h: H, ball: { x: 360, y: 400 }, hole: { x: 360, y: 70, r: 18 }, walls: [...frame(), box(220, 140, 24, 220), box(476, 140, 24, 220)] },
  { id: "l12", name: "Double Bank", par: 4, w: W, h: H, ball: { x: 80, y: 400 }, hole: { x: 640, y: 80, r: 15 }, walls: [...frame(), box(120, 200, 480, 22), box(120, 280, 480, 22)] },
];
