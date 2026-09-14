export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "solid" | "spike" | "start" | "finish" | "hazard";
};

export type Course = {
  id: string;
  name: string;
  width: number;
  height: number;
  medals: { platinum: number; gold: number; silver: number; bronze: number };
  solids: Rect[];
};

function S(x: number, y: number, w: number, h: number): Rect {
  return { x, y, w, h, kind: "solid" };
}
function K(x: number, y: number, w: number, h: number): Rect {
  return { x, y, w, h, kind: "spike" };
}
function F(x: number, y: number, w: number, h: number): Rect {
  return { x, y, w, h, kind: "finish" };
}
function T(x: number, y: number, w: number, h: number): Rect {
  return { x, y, w, h, kind: "start" };
}

export const COURSES: Course[] = [
  {
    id: "course-1",
    name: "Gate A",
    width: 3200,
    height: 900,
    medals: { platinum: 32000, gold: 38000, silver: 46000, bronze: 58000 },
    solids: [
      T(80, 620, 40, 40),
      S(0, 700, 420, 200),
      S(500, 640, 220, 40),
      K(500, 620, 60, 20),
      S(820, 700, 280, 200),
      S(1180, 560, 160, 28),
      S(1460, 480, 140, 28),
      K(1460, 460, 40, 20),
      S(1720, 620, 240, 40),
      S(2040, 540, 180, 28),
      S(2320, 700, 360, 200),
      S(2680, 560, 220, 28),
      S(2920, 700, 280, 200),
      F(3040, 620, 48, 80),
      S(-40, 0, 40, 900),
      S(0, 860, 3200, 40),
    ],
  },
  {
    id: "course-2",
    name: "Gate B",
    width: 3800,
    height: 980,
    medals: { platinum: 48000, gold: 56000, silver: 68000, bronze: 84000 },
    solids: [
      T(70, 700, 40, 40),
      S(0, 780, 300, 200),
      S(380, 700, 120, 24),
      S(620, 620, 120, 24),
      K(620, 600, 50, 20),
      S(900, 700, 200, 24),
      S(1220, 780, 160, 200),
      S(1480, 540, 28, 260),
      S(1640, 640, 180, 24),
      K(1680, 620, 80, 20),
      S(1960, 520, 140, 24),
      S(2220, 440, 140, 24),
      S(2480, 560, 200, 24),
      S(2780, 680, 160, 24),
      S(3040, 780, 280, 200),
      S(3380, 640, 28, 160),
      S(3480, 780, 320, 200),
      F(3660, 700, 48, 80),
      S(-40, 0, 40, 980),
      S(0, 940, 3800, 40),
    ],
  },
  {
    id: "course-3",
    name: "Gate C",
    width: 4600,
    height: 1100,
    medals: { platinum: 68000, gold: 80000, silver: 96000, bronze: 118000 },
    solids: [
      T(80, 820, 40, 40),
      S(0, 900, 340, 200),
      S(420, 820, 100, 22),
      S(620, 740, 100, 22),
      S(840, 660, 100, 22),
      K(840, 640, 40, 20),
      S(1100, 740, 160, 22),
      S(1380, 900, 220, 200),
      S(1680, 620, 24, 300),
      S(1820, 700, 140, 22),
      S(2060, 560, 140, 22),
      K(2100, 540, 70, 20),
      S(2320, 480, 120, 22),
      S(2560, 400, 120, 22),
      S(2800, 520, 180, 22),
      S(3080, 640, 24, 280),
      S(3220, 780, 160, 22),
      S(3480, 680, 140, 22),
      S(3720, 560, 140, 22),
      S(3960, 700, 180, 22),
      S(4220, 900, 380, 200),
      F(4440, 820, 48, 80),
      S(-40, 0, 40, 1100),
      S(0, 1060, 4600, 40),
    ],
  },
];

export function medalFor(course: Course, timeMs: number): "platinum" | "gold" | "silver" | "bronze" | null {
  if (timeMs <= course.medals.platinum) return "platinum";
  if (timeMs <= course.medals.gold) return "gold";
  if (timeMs <= course.medals.silver) return "silver";
  if (timeMs <= course.medals.bronze) return "bronze";
  return null;
}
