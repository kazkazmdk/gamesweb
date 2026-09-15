import type Phaser from "phaser";
import type { Car } from "../systems/vehicle";
import type { TrackDef, TrackSample } from "../systems/track";
import type { GhostSample } from "../systems/ghost";

export type Mark = { x: number; y: number; a: number; life: number; slip: number };

export function drawWorld(
  g: Phaser.GameObjects.Graphics,
  def: TrackDef,
  samples: TrackSample[],
  quality: "high" | "low",
) {
  const theme = def.theme;
  g.fillStyle(theme.sky, 1);
  g.fillRect(0, 0, def.worldW, def.worldH);

  if (quality === "high") {
    g.fillStyle(theme.building, 0.75);
    for (let i = 0; i < samples.length; i += 14) {
      const s = samples[i];
      const bx = s.x + s.nx * (s.width * 0.5 + 90);
      const by = s.y + s.ny * (s.width * 0.5 + 90);
      const h = 40 + (i % 5) * 18;
      g.fillRect(bx - 16, by - h, 32, h);
    }
  }

  for (let i = 0; i < samples.length; i += 1) {
    const s = samples[i];
    const n = samples[(i + 1) % samples.length];
    const w = s.width * 0.5 + 16;
    g.fillStyle(theme.barrier, 1);
    fillStrip(g, s.x, s.y, s.nx, s.ny, n.x, n.y, n.nx, n.ny, w);
  }
  for (let i = 0; i < samples.length; i += 1) {
    const s = samples[i];
    const n = samples[(i + 1) % samples.length];
    const w = s.width * 0.5;
    g.fillStyle(s.boost ? 0x3a2030 : theme.asphalt, 1);
    fillStrip(g, s.x, s.y, s.nx, s.ny, n.x, n.y, n.nx, n.ny, w);
  }

  if (quality === "high") {
    g.lineStyle(2, theme.mark, 0.22);
    for (let i = 0; i < samples.length; i += 5) {
      const s = samples[i];
      const n = samples[(i + 1) % samples.length];
      g.lineBetween(s.x - s.tx * 6, s.y - s.ty * 6, n.x - n.tx * 2, n.y - n.ty * 6);
    }
  }

  g.lineStyle(3, theme.accent, 0.55);
  for (let i = 0; i < samples.length; i += 1) {
    if (samples[i].sector === samples[(i + 1) % samples.length].sector) continue;
    const s = samples[i];
    g.lineBetween(s.x + s.nx * s.width * 0.5, s.y + s.ny * s.width * 0.5, s.x - s.nx * s.width * 0.5, s.y - s.ny * s.width * 0.5);
  }

  if (quality === "high") {
    for (let i = 0; i < samples.length; i += 18) {
      const s = samples[i];
      const px = s.x + s.nx * (s.width * 0.5 + 18);
      const py = s.y + s.ny * (s.width * 0.5 + 18);
      g.fillStyle(0x1a181c, 1);
      g.fillRect(px - 2, py - 22, 4, 22);
      g.fillStyle(theme.pole, 0.85);
      g.fillCircle(px, py - 24, 5);
    }
  }
}

function fillStrip(
  g: Phaser.GameObjects.Graphics,
  ax: number,
  ay: number,
  anx: number,
  any: number,
  bx: number,
  by: number,
  bnx: number,
  bny: number,
  w: number,
) {
  g.fillTriangle(ax + anx * w, ay + any * w, ax - anx * w, ay - any * w, bx + bnx * w, by + bny * w);
  g.fillTriangle(ax - anx * w, ay - any * w, bx - bnx * w, by - bny * w, bx + bnx * w, by + bny * w);
}

export function drawMarks(g: Phaser.GameObjects.Graphics, marks: Mark[], dt: number) {
  for (const m of marks) {
    m.life -= dt;
    if (m.life <= 0) continue;
    g.fillStyle(0x2a2a32, Math.min(0.5, m.life * 0.18 + m.slip * 0.2));
    g.fillCircle(m.x, m.y, 3.4 + m.slip * 1.4);
  }
}

export function drawGhost(g: Phaser.GameObjects.Graphics, pose: GhostSample | null, accent: number) {
  if (!pose) return;
  g.save();
  g.translateCanvas(pose.x, pose.y);
  g.rotateCanvas(pose.a);
  g.fillStyle(accent, 0.28);
  g.fillRoundedRect(-15, -8, 30, 16, 4);
  g.restore();
}

export function drawCar(g: Phaser.GameObjects.Graphics, car: Car, accent: number) {
  g.save();
  g.translateCanvas(car.x, car.y);
  g.fillStyle(0x000000, 0.35);
  g.fillCircle(6, 10, 13);
  g.rotateCanvas(car.angle);
  g.fillStyle(0x141216, 1);
  g.fillRoundedRect(-18, -10, 36, 20, 5);
  g.fillStyle(car.drifting ? accent : 0xf3f1ec, 1);
  g.fillRoundedRect(-16, -9, 32, 18, 4);
  g.fillStyle(0x1c2834, 0.92);
  g.fillRoundedRect(-4, -7, 14, 14, 3);
  g.fillStyle(0xf6f0c8, 0.95);
  g.fillRect(12, -7, 4, 5);
  g.fillRect(12, 2, 4, 5);
  const tail = car.brakeLight > 0.2 ? 0xff4d6d : 0x5a2028;
  g.fillStyle(tail, 0.95);
  g.fillRect(-17, -6, 3, 4);
  g.fillRect(-17, 2, 3, 4);
  g.fillStyle(0x111113, 1);
  g.fillRect(-10, -12, 8, 4);
  g.fillRect(-10, 8, 8, 4);
  g.fillRect(4, -12, 8, 4);
  g.fillRect(4, 8, 8, 4);
  g.restore();
}

export function drawHudChrome(
  overlay: Phaser.GameObjects.Graphics,
  w: number,
  h: number,
  touch: boolean,
  flash: number,
) {
  overlay.clear();
  if (flash > 0) {
    overlay.fillStyle(0xffffff, flash);
    overlay.fillRect(0, 0, w, h);
  }
  if (!touch) return;
  overlay.fillStyle(0xffffff, 0.05);
  overlay.fillRoundedRect(18, h * 0.22, w * 0.28, h * 0.46, 18);
  overlay.fillRoundedRect(w - 18 - w * 0.28, h * 0.22, w * 0.28, h * 0.46, 18);
  overlay.fillStyle(0xe35aa0, 0.2);
  overlay.fillRoundedRect(w / 2 - 70, h - 88, 140, 58, 16);
}
