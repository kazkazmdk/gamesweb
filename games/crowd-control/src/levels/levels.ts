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
function k(z: number): Segment {
  return { z, type: "break" };
}
function f(z: number, left: Segment["left"] = { kind: "mul", n: 2 }, right: Segment["right"] = { kind: "add", n: 18 }): Segment {
  return { z, type: "finish", left, right };
}

export const LEVELS: Segment[][] = [
  // 0 multiplier sprint
  [g(160, { kind: "add", n: 6 }, { kind: "add", n: 4 }), g(300, { kind: "mul", n: 2 }, { kind: "add", n: 5 }), g(440, { kind: "mul", n: 2 }, { kind: "add", n: 8 }), g(580, { kind: "mul", n: 3 }, { kind: "sub", n: 10 }), f(760)],
  // 1 shortcut risk
  [g(160, { kind: "add", n: 10 }, { kind: "sub", n: 4 }), s(300), g(440, { kind: "mul", n: 2 }, { kind: "add", n: 6 }), e(580, "left"), f(760)],
  // 2 destruction
  [g(170, { kind: "add", n: 8 }, { kind: "add", n: 5 }), k(320), g(460, { kind: "mul", n: 2 }, { kind: "sub", n: 6 }), k(600), f(800)],
  // 3 attrition
  [g(170, { kind: "add", n: 6 }, { kind: "add", n: 6 }), e(320, "left"), e(460, "right"), e(600, "left"), f(820)],
  // 4 mixed gates
  [g(160, { kind: "add", n: 14 }, { kind: "sub", n: 8 }), g(320, { kind: "div", n: 2 }, { kind: "mul", n: 3 }), e(480, "right"), g(640, { kind: "add", n: 10 }, { kind: "add", n: 4 }), f(840)],
  // 5 destroy + enemy
  [g(180, { kind: "add", n: 8 }, { kind: "mul", n: 2 }), k(300), e(440, "left"), e(580, "right"), f(820)],
  // 6 shortcut sprint
  [g(150, { kind: "add", n: 5 }, { kind: "add", n: 12 }), s(280), g(420, { kind: "mul", n: 3 }, { kind: "div", n: 2 }), e(560, "left"), g(700, { kind: "add", n: 8 }, { kind: "sub", n: 6 }), f(900)],
  // 7 boss
  [g(180, { kind: "mul", n: 2 }, { kind: "add", n: 8 }), g(340, { kind: "add", n: 10 }, { kind: "mul", n: 2 }), e(500, "right"), b(680), f(900, { kind: "mul", n: 2 }, { kind: "add", n: 24 })],
  // 8 attrition + shortcut
  [g(160, { kind: "add", n: 16 }, { kind: "sub", n: 10 }), e(300, "left"), g(460, { kind: "mul", n: 2 }, { kind: "add", n: 6 }), s(600), e(740, "right"), f(920)],
  // 9 huge payoff setup
  [g(180, { kind: "add", n: 7 }, { kind: "add", n: 9 }), g(320, { kind: "mul", n: 2 }, { kind: "div", n: 2 }), k(470), g(620, { kind: "mul", n: 4 }, { kind: "sub", n: 20 }), f(860, { kind: "mul", n: 2 }, { kind: "add", n: 36 })],
  // 10 destroy corridor
  [g(170, { kind: "add", n: 11 }, { kind: "mul", n: 2 }), k(300), k(420), g(560, { kind: "add", n: 8 }, { kind: "add", n: 8 }), e(720, "left"), f(920)],
  // 11 late boss
  [g(160, { kind: "mul", n: 2 }, { kind: "add", n: 4 }), g(300, { kind: "add", n: 14 }, { kind: "sub", n: 8 }), e(460, "right"), g(620, { kind: "mul", n: 3 }, { kind: "div", n: 2 }), b(780), f(1020, { kind: "mul", n: 2 }, { kind: "add", n: 28 })],
  // 12 risky sides
  [g(180, { kind: "add", n: 9 }, { kind: "add", n: 5 }), e(320, "left"), e(460, "right"), g(600, { kind: "mul", n: 2 }, { kind: "add", n: 12 }), s(740), f(920)],
  // 13 multiplier then break
  [g(150, { kind: "add", n: 20 }, { kind: "div", n: 2 }), g(320, { kind: "mul", n: 2 }, { kind: "sub", n: 14 }), k(480), g(640, { kind: "add", n: 10 }, { kind: "mul", n: 3 }), f(880)],
  // 14 final boss payoff
  [g(160, { kind: "add", n: 8 }, { kind: "add", n: 8 }), g(300, { kind: "mul", n: 2 }, { kind: "mul", n: 2 }), k(450), s(580), g(720, { kind: "mul", n: 4 }, { kind: "sub", n: 18 }), b(860), f(1120, { kind: "mul", n: 2 }, { kind: "add", n: 48 })],
];
