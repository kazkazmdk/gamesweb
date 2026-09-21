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
  g.fillStyle(mixColor(theme.grass, theme.sky, 0.28), 1);
  g.fillRect(0, def.worldH * 0.16, def.worldW, def.worldH * 0.84);

  if (def.id === "foundation") drawHarbourWorld(g, def, quality, t);
  else if (def.id === "technical") drawDistrictWorld(g, def, quality, t);
  else drawRidgeWorld(g, def, quality, t);

  // earth / grass shoulders sit inside the camera, not in a distant void
  for (let i = 0; i < samples.length; i += 1) {
    const s = samples[i];
    const n = samples[(i + 1) % samples.length];
    const w = s.width * 0.5 + 92;
    g.fillStyle(theme.grass, 1);
    fillStrip(g, s.x, s.y, s.nx, s.ny, n.x, n.y, n.nx, n.ny, w);
  }
  for (let i = 0; i < samples.length; i += 1) {
    const s = samples[i];
    const n = samples[(i + 1) % samples.length];
    g.fillStyle(mixColor(theme.grass, 0x3a2a18, 0.35), 1);
    fillStrip(g, s.x, s.y, s.nx, s.ny, n.x, n.y, n.nx, n.ny, s.width * 0.5 + 54);
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

  const step = quality === "high" ? 2 : 3;
  for (let i = 0; i < samples.length; i += step) {
    const s = samples[i];
    const n = samples[(i + 3) % samples.length];
    const turn = Math.abs(s.tx * n.ty - s.ty * n.tx);
    const side = s.width * 0.5 + 8;
    const u = i / samples.length;
    const family = roadsideFamily(def.id, u, turn);
    const outer = side + 18;

    g.fillStyle(mixColor(theme.barrier, 0xffffff, 0.18), 0.95);
    g.fillRect(s.x + s.nx * (side + 2) - 3, s.y + s.ny * (side + 2) - 8, 6, 16);
    g.fillRect(s.x - s.nx * (side + 2) - 3, s.y - s.ny * (side + 2) - 8, 6, 16);

    if (family === "service") {
      drawSodiumLamp(g, s.x + s.nx * (outer + 6), s.y + s.ny * (outer + 6), 36, theme.pole);
      if (i % 2 === 0) drawSodiumLamp(g, s.x - s.nx * (outer + 4), s.y - s.ny * (outer + 4), 32, theme.pole);
      if (i % 4 === 0) {
        drawContainer(g, s.x + s.nx * (outer + 22) - 16, s.y + s.ny * (outer + 22) - 10, 34, 18, i % 8 === 0 ? 0xc45c3a : 0x3a6a88);
        g.fillStyle(0x2a2a28, 1);
        g.fillRect(s.x - s.nx * (outer + 16) - 14, s.y - s.ny * (outer + 16) - 8, 28, 16);
        g.fillStyle(theme.pole, 0.55);
        g.fillRect(s.x - s.nx * (outer + 16) - 12, s.y - s.ny * (outer + 16) - 6, 10, 6);
      }
      if (i % 6 === 0) {
        g.fillStyle(0x1c2228, 1);
        g.fillRect(s.x + s.nx * (outer + 36) - 18, s.y + s.ny * (outer + 36) - 16, 40, 22);
        g.fillStyle(theme.pole, 0.35);
        g.fillRect(s.x + s.nx * (outer + 36) - 14, s.y + s.ny * (outer + 36) - 12, 12, 8);
      }
    } else if (family === "touge") {
      drawBush(g, s.x + s.nx * (outer + 10), s.y + s.ny * (outer + 10), 13 + (i % 3) * 3, mixColor(theme.grass, 0x0a1810, 0.15));
      drawBush(g, s.x - s.nx * (outer + 14), s.y - s.ny * (outer + 14), 11 + (i % 4) * 2, mixColor(theme.grass, 0x243818, 0.12));
      if (i % 2 === 0) {
        drawBush(g, s.x + s.nx * (outer + 28), s.y + s.ny * (outer + 28), 16, mixColor(theme.grass, 0x142010, 0.2));
      }
      g.fillStyle(0x2a2430, 1);
      g.fillRect(s.x - s.nx * (outer + 8) - 3, s.y - s.ny * (outer + 8) - 18, 6, 22);
      g.fillStyle(theme.pole, 0.92);
      g.fillTriangle(
        s.x - s.nx * (outer + 8),
        s.y - s.ny * (outer + 8) - 30,
        s.x - s.nx * (outer + 8) + 14,
        s.y - s.ny * (outer + 8) - 20,
        s.x - s.nx * (outer + 8),
        s.y - s.ny * (outer + 8) - 10,
      );
      if (turn > 0.08) {
        g.fillStyle(theme.pole, 0.95);
        const hx = s.x + s.nx * (s.width * 0.28);
        const hy = s.y + s.ny * (s.width * 0.28);
        g.fillTriangle(hx, hy, hx + s.tx * 16, hy + s.ty * 16, hx + s.nx * 8, hy + s.ny * 8);
      }
    } else {
      const tw = s.width * 0.58;
      g.fillStyle(0x12161c, 0.94);
      g.fillRect(s.x - tw, s.y - 28, tw * 2, 56);
      g.fillStyle(0x0a0c10, 0.88);
      g.fillRect(s.x - tw - 10, s.y - 40, 16, 80);
      g.fillRect(s.x + tw - 6, s.y - 40, 16, 80);
      if (i % 2 === 0) {
        g.fillStyle(theme.pole, 0.22);
        g.fillRect(s.x - tw + 10, s.y - 6, tw * 2 - 20, 5);
      }
      if (i % 3 === 0) {
        g.fillStyle(0xf0b84a, 0.16);
        g.fillCircle(s.x, s.y - 18, 10);
      }
    }
  }

  if (def.id === "velocity") {
    const tunnelStart = Math.floor(samples.length * 0.38);
    const tunnelEnd = Math.floor(samples.length * 0.5);
    for (let i = tunnelStart; i < tunnelEnd; i += 1) {
      const s = samples[i];
      if (!s) continue;
      const tw = s.width * 0.72;
      g.fillStyle(0x081018, i === tunnelStart || i === tunnelEnd - 1 ? 0.96 : 0.78);
      g.fillRect(s.x - tw, s.y - 48, tw * 2, 96);
    }
  }
}

function roadsideFamily(id: TrackDef["id"], u: number, turn: number): "service" | "touge" | "tunnel" {
  if (id === "foundation") return "service";
  if (id === "technical") return "touge";
  if ((u > 0.36 && u < 0.52) || turn > 0.12) return "tunnel";
  return "service";
}

function drawHarbourWorld(g: Phaser.GameObjects.Graphics, def: TrackDef, quality: string, t: number) {
  g.fillStyle(0x0a2038, 1);
  g.fillRect(0, def.worldH * 0.42, def.worldW, def.worldH * 0.58);
  g.fillStyle(0x0e2c48, 1);
  g.fillRect(0, def.worldH * 0.58, def.worldW, def.worldH * 0.42);
  g.fillStyle(0xffc14a, 0.18);
  g.fillCircle(def.worldW * 0.82, def.worldH * 0.12, 110);
  g.fillStyle(0xff8a3a, 0.08);
  g.fillRect(0, 0, def.worldW, def.worldH * 0.22);
  if (quality !== "low") {
    g.fillStyle(0x1a4a58, 0.4 + Math.sin(t / 700) * 0.06);
    for (let i = 0; i < 16; i += 1) g.fillRect(i * 240, def.worldH * 0.62 + Math.sin(t / 400 + i) * 8, 180, 10);
    drawCrane(g, 360, def.worldH * 0.58, 240, 0x4a3a28);
    drawCrane(g, 920, def.worldH * 0.6, 210, 0x3a2a22);
    drawCrane(g, 1680, def.worldH * 0.56, 260, 0x2a2420);
    drawContainer(g, 220, def.worldH * 0.62 - 40, 78, 42, 0xc45c3a);
    drawContainer(g, 300, def.worldH * 0.62 - 40, 78, 42, 0x3a6a88);
    drawContainer(g, 700, def.worldH * 0.64 - 36, 70, 36, 0xe35aa0);
    drawSodiumLamp(g, 540, def.worldH * 0.5, 52, 0xffc14a);
    drawSodiumLamp(g, 1180, def.worldH * 0.48, 56, 0xffc14a);
  }
}

function drawDistrictWorld(g: Phaser.GameObjects.Graphics, def: TrackDef, quality: string, t: number) {
  g.fillStyle(0x0a1810, 1);
  g.fillRect(0, 0, def.worldW, def.worldH);
  g.fillStyle(0x142818, 1);
  g.fillTriangle(0, def.worldH, 420, def.worldH * 0.18, 860, def.worldH);
  g.fillTriangle(700, def.worldH, 1280, def.worldH * 0.08, 1900, def.worldH);
  g.fillStyle(0x1a3020, 1);
  g.fillTriangle(1400, def.worldH, 1980, def.worldH * 0.22, def.worldW, def.worldH);
  if (quality === "low") return;
  for (let i = 0; i < 22; i += 1) {
    const x = 40 + i * 118;
    const h = 160 + (i % 4) * 70;
    g.fillStyle(mixColor(0x0c1810, 0x243818, (i % 5) / 5), 1);
    g.fillRect(x, def.worldH * 0.92 - h, 36, h);
    drawBush(g, x + 18, def.worldH * 0.92 - h - 8, 16 + (i % 3) * 4, 0x1a3820);
  }
  g.fillStyle(0xff8a3a, 0.22);
  g.fillRect(480, 620, 18, 120);
  g.fillRect(1120, 980, 18, 160);
  void t;
}

function drawRidgeWorld(g: Phaser.GameObjects.Graphics, def: TrackDef, quality: string, t: number) {
  g.fillStyle(0x081420, 1);
  g.fillRect(0, def.worldH * 0.28, def.worldW, def.worldH * 0.72);
  g.fillStyle(0x122030, 1);
  g.fillTriangle(-80, def.worldH * 0.92, 780, def.worldH * 0.18, 1640, def.worldH * 0.92);
  g.fillStyle(0x1a2c3c, 1);
  g.fillTriangle(900, def.worldH, 2100, def.worldH * 0.08, 3400, def.worldH);
  g.fillStyle(0x0a1824, 1);
  g.fillRect(0, def.worldH * 0.78, def.worldW, def.worldH * 0.22);
  if (quality !== "low") {
    g.fillStyle(0xc8e8ff, 0.16);
    g.fillCircle(def.worldW * 0.78, def.worldH * 0.1, 88);
    g.fillStyle(0x7ad0ff, 0.08 + Math.sin(t / 500) * 0.03);
    g.fillRect(0, def.worldH * 0.16, def.worldW, 8);
    g.fillStyle(0x0a1014, 0.55);
    g.fillRect(def.worldW * 0.42, def.worldH * 0.36, def.worldW * 0.22, 70);
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
