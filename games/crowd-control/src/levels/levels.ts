import type { Segment } from "../systems/course";

function g(z: number, left: Segment["left"], right: Segment["right"]): Segment {
  return { z, type: "gate", left, right };
}
function e(z: number, lane: "left" | "right"): Segment {
  return { z, type: "enemy", lane };
}
function s(z: number): Segment {
  return { z, type: "shortcut", lane: "left" };
}
function b(z: number): Segment {
  return { z, type: "boss" };
}
function f(z: number): Segment {
  return { z, type: "finish", left: { kind: "mul", n: 2 }, right: { kind: "add", n: 18 } };
}

export const LEVELS: Segment[][] = [
  [g(180, { kind: "add", n: 8 }, { kind: "add", n: 4 }), g(340, { kind: "mul", n: 2 }, { kind: "sub", n: 6 }), e(500, "right"), f(680)],
  [g(160, { kind: "add", n: 10 }, { kind: "sub", n: 4 }), s(300), g(440, { kind: "mul", n: 2 }, { kind: "add", n: 6 }), e(580, "left"), f(760)],
  [g(180, { kind: "mul", n: 2 }, { kind: "add", n: 5 }), e(320, "right"), g(460, { kind: "add", n: 12 }, { kind: "div", n: 2 }), g(600, { kind: "mul", n: 3 }, { kind: "sub", n: 10 }), f(800)],
  [g(170, { kind: "add", n: 6 }, { kind: "add", n: 6 }), g(320, { kind: "mul", n: 2 }, { kind: "mul", n: 2 }), e(470, "left"), s(600), e(740, "right"), f(920)],
  [g(160, { kind: "add", n: 14 }, { kind: "sub", n: 8 }), g(320, { kind: "div", n: 2 }, { kind: "mul", n: 3 }), e(480, "right"), g(640, { kind: "add", n: 10 }, { kind: "add", n: 4 }), f(840)],
  [g(180, { kind: "add", n: 8 }, { kind: "mul", n: 2 }), e(340, "left"), e(480, "right"), g(620, { kind: "mul", n: 2 }, { kind: "sub", n: 12 }), f(820)],
  [g(150, { kind: "add", n: 5 }, { kind: "add", n: 12 }), s(280), g(420, { kind: "mul", n: 3 }, { kind: "div", n: 2 }), e(560, "left"), g(700, { kind: "add", n: 8 }, { kind: "sub", n: 6 }), f(900)],
  [g(180, { kind: "mul", n: 2 }, { kind: "add", n: 8 }), g(340, { kind: "add", n: 10 }, { kind: "mul", n: 2 }), e(500, "right"), b(680), f(860)],
  [g(160, { kind: "add", n: 16 }, { kind: "sub", n: 10 }), e(300, "left"), g(460, { kind: "mul", n: 2 }, { kind: "add", n: 6 }), s(600), e(740, "right"), f(920)],
  [g(180, { kind: "add", n: 7 }, { kind: "add", n: 9 }), g(320, { kind: "mul", n: 2 }, { kind: "div", n: 2 }), e(470, "left"), g(620, { kind: "mul", n: 4 }, { kind: "sub", n: 20 }), f(820)],
  [g(170, { kind: "add", n: 11 }, { kind: "mul", n: 2 }), e(320, "right"), s(460), g(600, { kind: "add", n: 8 }, { kind: "add", n: 8 }), e(740, "left"), f(920)],
  [g(160, { kind: "mul", n: 2 }, { kind: "add", n: 4 }), g(300, { kind: "add", n: 14 }, { kind: "sub", n: 8 }), e(460, "right"), g(620, { kind: "mul", n: 3 }, { kind: "div", n: 2 }), b(780), f(980)],
  [g(180, { kind: "add", n: 9 }, { kind: "add", n: 5 }), e(320, "left"), e(460, "right"), g(600, { kind: "mul", n: 2 }, { kind: "add", n: 12 }), s(740), f(920)],
  [g(150, { kind: "add", n: 20 }, { kind: "div", n: 2 }), g(320, { kind: "mul", n: 2 }, { kind: "sub", n: 14 }), e(480, "left"), g(640, { kind: "add", n: 10 }, { kind: "mul", n: 3 }), f(860)],
  [g(160, { kind: "add", n: 8 }, { kind: "add", n: 8 }), g(300, { kind: "mul", n: 2 }, { kind: "mul", n: 2 }), e(450, "right"), s(580), g(720, { kind: "mul", n: 4 }, { kind: "sub", n: 18 }), b(860), f(1060)],
];
