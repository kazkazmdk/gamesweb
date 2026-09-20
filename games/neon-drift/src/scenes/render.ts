import type Phaser from "phaser";
import { drawArcadeCar, drawBush, drawContainer, drawCrane, drawSodiumLamp, mixColor } from "@gamesweb/game-core";
import type { Car } from "../systems/vehicle";
import type { TrackDef, TrackSample } from "../systems/track";
import type { GhostSample } from "../systems/ghost";

export type Mark = { x: number; y: number; a: number; life: number; slip: number };

export function drawWorld(
  g: Phaser.GameObjects.Graphics,
  def: TrackDef,
  samples: TrackSample[],
  quality: "high" | "mid" | "low",
  t: number,
) {
  const theme = def.theme;
  g.fillStyle(theme.sky, 1);
  g.fillRect(0, 0, def.worldW, def.worldH);

  if (def.id === "foundation") drawHarbourWorld(g, def, quality, t);
  else if (def.id === "technical") drawDistrictWorld(g, def, quality, t);
  else drawRidgeWorld(g, def, quality, t);

  // earth / grass shoulders sit inside the camera, not in a distant void
  for (let i = 0; i < samples.length; i += 1) {
    const s = samples[i];
    const n = samples[(i + 1) % samples.length];
    const w = s.width * 0.5 + 58;
    g.fillStyle(theme.grass, 1);
    fillStrip(g, s.x, s.y, s.nx, s.ny, n.x, n.y, n.nx, n.ny, w);
  }
  for (let i = 0; i < samples.length; i += 1) {
    const s = samples[i];
    const n = samples[(i + 1) % samples.length];
    g.fillStyle(mixColor(theme.grass, 0x3a2a18, 0.35), 1);
    fillStrip(g, s.x, s.y, s.nx, s.ny, n.x, n.y, n.nx, n.ny, s.width * 0.5 + 36);
  }

  // concrete barrier band
  for (let i = 0; i < samples.length; i += 1) {
    const s = samples[i];
    const n = samples[(i + 1) % samples.length];
    g.fillStyle(theme.barrier, 1);
    fillStrip(g, s.x, s.y, s.nx, s.ny, n.x, n.y, n.nx, n.ny, s.width * 0.5 + 16);
  }

  // asphalt
  for (let i = 0; i < samples.length; i += 1) {
    const s = samples[i];
    const n = samples[(i + 1) % samples.length];
    const wet = mixColor(theme.asphalt, theme.asphaltHi, (Math.sin(i * 0.17) + 1) * 0.5);
    g.fillStyle(s.boost ? mixColor(theme.asphalt, theme.accent, 0.28) : wet, 1);
    fillStrip(g, s.x, s.y, s.nx, s.ny, n.x, n.y, n.nx, n.ny, s.width * 0.5);
  }

  if (quality !== "low") {
    g.lineStyle(3, theme.mark, 0.72);
    for (let i = 0; i < samples.length; i += 1) {
      const s = samples[i];
      const n = samples[(i + 1) % samples.length];
      const edge = s.width * 0.46;
      g.lineBetween(s.x + s.nx * edge, s.y + s.ny * edge, n.x + n.nx * edge, n.y + n.ny * edge);
      g.lineBetween(s.x - s.nx * edge, s.y - s.ny * edge, n.x - n.nx * edge, n.y - n.ny * edge);
    }
    g.lineStyle(2, theme.mark, 0.38);
    for (let i = 0; i < samples.length; i += 5) {
      const s = samples[i];
      const n = samples[(i + 2) % samples.length];
      g.lineBetween(s.x - s.tx * 5, s.y - s.ty * 5, n.x + n.tx * 8, n.y + n.ty * 8);
    }
    // wet sodium pools on the tarmac
    for (let i = 0; i < samples.length; i += 7) {
      const s = samples[i];
      g.fillStyle(theme.pole, 0.1 + (i % 14 === 0 ? 0.06 : 0));
      g.fillCircle(s.x + s.nx * 8, s.y + s.ny * 6, 22);
      g.fillStyle(0xffffff, 0.05);
      g.fillCircle(s.x, s.y, 16);
    }
  }

  g.lineStyle(5, theme.accent, 0.78);
  for (let i = 0; i < samples.length; i += 1) {
    if (samples[i].sector === samples[(i + 1) % samples.length].sector) continue;
    const s = samples[i];
    g.lineBetween(s.x + s.nx * s.width * 0.5, s.y + s.ny * s.width * 0.5, s.x - s.nx * s.width * 0.5, s.y - s.ny * s.width * 0.5);
  }

  const start = samples[0];
  if (start) {
    const gx = start.x;
    const gy = start.y;
    g.fillStyle(0xf3f1ec, 0.95);
    g.fillRect(gx + start.nx * start.width * 0.5 - 6, gy + start.ny * start.width * 0.5 - 48, 10, 56);
    g.fillRect(gx - start.nx * start.width * 0.5 - 6, gy - start.ny * start.width * 0.5 - 48, 10, 56);
    g.fillStyle(theme.pole, 0.9);
    g.fillRect(gx - start.nx * start.width * 0.52, gy - 42, start.width * 1.04, 12);
    for (let i = 0; i < 8; i += 1) {
      g.fillStyle(i % 2 ? 0x111113 : 0xf3f1ec, 1);
      g.fillRect(gx - start.width * 0.4 + i * (start.width * 0.1), gy - 42, start.width * 0.1, 12);
    }
  }

  if (quality === "low") return;

  for (let i = 0; i < samples.length; i += 3) {
    const s = samples[i];
    const n = samples[(i + 3) % samples.length];
    const turn = Math.abs(s.tx * n.ty - s.ty * n.tx);
    const side = s.width * 0.5 + 8;
    if (i % 4 === 0) {
      drawSodiumLamp(g, s.x + s.nx * (side + 10), s.y + s.ny * (side + 10), 34, theme.pole);
      drawSodiumLamp(g, s.x - s.nx * (side + 10), s.y - s.ny * (side + 10), 34, theme.pole);
    }
    if (i % 5 === 0) {
      drawBush(g, s.x + s.nx * (side + 22), s.y + s.ny * (side + 22), 11 + (i % 3) * 2, mixColor(theme.grass, 0x0a1810, 0.2));
      drawBush(g, s.x - s.nx * (side + 26), s.y - s.ny * (side + 26), 9 + (i % 4), mixColor(theme.grass, 0x243818, 0.15));
    }
    if (i % 6 === 0) {
      const fx = s.x + s.nx * (side + 28);
      const fy = s.y + s.ny * (side + 28);
      g.fillStyle(theme.building, 1);
      g.fillRect(fx - 14, fy - 40, 28, 52);
      g.fillStyle(theme.pole, 0.22 + (Math.sin(t / 260 + i) > 0.2 ? 0.12 : 0));
      g.fillRect(fx - 8, fy - 28, 6, 7);
      g.fillRect(fx + 2, fy - 16, 6, 7);
      if (i % 18 === 0) {
        g.fillStyle(theme.accent, 0.55);
        g.fillRect(fx - 12, fy - 46, 24, 8);
      } else if (i % 12 === 0) {
        g.fillStyle(0x4ad4e8, 0.4);
        g.fillRect(fx - 12, fy - 46, 24, 8);
      }
    }
    if (i % 9 === 0) {
      const sx = s.x - s.nx * (side + 18);
      const sy = s.y - s.ny * (side + 18);
      g.fillStyle(0x2a2430, 1);
      g.fillRect(sx - 3, sy - 20, 6, 24);
      g.fillStyle(theme.pole, 0.92);
      g.fillTriangle(sx, sy - 32, sx + 14, sy - 22, sx, sy - 12);
    }
    g.fillStyle(mixColor(theme.barrier, 0xffffff, 0.18), 0.95);
    g.fillRect(s.x + s.nx * (side + 2) - 3, s.y + s.ny * (side + 2) - 8, 6, 16);
    g.fillRect(s.x - s.nx * (side + 2) - 3, s.y - s.ny * (side + 2) - 8, 6, 16);
    if (turn > 0.1) {
      g.fillStyle(theme.pole, 0.9);
      const hx = s.x + s.nx * (s.width * 0.3);
      const hy = s.y + s.ny * (s.width * 0.3);
      g.fillTriangle(hx, hy, hx + s.tx * 16, hy + s.ty * 16, hx + s.nx * 8, hy + s.ny * 8);
    }
    const px = s.x - s.nx * (side + 20);
    const py = s.y - s.ny * (side + 20);
    if (def.id === "foundation") {
      if (i % 18 === 0) drawContainer(g, px - 16, py - 12, 32, 18, i % 36 === 0 ? 0xc45c3a : 0x3a6a88);
      if (i === 36) drawCrane(g, px, py + 16, 70, 0x3a3a40);
    } else if (def.id === "technical") {
      if (i % 21 === 0) {
        g.fillStyle(0x1c2230, 1);
        g.fillRect(px - 10, py - 36, 24, 42);
        g.fillStyle(0xffb45a, 0.28);
        g.fillRect(px - 4, py - 24, 7, 7);
      }
    } else if (i % 15 === 0) {
      g.fillStyle(0x2a3440, 1);
      g.fillRect(px - 4, py - 28, 8, 32);
    }
  }

  // short tunnel collar so a mid-run frame can read as a place
  const tunnel = samples[Math.floor(samples.length * 0.42)];
  if (tunnel && quality === "high") {
    const tw = tunnel.width * 0.62;
    g.fillStyle(0x12161c, 0.92);
    g.fillRect(tunnel.x - tw, tunnel.y - 36, tw * 2, 72);
    g.fillStyle(theme.pole, 0.18);
    g.fillRect(tunnel.x - tw + 8, tunnel.y - 8, tw * 2 - 16, 6);
  }
}

function drawHarbourWorld(g: Phaser.GameObjects.Graphics, def: TrackDef, quality: string, t: number) {
  g.fillStyle(0x0a1828, 1);
  g.fillRect(0, def.worldH * 0.58, def.worldW, def.worldH * 0.42);
  g.fillStyle(0xe8d8a0, 0.1);
  g.fillCircle(def.worldW * 0.78, def.worldH * 0.16, 70);
  if (quality !== "low") {
    g.fillStyle(0x1a3a4a, 0.32 + Math.sin(t / 700) * 0.05);
    for (let i = 0; i < 14; i += 1) g.fillRect(i * 280, def.worldH * 0.66 + Math.sin(t / 400 + i) * 5, 200, 7);
    drawCrane(g, 420, def.worldH * 0.68, 180, 0x3a3a44);
    drawCrane(g, 980, def.worldH * 0.7, 150, 0x2a2a32);
    drawContainer(g, 260, def.worldH * 0.68 - 36, 64, 36, 0xc45c3a);
    drawContainer(g, 330, def.worldH * 0.68 - 36, 64, 36, 0x3a6a88);
  }
}

function drawDistrictWorld(g: Phaser.GameObjects.Graphics, def: TrackDef, quality: string, t: number) {
  g.fillStyle(0x0c121c, 1);
  g.fillRect(0, 0, def.worldW, def.worldH);
  g.fillStyle(0xe8d8a0, 0.08);
  g.fillCircle(def.worldW * 0.2, def.worldH * 0.14, 54);
  if (quality === "low") return;
  for (let i = 0; i < 14; i += 1) {
    const x = 120 + i * 210;
    const h = 110 + (i % 5) * 36;
    g.fillStyle(0x1a2434, 1);
    g.fillRect(x, def.worldH * 0.7 - h, 64, h);
    g.fillStyle(0xf0b84a, 0.1 + (Math.sin(t / 240 + i) > 0.35 ? 0.1 : 0));
    g.fillRect(x + 10, def.worldH * 0.7 - h + 16, 10, 8);
    g.fillRect(x + 36, def.worldH * 0.7 - h + 30, 10, 8);
  }
  g.fillStyle(0xe35aa0, 0.28);
  g.fillRect(640, 420, 86, 22);
  g.fillStyle(0x4ad4e8, 0.24);
  g.fillRect(1680, 980, 70, 20);
}

function drawRidgeWorld(g: Phaser.GameObjects.Graphics, def: TrackDef, quality: string, t: number) {
  g.fillStyle(0x0a1420, 1);
  g.fillRect(0, 0, def.worldW, def.worldH);
  g.fillStyle(0x1a2834, 1);
  g.fillTriangle(200, def.worldH * 0.78, 700, def.worldH * 0.4, 1180, def.worldH * 0.78);
  g.fillTriangle(900, def.worldH * 0.8, 1600, def.worldH * 0.34, 2300, def.worldH * 0.8);
  g.fillStyle(0x243444, 1);
  g.fillTriangle(1400, def.worldH * 0.82, 2100, def.worldH * 0.48, 2800, def.worldH * 0.82);
  if (quality !== "low") {
    g.fillStyle(0xe8f0ff, 0.12);
    g.fillCircle(def.worldW * 0.7, def.worldH * 0.16, 64);
    g.fillStyle(0xf0b84a, 0.08 + Math.sin(t / 500) * 0.03);
    g.fillRect(0, def.worldH * 0.32, def.worldW, 6);
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
    g.fillStyle(0x141418, Math.min(0.7, m.life * 0.28 + m.slip * 0.3));
    g.fillCircle(m.x, m.y, 4.4 + m.slip * 2.4);
  }
}

export function drawGhost(g: Phaser.GameObjects.Graphics, pose: GhostSample | null, accent: number) {
  if (!pose) return;
  drawArcadeCar(g, pose.x, pose.y, pose.a, {
    accent,
    drifting: false,
    steer: 0,
    lean: 0,
    brake: 0,
    headlight: 0.35,
  });
}

export function drawCar(g: Phaser.GameObjects.Graphics, car: Car, accent: number, smash = 0) {
  drawArcadeCar(g, car.x, car.y, car.angle, {
    accent,
    drifting: car.drifting,
    steer: car.steer,
    lean: car.lateral * 0.004,
    brake: car.brakeLight,
    headlight: 0.75 + car.throttle * 0.2,
    smash,
    wheelSpin: car.speed * 0.04,
  });
}

export function drawHudChrome(
  overlay: Phaser.GameObjects.Graphics,
  w: number,
  h: number,
  touch: boolean,
  flash: number,
  meters?: { drift: number; combo: number; live: number },
) {
  overlay.clear();
  if (flash > 0) {
    overlay.fillStyle(0xffffff, flash);
    overlay.fillRect(0, 0, w, h);
  }
  if (meters) {
    const drift = Math.min(1, meters.drift);
    overlay.fillStyle(0x0a1018, 0.45);
    overlay.fillRect(18, 228, 176, 28);
    overlay.fillStyle(0xffffff, 0.12);
    overlay.fillRect(26, 236, 160, 4);
    overlay.fillStyle(0xf0b84a, 0.95);
    overlay.fillRect(26, 236, 160 * drift, 4);
    overlay.fillStyle(0x8dffc1, meters.live > 8 ? 0.92 : 0.2);
    overlay.fillRect(26, 244, Math.min(160, Math.max(8, meters.live / 28)), 4);
  }
  if (!touch) return;
  overlay.fillStyle(0xffffff, 0.05);
  overlay.fillRect(18, h * 0.22, w * 0.28, h * 0.46);
  overlay.fillRect(w - 18 - w * 0.28, h * 0.22, w * 0.28, h * 0.46);
  overlay.fillStyle(0xf0b84a, 0.22);
  overlay.fillRect(w / 2 - 70, h - 88, 140, 58);
}

export function drawCountdown(overlay: Phaser.GameObjects.Graphics, w: number, h: number, remain: number) {
  if (remain <= 0) return;
  const step = remain > 3 ? 3 : remain > 2 ? 2 : remain > 1 ? 1 : 0;
  overlay.fillStyle(0x000000, 0.28);
  overlay.fillRect(0, 0, w, h);
  overlay.fillStyle(step === 0 ? 0x8dffc1 : 0xf3f1ec, 0.95);
  const bw = step === 0 ? 160 : 90;
  overlay.fillRoundedRect(w / 2 - bw / 2, h / 2 - 46, bw, 92, 16);
}
