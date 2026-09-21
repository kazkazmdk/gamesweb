export type GateOp = { kind: "add" | "mul" | "sub" | "div"; n: number };

export type Segment = {
  z: number;
  type: "gate" | "split" | "enemy" | "finish" | "shortcut" | "boss" | "break";
  left?: GateOp;
  right?: GateOp;
  lane?: "left" | "right" | "mid";
};

export function applyOp(pack: number, op?: GateOp) {
  if (!op) return pack;
  if (op.kind === "add") return pack + op.n;
  if (op.kind === "mul") return Math.floor(pack * op.n);
  if (op.kind === "sub") return Math.max(0, pack - op.n);
  return Math.max(0, Math.floor(pack / op.n));
}

export function gateFamily(op?: GateOp): "add" | "mul" | "tax" | "none" {
  if (!op) return "none";
  if (op.kind === "add") return "add";
  if (op.kind === "mul") return "mul";
  return "tax";
}

export function opLabel(op?: GateOp) {
  if (!op) return "";
  if (op.kind === "add") return `+${op.n}`;
  if (op.kind === "mul") return `×${op.n}`;
  if (op.kind === "sub") return `TAX −${op.n}`;
  return `TAX ÷${op.n}`;
}

export function gateColors(op?: GateOp): { face: number; trim: number; ink: string } {
  const family = gateFamily(op);
  if (family === "add") return { face: 0x1fd46a, trim: 0x0a6a32, ink: "#f4fff4" };
  if (family === "mul") return { face: 0xffb020, trim: 0x8a3a08, ink: "#2a1408" };
  if (family === "tax") return { face: 0xff2a6a, trim: 0x5a0824, ink: "#fff4f8" };
  return { face: 0x2db36a, trim: 0x144028, ink: "#fff4ea" };
}

export function buildCourse(seed: string): Segment[] {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const rng = () => {
    h = (h + 0x6d2b79f5) >>> 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const segs: Segment[] = [];
  let z = 180;
  for (let i = 0; i < 10; i += 1) {
    const roll = rng();
    if (roll < 0.45) {
      segs.push({
        z,
        type: "gate",
        left: rng() > 0.5 ? { kind: "add", n: 4 + Math.floor(rng() * 10) } : { kind: "mul", n: rng() > 0.7 ? 3 : 2 },
        right: rng() > 0.55 ? { kind: "sub", n: 6 + Math.floor(rng() * 8) } : { kind: "add", n: 2 + Math.floor(rng() * 6) },
      });
    } else if (roll < 0.7) {
      segs.push({ z, type: "split" });
    } else if (roll < 0.88) {
      segs.push({ z, type: "enemy", lane: rng() > 0.5 ? "left" : "right" });
    } else {
      segs.push({ z, type: "shortcut", lane: "left" });
    }
    z += 140 + Math.floor(rng() * 40);
  }
  segs.push({ z: z + 80, type: "finish", left: { kind: "mul", n: 2 }, right: { kind: "add", n: 15 } });
  return segs;
}
