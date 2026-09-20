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
    const w = s.width * 0.5 + 118;
    g.fillStyle(mixColor(theme.grass, theme.sky, 0.18), 1);
    fillStrip(g, s.x, s.y, s.nx, s.ny, n.x, n.y, n.nx, n.ny, w);
  }
  for (let i = 0; i < samples.length; i += 1) {
    const s = samples[i];
    const n = samples[(i + 1) % samples.length];
    g.fillStyle(theme.grass, 1);
    fillStrip(g, s.x, s.y, s.nx, s.ny, n.x, n.y, n.nx, n.ny, s.width * 0.5 + 78);
  }
  for (let i = 0; i < samples.length; i += 1) {
    const s = samples[i];
    const n = samples[(i + 1) % samples.length];
    g.fillStyle(mixColor(theme.grass, 0x3a2a18, 0.35), 1);
    fillStrip(g, s.x, s.y, s.nx, s.ny, n.x, n.y, n.nx, n.ny, s.width * 0.5 + 42);
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

  const family = def.id === "foundation" ? "harbour" : def.id === "technical" ? "service" : "touge";
  for (let i = 0; i < samples.length; i += 2) {
    const s = samples[i];
    const n = samples[(i + 2) % samples.length];
    const turn = Math.abs(s.tx * n.ty - s.ty * n.tx);
    const side = s.width * 0.5 + 8;
    if (i % 3 === 0) {
      drawSodiumLamp(g, s.x + s.nx * (side + 8), s.y + s.ny * (side + 8), 36, theme.pole);
      drawSodiumLamp(g, s.x - s.nx * (side + 10), s.y - s.ny * (side + 10), 32, theme.pole);
    }
    if (i % 4 === 0) {
      drawBush(g, s.x + s.nx * (side + 20), s.y + s.ny * (side + 20), 12 + (i % 3) * 2, mixColor(theme.grass, 0x0a1810, 0.2));
      drawBush(g, s.x - s.nx * (side + 24), s.y - s.ny * (side + 24), 10 + (i % 4), mixColor(theme.grass, 0x243818, 0.15));
    }
    g.fillStyle(mixColor(theme.barrier, 0xffffff, 0.18), 0.95);
    g.fillRect(s.x + s.nx * (side + 2) - 3, s.y + s.ny * (side + 2) - 8, 6, 16);
    g.fillRect(s.x - s.nx * (side + 2) - 3, s.y - s.ny * (side + 2) - 8, 6, 16);
    if (turn > 0.08) {
      g.fillStyle(theme.pole, 0.9);
      const hx = s.x + s.nx * (s.width * 0.3);
      const hy = s.y + s.ny * (s.width * 0.3);
      g.fillTriangle(hx, hy, hx + s.tx * 16, hy + s.ty * 16, hx + s.nx * 8, hy + s.ny * 8);
    }
    if (family === "harbour") drawHarbourCurb(g, s, side, i, theme, t);
    else if (family === "service") drawServiceCurb(g, s, side, i, theme, t);
    else drawTougeCurb(g, s, side, i, theme);
  }

  if (family === "service") {
    for (const frac of [0.18, 0.42, 0.71]) {
      const tunnel = samples[Math.floor(samples.length * frac)];
      if (!tunnel) continue;
      const tw = tunnel.width * 0.7;
      g.fillStyle(0x12161c, 0.96);
      g.fillRect(tunnel.x - tw, tunnel.y - 44, tw * 2, 88);
      g.fillStyle(0x1c2430, 1);
      g.fillRect(tunnel.x - tw - 10, tunnel.y - 52, 14, 104);
      g.fillRect(tunnel.x + tw - 4, tunnel.y - 52, 14, 104);
      g.fillStyle(theme.pole, 0.22);
      g.fillRect(tunnel.x - tw + 10, tunnel.y - 10, tw * 2 - 20, 7);
    }
  }
}

function drawHarbourCurb(
  g: Phaser.GameObjects.Graphics,
  s: TrackSample,
  side: number,
  i: number,
  theme: TrackDef["theme"],
  t: number,
) {
  const fx = s.x + s.nx * (side + 26);
  const fy = s.y + s.ny * (side + 26);
  const px = s.x - s.nx * (side + 22);
  const py = s.y - s.ny * (side + 22);
  if (i % 4 === 0) {
    g.fillStyle(theme.building, 1);
    g.fillRect(fx - 18, fy - 52, 36, 68);
    g.fillStyle(theme.pole, 0.28 + (Math.sin(t / 260 + i) > 0.2 ? 0.14 : 0));
    g.fillRect(fx - 10, fy - 36, 8, 8);
    g.fillRect(fx + 4, fy - 22, 8, 8);
    g.fillStyle(0x4ad4e8, 0.45);
    g.fillRect(fx - 16, fy - 58, 32, 8);
  }
  if (i % 6 === 0) drawContainer(g, px - 18, py - 14, 36, 20, i % 12 === 0 ? 0xc45c3a : 0x3a6a88);
  if (i % 18 === 0) drawCrane(g, px, py + 18, 86, 0x3a3a40);
}

function drawServiceCurb(
  g: Phaser.GameObjects.Graphics,
  s: TrackSample,
  side: number,
  i: number,
  theme: TrackDef["theme"],
  t: number,
) {
  const fx = s.x + s.nx * (side + 24);
  const fy = s.y + s.ny * (side + 24);
  const px = s.x - s.nx * (side + 20);
  const py = s.y - s.ny * (side + 20);
  if (i % 4 === 0) {
    g.fillStyle(0x1c2230, 1);
    g.fillRect(fx - 14, fy - 40, 30, 50);
    g.fillStyle(0xffb45a, 0.32 + (Math.sin(t / 200 + i) > 0 ? 0.1 : 0));
    g.fillRect(fx - 6, fy - 26, 8, 8);
    g.fillStyle(0x2a323c, 1);
    g.fillRect(fx - 20, fy + 8, 42, 10);
  }
  if (i % 5 === 0) {
    g.fillStyle(0x2a2430, 1);
    g.fillRect(px - 4, py - 22, 8, 28);
    g.fillStyle(theme.pole, 0.9);
    g.fillTriangle(px, py - 36, px + 16, py - 24, px, py - 12);
  }
  if (i % 10 === 0) {
    g.fillStyle(0x161c24, 0.92);
    g.fillRect(px - 22, py - 18, 48, 22);
    g.fillStyle(theme.pole, 0.2);
    g.fillRect(px - 16, py - 10, 36, 5);
  }
}

function drawTougeCurb(
  g: Phaser.GameObjects.Graphics,
  s: TrackSample,
  side: number,
  i: number,
  theme: TrackDef["theme"],
) {
  const fx = s.x + s.nx * (side + 22);
  const fy = s.y + s.ny * (side + 22);
  const px = s.x - s.nx * (side + 18);
  const py = s.y - s.ny * (side + 18);
  if (i % 3 === 0) {
    g.fillStyle(0x243444, 1);
    g.fillTriangle(fx - 18, fy + 16, fx, fy - 46, fx + 22, fy + 16);
    g.fillStyle(mixColor(theme.grass, 0x0a1810, 0.15), 1);
    drawBush(g, fx + 10, fy + 6, 14, mixColor(theme.grass, 0x0a1810, 0.25));
  }
  if (i % 4 === 0) {
    g.fillStyle(0x2a3440, 1);
    g.fillRect(px - 5, py - 30, 10, 36);
    g.fillStyle(0x6a7a6a, 1);
    g.fillRect(px - 16, py - 6, 32, 6);
  }
  if (i % 8 === 0) {
    g.fillStyle(0x1a2834, 1);
    g.fillRect(px - 8, py - 48, 8, 52);
    g.fillStyle(theme.pole, 0.85);
    g.fillTriangle(px - 4, py - 62, px + 14, py - 50, px - 4, py - 38);
  }
}

function drawHarbourWorld(g: Phaser.GameObjects.Graphics, def: TrackDef, quality: string, t: number) {
  g.fillStyle(0x12202c, 1);
  g.fillRect(0, def.worldH * 0.42, def.worldW, def.worldH * 0.58);
  g.fillStyle(0x0a1828, 1);
  g.fillRect(0, def.worldH * 0.62, def.worldW, def.worldH * 0.38);
  g.fillStyle(0xe8d8a0, 0.12);
  g.fillCircle(def.worldW * 0.78, def.worldH * 0.16, 90);
  if (quality !== "low") {
    g.fillStyle(0x1a3a4a, 0.36 + Math.sin(t / 700) * 0.05);
    for (let i = 0; i < 18; i += 1) g.fillRect(i * 220, def.worldH * 0.6 + Math.sin(t / 400 + i) * 5, 170, 7);
    drawCrane(g, 420, def.worldH * 0.64, 200, 0x3a3a44);
    drawCrane(g, 980, def.worldH * 0.66, 170, 0x2a2a32);
    drawCrane(g, 1680, def.worldH * 0.62, 150, 0x3a3a40);
    for (let i = 0; i < 8; i += 1) {
      drawContainer(g, 220 + i * 90, def.worldH * 0.64 - 36, 64, 36, i % 2 ? 0xc45c3a : 0x3a6a88);
    }
    g.fillStyle(0x1a2834, 1);
    for (let i = 0; i < 10; i += 1) g.fillRect(80 + i * 340, def.worldH * 0.48, 70, 90 + (i % 3) * 24);
  }
}

function drawDistrictWorld(g: Phaser.GameObjects.Graphics, def: TrackDef, quality: string, t: number) {
  g.fillStyle(0x101820, 1);
  g.fillRect(0, 0, def.worldW, def.worldH);
  g.fillStyle(0x161e28, 1);
  g.fillRect(0, def.worldH * 0.38, def.worldW, def.worldH * 0.62);
  g.fillStyle(0xe8d8a0, 0.1);
  g.fillCircle(def.worldW * 0.2, def.worldH * 0.14, 64);
  if (quality === "low") return;
  for (let i = 0; i < 18; i += 1) {
    const x = 60 + i * 160;
    const h = 90 + (i % 5) * 40;
    g.fillStyle(0x1a2434, 1);
    g.fillRect(x, def.worldH * 0.62 - h, 56, h);
    g.fillStyle(0xf0b84a, 0.12 + (Math.sin(t / 240 + i) > 0.35 ? 0.12 : 0));
    g.fillRect(x + 8, def.worldH * 0.62 - h + 14, 10, 8);
    g.fillRect(x + 30, def.worldH * 0.62 - h + 28, 10, 8);
  }
  g.fillStyle(0xe35aa0, 0.28);
  g.fillRect(640, 420, 86, 22);
  g.fillStyle(0x4ad4e8, 0.24);
  g.fillRect(1680, 980, 70, 20);
  g.fillStyle(0x121820, 0.55);
  g.fillRect(0, def.worldH * 0.52, def.worldW, 18);
}

function drawRidgeWorld(g: Phaser.GameObjects.Graphics, def: TrackDef, quality: string, t: number) {
  g.fillStyle(0x101c1a, 1);
  g.fillRect(0, 0, def.worldW, def.worldH);
  g.fillStyle(0x1a2834, 1);
  g.fillTriangle(200, def.worldH * 0.78, 700, def.worldH * 0.36, 1180, def.worldH * 0.78);
  g.fillTriangle(900, def.worldH * 0.8, 1600, def.worldH * 0.3, 2300, def.worldH * 0.8);
  g.fillStyle(0x243444, 1);
  g.fillTriangle(1400, def.worldH * 0.82, 2100, def.worldH * 0.42, 2800, def.worldH * 0.82);
  g.fillTriangle(2400, def.worldH * 0.86, 3200, def.worldH * 0.5, 4000, def.worldH * 0.86);
  g.fillStyle(0x16241c, 1);
  g.fillRect(0, def.worldH * 0.58, def.worldW, def.worldH * 0.42);
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
