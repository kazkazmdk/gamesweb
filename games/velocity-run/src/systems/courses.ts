export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "solid" | "spike" | "start" | "finish" | "hazard" | "checkpoint";
  route?: "safe" | "fast" | "expert";
};

export type Course = {
  id: "course-1" | "course-2" | "course-3";
  name: string;
  subtitle: string;
  width: number;
  height: number;
  theme: { sky: number; ground: number; accent: number; danger: number; bg: number };
  medals: { platinum: number; gold: number; silver: number; bronze: number };
  solids: Rect[];
};

function S(x: number, y: number, w: number, h: number, route?: Rect["route"]): Rect {
  return { x, y, w, h, kind: "solid", route };
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
function C(x: number, y: number, w: number, h: number): Rect {
  return { x, y, w, h, kind: "checkpoint" };
}

export const COURSES: Course[] = [
  {
    id: "course-1",
    name: "Gate A",
    subtitle: "Read the line",
    width: 3400,
    height: 920,
    theme: { sky: 0x07141c, ground: 0x16323c, accent: 0x3ec6e8, danger: 0xe85a6a, bg: 0x0a1c26 },
    medals: { platinum: 32000, gold: 38000, silver: 46000, bronze: 58000 },
    solids: [
      T(80, 620, 40, 40),
      S(0, 700, 460, 200),
      C(430, 560, 16, 140),
      S(520, 640, 200, 36, "safe"),
      K(560, 620, 50, 20),
      S(760, 520, 120, 24, "fast"),
      S(920, 700, 280, 200),
      C(1180, 500, 16, 200),
      S(1200, 560, 150, 28, "safe"),
      S(1460, 430, 130, 24, "fast"),
      K(1480, 410, 40, 20),
      S(1680, 620, 220, 36),
      S(1960, 480, 70, 24, "expert"),
      S(2140, 540, 160, 28, "safe"),
      S(2380, 700, 340, 200),
      C(2500, 520, 16, 180),
      S(2760, 560, 200, 28, "fast"),
      S(3040, 700, 360, 200),
      F(3220, 620, 52, 80),
      S(-40, 0, 40, 920),
      S(0, 880, 3400, 40),
    ],
  },
  {
    id: "course-2",
    name: "Needle",
    subtitle: "Switchbacks",
    width: 4000,
    height: 1000,
    theme: { sky: 0x081018, ground: 0x1a2e38, accent: 0x7af0c8, danger: 0xff6b7b, bg: 0x0b181e },
    medals: { platinum: 48000, gold: 56000, silver: 68000, bronze: 84000 },
    solids: [
      T(70, 700, 40, 40),
      S(0, 780, 320, 200),
      C(300, 620, 16, 160),
      S(400, 700, 110, 24, "safe"),
      S(640, 600, 110, 24, "fast"),
      K(660, 580, 46, 20),
      S(880, 700, 180, 24),
      S(1160, 780, 150, 200),
      S(1420, 500, 26, 300),
      S(1520, 640, 170, 24, "safe"),
      K(1700, 620, 70, 20),
      S(1780, 420, 120, 24, "expert"),
      C(1960, 400, 16, 220),
      S(2040, 520, 140, 24),
      S(2280, 400, 130, 24, "fast"),
      S(2540, 560, 190, 24),
      C(2720, 400, 16, 180),
      S(2860, 680, 150, 24, "safe"),
      S(3120, 780, 260, 200),
      S(3440, 560, 24, 240),
      S(3540, 780, 460, 200),
      F(3820, 700, 52, 80),
      S(-40, 0, 40, 1000),
      S(0, 960, 4000, 40),
    ],
  },
  {
    id: "course-3",
    name: "Rushline",
    subtitle: "Commit the gap",
    width: 4800,
    height: 1120,
    theme: { sky: 0x061018, ground: 0x123040, accent: 0x8fd6ff, danger: 0xff5d6e, bg: 0x07141c },
    medals: { platinum: 68000, gold: 80000, silver: 96000, bronze: 118000 },
    solids: [
      T(80, 820, 40, 40),
      S(0, 900, 360, 200),
      C(340, 740, 16, 160),
      S(440, 820, 96, 22, "safe"),
      S(640, 720, 96, 22, "fast"),
      S(860, 620, 96, 22, "expert"),
      K(880, 600, 36, 20),
      S(1120, 740, 150, 22),
      S(1400, 900, 220, 200),
      S(1700, 560, 22, 360),
      S(1840, 700, 130, 22, "safe"),
      S(2080, 500, 130, 22, "fast"),
      K(2140, 480, 60, 20),
      C(2260, 360, 16, 220),
      S(2360, 430, 110, 22, "expert"),
      S(2600, 360, 110, 22, "fast"),
      S(2860, 520, 170, 22),
      S(3140, 640, 22, 300),
      C(3280, 560, 16, 200),
      S(3280, 780, 150, 22, "safe"),
      S(3540, 640, 130, 22, "fast"),
      S(3800, 500, 130, 22, "expert"),
      S(4060, 700, 170, 22),
      S(4340, 900, 460, 200),
      F(4600, 820, 52, 80),
      S(-40, 0, 40, 1120),
      S(0, 1080, 4800, 40),
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

export function nextMedalTarget(course: Course, timeMs: number): { name: string; target: number; gap: number } | null {
  const order = [
    ["bronze", course.medals.bronze],
    ["silver", course.medals.silver],
    ["gold", course.medals.gold],
    ["platinum", course.medals.platinum],
  ] as const;
  for (const [name, target] of order) {
    if (timeMs > target) return { name, target, gap: timeMs - target };
  }
  return null;
}

export function checkpoints(course: Course): Rect[] {
  return course.solids.filter((s) => s.kind === "checkpoint");
}
