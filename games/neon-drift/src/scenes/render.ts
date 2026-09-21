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

  drawOpeningPlaces(g, samples, theme);
  drawTunnelMouth(g, samples, theme);

  const step = quality === "high" ? 2 : 3;
  for (let i = 0; i < samples.length; i += step) {
    const s = samples[i];
    const n = samples[(i + 3) % samples.length];
    const turn = Math.abs(s.tx * n.ty - s.ty * n.tx);
    const side = s.width * 0.5 + 10;
    const u = i / samples.length;
    const family = roadsideFamily(u, turn);
    const outer = side + 28;

    g.fillStyle(mixColor(theme.barrier, 0xffffff, 0.22), 0.95);
    g.fillRect(s.x + s.nx * (side + 2) - 4, s.y + s.ny * (side + 2) - 12, 8, 24);
    g.fillRect(s.x - s.nx * (side + 2) - 4, s.y - s.ny * (side + 2) - 12, 8, 24);

    if (family === "service") {
      drawSodiumLamp(g, s.x + s.nx * (outer + 8), s.y + s.ny * (outer + 8), 52, theme.pole);
      if (i % 2 === 0) drawSodiumLamp(g, s.x - s.nx * (outer + 6), s.y - s.ny * (outer + 6), 46, theme.pole);
      if (i % 3 === 0) {
        drawContainer(g, s.x + s.nx * (outer + 36) - 28, s.y + s.ny * (outer + 36) - 16, 56, 28, i % 6 === 0 ? 0xc45c3a : 0x3a6a88);
        g.fillStyle(0x1c1c1a, 1);
        g.fillRect(s.x - s.nx * (outer + 28) - 22, s.y - s.ny * (outer + 28) - 14, 44, 26);
        g.fillStyle(0x2a8a7a, 0.7);
        g.fillRect(s.x - s.nx * (outer + 28) - 16, s.y - s.ny * (outer + 28) - 8, 14, 10);
        g.fillStyle(theme.pole, 0.55);
        g.fillRect(s.x - s.nx * (outer + 28) - 18, s.y - s.ny * (outer + 28) - 10, 12, 8);
      }
      if (i % 5 === 0) {
        g.fillStyle(0x1a2228, 1);
        g.fillRect(s.x + s.nx * (outer + 58) - 28, s.y + s.ny * (outer + 58) - 22, 64, 36);
        g.fillStyle(0xf0b84a, 0.28);
        g.fillRect(s.x + s.nx * (outer + 58) - 20, s.y + s.ny * (outer + 58) - 14, 20, 12);
        g.fillStyle(0x4ad4e8, 0.22);
        g.fillRect(s.x + s.nx * (outer + 58) + 8, s.y + s.ny * (outer + 58) - 14, 16, 12);
      }
    } else if (family === "touge") {
      drawBush(g, s.x + s.nx * (outer + 16), s.y + s.ny * (outer + 16), 22 + (i % 3) * 5, mixColor(theme.grass, 0x0a1810, 0.15));
      drawBush(g, s.x - s.nx * (outer + 20), s.y - s.ny * (outer + 20), 18 + (i % 4) * 4, mixColor(theme.grass, 0x243818, 0.12));
      if (i % 2 === 0) {
        drawBush(g, s.x + s.nx * (outer + 42), s.y + s.ny * (outer + 42), 26, mixColor(theme.grass, 0x142010, 0.2));
      }
      g.fillStyle(0x6a6254, 1);
      g.fillRect(s.x - s.nx * (outer + 6) - 10, s.y - s.ny * (outer + 6) - 18, 20, 36);
      g.fillStyle(0x2a2430, 1);
      g.fillRect(s.x - s.nx * (outer + 14) - 4, s.y - s.ny * (outer + 14) - 28, 8, 36);
      g.fillStyle(theme.pole, 0.95);
      g.fillTriangle(
        s.x - s.nx * (outer + 14),
        s.y - s.ny * (outer + 14) - 48,
        s.x - s.nx * (outer + 14) + 22,
        s.y - s.ny * (outer + 14) - 30,
        s.x - s.nx * (outer + 14),
        s.y - s.ny * (outer + 14) - 14,
      );
      if (turn > 0.06) {
        const hx = s.x + s.nx * (s.width * 0.22);
        const hy = s.y + s.ny * (s.width * 0.22);
        g.fillStyle(theme.pole, 0.96);
        g.fillTriangle(hx, hy, hx + s.tx * 28, hy + s.ty * 28, hx + s.nx * 14, hy + s.ny * 14);
        g.fillStyle(0x1a1814, 0.9);
        g.fillTriangle(hx + s.tx * 6, hy + s.ty * 6, hx + s.tx * 22, hy + s.ty * 22, hx + s.nx * 8, hy + s.ny * 8);
      }
    } else {
      const tw = s.width * 0.62;
      g.fillStyle(0x10141a, 0.94);
      g.fillRect(s.x - tw, s.y - 40, tw * 2, 80);
      g.fillStyle(0x080a0e, 0.9);
      g.fillRect(s.x - tw - 16, s.y - 56, 22, 112);
      g.fillRect(s.x + tw - 6, s.y - 56, 22, 112);
      if (i % 2 === 0) {
        g.fillStyle(theme.pole, 0.28);
        g.fillRect(s.x - tw + 14, s.y - 8, tw * 2 - 28, 7);
      }
      if (i % 3 === 0) {
        g.fillStyle(0xf0b84a, 0.2);
        g.fillCircle(s.x, s.y - 22, 14);
      }
    }
  }
}

function roadsideFamily(u: number, turn: number): "service" | "touge" | "tunnel" {
  if ((u > 0.18 && u < 0.32) || (u > 0.72 && u < 0.82)) return "tunnel";
  if (turn > 0.07 || (u > 0.08 && u < 0.2) || (u > 0.42 && u < 0.58)) return "touge";
  return "service";
}

function sampleAt(samples: TrackSample[], u: number) {
  return samples[Math.min(samples.length - 1, Math.max(0, Math.floor(u * samples.length)))];
}

function drawOpeningPlaces(g: Phaser.GameObjects.Graphics, samples: TrackSample[], theme: TrackDef["theme"]) {
  const start = samples[10] ?? samples[0];
  if (!start) return;
  const corner = sampleAt(samples, 0.14);
  const portal = sampleAt(samples, 0.24);

  const sx = start.x - start.nx * (start.width * 0.5 + 110);
  const sy = start.y - start.ny * (start.width * 0.5 + 110);
  g.fillStyle(0x2a2a26, 1);
  g.fillRect(sx - 110, sy - 52, 220, 104);
  g.fillStyle(0x3a3a34, 1);
  g.fillRect(sx - 122, sy - 64, 244, 22);
  g.fillStyle(0x1a1a18, 1);
  g.fillRect(sx - 36, sy - 14, 22, 34);
  g.fillRect(sx + 16, sy - 14, 22, 34);
  g.fillStyle(0xf0b84a, 0.62);
  g.fillCircle(sx - 56, sy - 10, 16);
  g.fillCircle(sx + 62, sy - 10, 16);
  g.fillStyle(theme.pole, 0.22);
  g.fillCircle(sx - 56, sy + 18, 42);
  g.fillCircle(sx + 62, sy + 18, 42);
  g.fillStyle(0x1c2228, 1);
  g.fillRect(sx + 86, sy + 8, 34, 42);
  g.fillStyle(0x4ad4e8, 0.5);
  g.fillRect(sx + 92, sy + 14, 22, 16);
  drawSodiumLamp(g, sx - 98, sy + 40, 72, theme.pole);
  drawSodiumLamp(g, sx + 108, sy + 40, 72, theme.pole);
  drawContainer(g, sx - 176, sy + 10, 52, 28, 0xc45c3a);

  if (corner) {
    const cx = corner.x + corner.nx * (corner.width * 0.5 + 36);
    const cy = corner.y + corner.ny * (corner.width * 0.5 + 36);
    g.fillStyle(0x6a6254, 1);
    g.fillRect(cx - 18, cy - 28, 36, 72);
    g.fillStyle(0x4a463c, 1);
    g.fillRect(cx - 22, cy - 32, 8, 80);
    for (let k = 0; k < 4; k += 1) {
      const hx = corner.x + corner.nx * (corner.width * 0.18) + corner.tx * (k * 26 - 30);
      const hy = corner.y + corner.ny * (corner.width * 0.18) + corner.ty * (k * 26 - 30);
      g.fillStyle(theme.pole, 0.96);
      g.fillTriangle(hx, hy, hx + corner.tx * 24, hy + corner.ty * 24, hx + corner.nx * 16, hy + corner.ny * 16);
    }
    drawBush(g, cx + corner.nx * 28, cy + corner.ny * 28, 28, mixColor(theme.grass, 0x0a1810, 0.2));
    drawBush(g, cx + corner.nx * 48, cy + corner.ny * 18, 22, mixColor(theme.grass, 0x142010, 0.15));
    drawBush(g, cx + corner.nx * 22 + corner.tx * 40, cy + corner.ny * 22 + corner.ty * 40, 24, mixColor(theme.grass, 0x1a2814, 0.1));
  }

  if (portal) {
    const tw = portal.width * 0.72;
    g.fillStyle(0x0a0c10, 0.96);
    g.fillRect(portal.x - tw - 18, portal.y - 70, 28, 140);
    g.fillRect(portal.x + tw - 10, portal.y - 70, 28, 140);
    g.fillStyle(0x161a20, 0.94);
    g.fillRect(portal.x - tw - 18, portal.y - 78, tw * 2 + 36, 22);
    g.fillStyle(0x08090c, 0.88);
    g.fillRect(portal.x - tw + 8, portal.y - 52, tw * 2 - 16, 104);
    g.fillStyle(theme.pole, 0.32);
    g.fillCircle(portal.x - tw * 0.35, portal.y - 36, 12);
    g.fillCircle(portal.x + tw * 0.35, portal.y - 36, 12);
    g.fillStyle(0xf0b84a, 0.18);
    g.fillRect(portal.x - tw + 16, portal.y + 10, tw * 2 - 32, 10);
  }
}

function drawTunnelMouth(g: Phaser.GameObjects.Graphics, samples: TrackSample[], theme: TrackDef["theme"]) {
  const tunnelStart = Math.floor(samples.length * 0.2);
  const tunnelEnd = Math.floor(samples.length * 0.32);
  for (let i = tunnelStart; i < tunnelEnd; i += 1) {
    const s = samples[i];
    if (!s) continue;
    const tw = s.width * 0.68;
    const portal = i === tunnelStart || i === tunnelEnd - 1;
    g.fillStyle(0x10141a, portal ? 0.96 : 0.74);
    g.fillRect(s.x - tw, s.y - 46, tw * 2, 92);
    if (portal) {
      g.fillStyle(0x080a0e, 0.92);
      g.fillRect(s.x - tw - 14, s.y - 62, 22, 124);
      g.fillRect(s.x + tw - 8, s.y - 62, 22, 124);
      g.fillStyle(theme.pole, 0.22);
      g.fillCircle(s.x, s.y - 28, 11);
    }
  }
}

function drawHarbourWorld(g: Phaser.GameObjects.Graphics, def: TrackDef, quality: string, t: number) {
  g.fillStyle(0x0a1828, 1);
  g.fillRect(0, def.worldH * 0.52, def.worldW, def.worldH * 0.48);
  g.fillStyle(0xe8d8a0, 0.12);
  g.fillCircle(def.worldW * 0.78, def.worldH * 0.16, 80);
  if (quality !== "low") {
    g.fillStyle(0x1a3a4a, 0.36 + Math.sin(t / 700) * 0.05);
    for (let i = 0; i < 16; i += 1) g.fillRect(i * 240, def.worldH * 0.62 + Math.sin(t / 400 + i) * 5, 180, 8);
    drawCrane(g, 360, def.worldH * 0.64, 210, 0x3a3a44);
    drawCrane(g, 920, def.worldH * 0.66, 180, 0x2a2a32);
    drawCrane(g, 1480, def.worldH * 0.7, 150, 0x32323a);
    drawContainer(g, 220, def.worldH * 0.64 - 40, 70, 40, 0xc45c3a);
    drawContainer(g, 300, def.worldH * 0.64 - 40, 70, 40, 0x3a6a88);
    drawContainer(g, 560, def.worldH * 0.66 - 36, 56, 32, 0xc45c3a);
  }
}

function drawDistrictWorld(g: Phaser.GameObjects.Graphics, def: TrackDef, quality: string, t: number) {
  g.fillStyle(0xe8d8a0, 0.08);
  g.fillCircle(def.worldW * 0.2, def.worldH * 0.12, 54);
  if (quality === "low") return;
  for (let i = 0; i < 16; i += 1) {
    const x = 80 + i * 180;
    const h = 90 + (i % 5) * 32;
    g.fillStyle(0x1a2434, 1);
    g.fillRect(x, def.worldH * 0.78 - h, 58, h);
    g.fillStyle(0xf0b84a, 0.1 + (Math.sin(t / 240 + i) > 0.35 ? 0.1 : 0));
    g.fillRect(x + 10, def.worldH * 0.78 - h + 16, 10, 8);
    g.fillRect(x + 32, def.worldH * 0.78 - h + 30, 10, 8);
  }
  g.fillStyle(0xe35aa0, 0.28);
  g.fillRect(640, 420, 86, 22);
  g.fillStyle(0x4ad4e8, 0.24);
  g.fillRect(1680, 980, 70, 20);
}

function drawRidgeWorld(g: Phaser.GameObjects.Graphics, def: TrackDef, quality: string, t: number) {
  g.fillStyle(0x1a2834, 1);
  g.fillTriangle(200, def.worldH * 0.86, 700, def.worldH * 0.52, 1180, def.worldH * 0.86);
  g.fillTriangle(900, def.worldH * 0.88, 1600, def.worldH * 0.46, 2300, def.worldH * 0.88);
  g.fillStyle(0x243444, 1);
  g.fillTriangle(1400, def.worldH * 0.9, 2100, def.worldH * 0.58, 2800, def.worldH * 0.9);
  if (quality !== "low") {
    g.fillStyle(0xe8f0ff, 0.12);
    g.fillCircle(def.worldW * 0.7, def.worldH * 0.12, 64);
    g.fillStyle(0xf0b84a, 0.08 + Math.sin(t / 500) * 0.03);
    g.fillRect(0, def.worldH * 0.22, def.worldW, 6);
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
