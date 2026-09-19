import type Phaser from "phaser";
import { drawArcadeCar, drawContainer, drawCrane, drawLamp, drawSkyline, mixColor } from "@gamesweb/game-core";
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

  drawTrackside(g, def, samples, quality);

  // barriers + asphalt
  for (let i = 0; i < samples.length; i += 1) {
    const s = samples[i];
    const n = samples[(i + 1) % samples.length];
    const w = s.width * 0.5 + 18;
    g.fillStyle(theme.barrier, 1);
    fillStrip(g, s.x, s.y, s.nx, s.ny, n.x, n.y, n.nx, n.ny, w);
  }
  for (let i = 0; i < samples.length; i += 1) {
    const s = samples[i];
    const n = samples[(i + 1) % samples.length];
    const w = s.width * 0.5;
    g.fillStyle(s.boost ? mixColor(theme.asphalt, theme.accent, 0.35) : theme.asphalt, 1);
    fillStrip(g, s.x, s.y, s.nx, s.ny, n.x, n.y, n.nx, n.ny, w);
  }

  if (quality !== "low") {
    g.lineStyle(3, theme.mark, 0.55);
    for (let i = 0; i < samples.length; i += 1) {
      const s = samples[i];
      const n = samples[(i + 1) % samples.length];
      const edge = s.width * 0.48;
      g.lineBetween(s.x + s.nx * edge, s.y + s.ny * edge, n.x + n.nx * edge, n.y + n.ny * edge);
      g.lineBetween(s.x - s.nx * edge, s.y - s.ny * edge, n.x - n.nx * edge, n.y - n.ny * edge);
    }
    for (let i = 0; i < samples.length; i += 2) {
      const s = samples[i];
      const edge = s.width * 0.5 + 5;
      g.fillStyle(i % 4 === 0 ? theme.accent : 0xf3f1ec, 0.95);
      g.fillRect(s.x + s.nx * edge - 3, s.y + s.ny * edge - 5, 6, 10);
      g.fillRect(s.x - s.nx * edge - 3, s.y - s.ny * edge - 5, 6, 10);
    }
    g.lineStyle(2, theme.mark, 0.28);
    for (let i = 0; i < samples.length; i += 6) {
      const s = samples[i];
      const n = samples[(i + 2) % samples.length];
      g.lineBetween(s.x - s.tx * 4, s.y - s.ty * 4, n.x + n.tx * 6, n.y + n.ty * 6);
    }
    for (let i = 0; i < samples.length; i += 18) {
      const s = samples[i];
      g.fillStyle(0xffffff, 0.08);
      g.fillCircle(s.x + s.nx * 12, s.y + s.ny * 8, 16);
    }
    for (let i = 0; i < samples.length; i += 3) {
      const s = samples[i];
      g.fillStyle(0x1a1214, 0.32);
      g.fillCircle(s.x + s.nx * s.width * 0.22, s.y + s.ny * s.width * 0.22, 4);
      if (i % 9 === 0) {
        g.fillStyle(theme.accent, 0.4);
        g.fillCircle(s.x + s.nx * s.width * 0.46, s.y + s.ny * s.width * 0.46, 3);
      }
    }
  }

  g.lineStyle(4, theme.accent, 0.7);
  for (let i = 0; i < samples.length; i += 1) {
    if (samples[i].sector === samples[(i + 1) % samples.length].sector) continue;
    const s = samples[i];
    g.lineBetween(s.x + s.nx * s.width * 0.5, s.y + s.ny * s.width * 0.5, s.x - s.nx * s.width * 0.5, s.y - s.ny * s.width * 0.5);
  }

  // finish / start gate at sample 0
  const start = samples[0];
  if (start) {
    const gx = start.x;
    const gy = start.y;
    g.fillStyle(0xf3f1ec, 0.95);
    g.fillRect(gx + start.nx * start.width * 0.5 - 6, gy + start.ny * start.width * 0.5 - 48, 10, 56);
    g.fillRect(gx - start.nx * start.width * 0.5 - 6, gy - start.ny * start.width * 0.5 - 48, 10, 56);
    g.fillStyle(theme.accent, 0.9);
    g.fillRect(gx - start.nx * start.width * 0.52, gy - 42, start.width * 1.04, 12);
    for (let i = 0; i < 8; i += 1) {
      g.fillStyle(i % 2 ? 0x111113 : 0xf3f1ec, 1);
      g.fillRect(gx - start.width * 0.4 + i * (start.width * 0.1), gy - 42, start.width * 0.1, 12);
    }
  }

  if (quality !== "low") {
    for (let i = 0; i < samples.length; i += 4) {
      const s = samples[i];
      const n = samples[(i + 3) % samples.length];
      const turn = Math.abs(s.tx * n.ty - s.ty * n.tx);
      const side = s.width * 0.5 + 10;
      if (i % 6 === 0) {
        drawLamp(g, s.x + s.nx * (side + 8), s.y + s.ny * (side + 8), 28, theme.pole);
        drawLamp(g, s.x - s.nx * (side + 8), s.y - s.ny * (side + 8), 28, theme.pole);
      }
      g.fillStyle(theme.barrier, 0.95);
      g.fillRect(s.x + s.nx * (side + 2) - 3, s.y + s.ny * (side + 2) - 8, 6, 16);
      g.fillRect(s.x - s.nx * (side + 2) - 3, s.y - s.ny * (side + 2) - 8, 6, 16);
      if (turn > 0.1) {
        g.fillStyle(theme.accent, 0.85);
        const hx = s.x + s.nx * (s.width * 0.32);
        const hy = s.y + s.ny * (s.width * 0.32);
        g.fillTriangle(hx, hy, hx + s.tx * 18, hy + s.ty * 18, hx + s.nx * 9, hy + s.ny * 9);
        const hx2 = s.x - s.nx * (s.width * 0.32);
        const hy2 = s.y - s.ny * (s.width * 0.32);
        g.fillTriangle(hx2, hy2, hx2 + s.tx * 18, hy2 + s.ty * 18, hx2 - s.nx * 9, hy2 - s.ny * 9);
      }
      if (i % 28 === 0) {
        const sx = s.x + s.nx * (side + 22);
        const sy = s.y + s.ny * (side + 22);
        g.fillStyle(0x1a1618, 1);
        g.fillRect(sx - 3, sy - 26, 6, 26);
        g.fillStyle(0xf3f1ec, 0.92);
        g.fillRect(sx - 10, sy - 40, 20, 16);
        g.fillStyle(theme.accent, 0.9);
        g.fillTriangle(sx, sy - 37, sx + 6, sy - 28, sx - 6, sy - 28);
      }
      if (i === 56 || i === 140) {
        const ox = s.x;
        const oy = s.y;
        g.fillStyle(0x16141a, 0.95);
        g.fillRect(ox - s.width * 0.7, oy - 18, s.width * 1.4, 14);
        g.fillStyle(theme.barrier, 1);
        g.fillRect(ox - s.width * 0.72, oy - 46, 10, 46);
        g.fillRect(ox + s.width * 0.62, oy - 46, 10, 46);
      }
      const px = s.x - s.nx * (side + 18);
      const py = s.y - s.ny * (side + 18);
      if (def.id === "foundation") {
        if (i % 20 === 0) drawContainer(g, px - 18, py - 16, 36, 22, i % 40 === 0 ? 0xc45c3a : 0x3a6a88);
        if (i === 40) drawCrane(g, px, py + 20, 90, 0x3a2430);
        if (i === 90) drawCrane(g, px, py + 16, 70, 0x2a1c28);
      } else if (def.id === "technical") {
        if (i % 24 === 0) {
          g.fillStyle(0x1c2230, 1);
          g.fillRect(px - 12, py - 40, 28, 48);
          g.fillStyle(0xffb45a, 0.2);
          g.fillRect(px - 6, py - 28, 8, 8);
        }
        if (i % 32 === 0) {
          g.fillStyle(0xffb45a, 0.85);
          const hx = s.x + s.nx * (s.width * 0.5 + 8);
          const hy = s.y + s.ny * (s.width * 0.5 + 8);
          g.fillTriangle(hx, hy, hx + s.tx * 14, hy + s.ty * 14, hx + s.nx * 10, hy + s.ny * 10);
        }
        if (i === 70) {
          g.fillStyle(0x12141c, 1);
          g.fillRect(s.x - 40, s.y - 36, 80, 72);
        }
      } else {
        if (i % 18 === 0) {
          g.fillStyle(theme.barrier, 1);
          g.fillRect(px - 3, py - 10, 6, 20);
        }
        if (i === 30) {
          g.fillStyle(0x7ad4ff, 0.35);
          g.fillRect(px - 8, py - 70, 6, 80);
        }
        if (i === 110) {
          g.fillStyle(0x2a3444, 1);
          g.fillRect(px - 10, py - 90, 14, 90);
        }
      }
    }
  }
}

function drawTrackside(g: Phaser.GameObjects.Graphics, def: TrackDef, samples: TrackSample[], quality: string) {
  const theme = def.theme;
  const apron = def.id === "foundation" ? 0x0c1822 : def.id === "velocity" ? 0x10161e : 0x14161c;
  for (let i = 0; i < samples.length; i += 1) {
    const s = samples[i];
    const n = samples[(i + 1) % samples.length];
    g.fillStyle(apron, 1);
    fillStrip(g, s.x, s.y, s.nx, s.ny, n.x, n.y, n.nx, n.ny, s.width * 0.5 + 92);
  }
  if (quality === "low") return;
  for (let i = 0; i < samples.length; i += 6) {
    const s = samples[i];
    const dist = s.width * 0.5 + 78;
    const x = s.x + s.nx * dist;
    const y = s.y + s.ny * dist;
    const bw = 42 + (i % 3) * 18;
    const bh = 64 + (i % 5) * 28;
    g.fillStyle(theme.building, 0.96);
    g.fillRect(x - bw / 2, y - bh / 2, bw, bh);
    g.fillStyle(theme.accent, 0.16 + (i % 4 === 0 ? 0.12 : 0));
    g.fillRect(x - bw / 2 + 8, y - bh / 2 + 10, 8, 8);
    g.fillRect(x - bw / 2 + 8, y - bh / 2 + 26, 8, 8);
    if (i % 12 === 0) {
      g.fillStyle(theme.barrier, 1);
      g.fillRect(x + bw / 2 + 8, y - 18, 6, 50);
      g.fillStyle(theme.pole, 0.85);
      g.fillCircle(x + bw / 2 + 11, y - 22, 5);
    }
  }
}

function drawHarbourWorld(g: Phaser.GameObjects.Graphics, def: TrackDef, quality: string, t: number) {
  g.fillStyle(0x0a1624, 1);
  g.fillRect(0, def.worldH * 0.58, def.worldW, def.worldH * 0.42);
  if (quality !== "low") {
    g.fillStyle(0x1a3a4a, 0.35 + Math.sin(t / 700) * 0.06);
    for (let i = 0; i < 14; i += 1) g.fillRect(i * 280, def.worldH * 0.66 + Math.sin(t / 400 + i) * 6, 220, 8);
    g.fillStyle(0x7ad4ff, 0.05);
    g.fillRect(0, def.worldH * 0.6, def.worldW, 10);
  }
  drawSkyline(g, def.worldH * 0.56, def.worldW, 0x1a141c, 2, 0);
  drawSkyline(g, def.worldH * 0.6, def.worldW, 0x121018, 5, 40);
  if (quality === "high") {
    drawCrane(g, 420, def.worldH * 0.7, 220, 0x3a2430);
    drawCrane(g, 980, def.worldH * 0.72, 180, 0x2a1c28);
    drawCrane(g, 1680, def.worldH * 0.68, 160, 0x2a2430);
    drawContainer(g, 260, def.worldH * 0.7 - 40, 70, 40, 0xc45c3a);
    drawContainer(g, 340, def.worldH * 0.7 - 40, 70, 40, 0x3a6a88);
    drawContainer(g, 300, def.worldH * 0.7 - 80, 70, 40, 0xe35aa0);
    drawContainer(g, 2100, def.worldH * 0.66, 80, 44, 0x2a6a7a);
    drawContainer(g, 2190, def.worldH * 0.66, 80, 44, 0xc4783a);
    drawContainer(g, 2280, def.worldH * 0.66, 80, 44, 0x3a6a88);
  }
}

function drawDistrictWorld(g: Phaser.GameObjects.Graphics, def: TrackDef, quality: string, t: number) {
  g.fillStyle(0x0c0e16, 1);
  g.fillRect(0, 0, def.worldW, def.worldH);
  drawSkyline(g, def.worldH * 0.7, def.worldW, 0x12141c, 4, 0);
  drawSkyline(g, def.worldH * 0.74, def.worldW, 0x1a1c26, 7, 30);
  if (quality !== "low") {
    for (let i = 0; i < 14; i += 1) {
      const x = 120 + i * 240;
      const h = 110 + (i % 5) * 48;
      g.fillStyle(0x1c2230, 1);
      g.fillRect(x, def.worldH * 0.7 - h, 78, h);
      g.fillStyle(0xffb45a, 0.08 + (Math.sin(t / 240 + i) > 0.4 ? 0.1 : 0));
      g.fillRect(x + 10, def.worldH * 0.7 - h + 16, 12, 10);
      g.fillRect(x + 40, def.worldH * 0.7 - h + 28, 12, 10);
      g.fillRect(x + 22, def.worldH * 0.7 - h + 48, 12, 10);
    }
    g.fillStyle(0xff6b3b, 0.22);
    g.fillRect(640, 420, 90, 28);
    g.fillRect(1680, 980, 70, 22);
    g.fillStyle(0x10121a, 0.9);
    g.fillRect(900, def.worldH * 0.42, 420, 18);
  }
}

function drawRidgeWorld(g: Phaser.GameObjects.Graphics, def: TrackDef, quality: string, t: number) {
  g.fillStyle(0x10141c, 1);
  g.fillRect(0, 0, def.worldW, def.worldH);
  g.fillStyle(0x152030, 1);
  g.fillTriangle(80, def.worldH * 0.82, 640, def.worldH * 0.34, 1180, def.worldH * 0.82);
  g.fillStyle(0x1a2434, 1);
  g.fillTriangle(200, def.worldH * 0.78, 700, def.worldH * 0.42, 1180, def.worldH * 0.78);
  g.fillTriangle(900, def.worldH * 0.8, 1600, def.worldH * 0.36, 2300, def.worldH * 0.8);
  g.fillTriangle(1800, def.worldH * 0.84, 2500, def.worldH * 0.4, 3200, def.worldH * 0.84);
  drawSkyline(g, def.worldH * 0.74, def.worldW, 0x141820, 11, 0);
  if (quality !== "low") {
    g.fillStyle(0x7ad4ff, 0.12 + Math.sin(t / 500) * 0.04);
    g.fillRect(0, def.worldH * 0.3, def.worldW, 8);
    g.fillStyle(0xe8f4ff, 0.1);
    g.fillCircle(def.worldW * 0.72, def.worldH * 0.16, 90);
    g.fillStyle(0x0c1018, 0.55);
    for (let i = 0; i < 8; i += 1) g.fillRect(i * 420 + 80, def.worldH * 0.7, 14, 90);
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
    g.fillStyle(0x1a1a20, Math.min(0.55, m.life * 0.2 + m.slip * 0.22));
    g.fillCircle(m.x, m.y, 3.8 + m.slip * 1.8);
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
    overlay.fillStyle(0xffffff, 0.1);
    overlay.fillRect(24, 118, 132, 3);
    overlay.fillStyle(0xe35aa0, 0.9);
    overlay.fillRect(24, 118, 132 * drift, 3);
    if (meters.live > 8) {
      overlay.fillStyle(0x8dffc1, 0.85);
      overlay.fillRect(24, 124, Math.min(132, meters.live / 40), 2);
    }
  }
  if (!touch) return;
  overlay.fillStyle(0xffffff, 0.05);
  overlay.fillRect(18, h * 0.22, w * 0.28, h * 0.46);
  overlay.fillRect(w - 18 - w * 0.28, h * 0.22, w * 0.28, h * 0.46);
  overlay.fillStyle(0xe35aa0, 0.2);
  overlay.fillRect(w / 2 - 70, h - 88, 140, 58);
}

export function drawCountdown(overlay: Phaser.GameObjects.Graphics, w: number, h: number, remain: number) {
  if (remain <= 0) return;
  const step = remain > 3 ? 3 : remain > 2 ? 2 : remain > 1 ? 1 : 0;
  const label = step === 0 ? "GO" : String(step);
  overlay.fillStyle(0x000000, 0.28);
  overlay.fillRect(0, 0, w, h);
  overlay.fillStyle(step === 0 ? 0x8dffc1 : 0xf3f1ec, 0.95);
  const bw = step === 0 ? 160 : 90;
  overlay.fillRoundedRect(w / 2 - bw / 2, h / 2 - 46, bw, 92, 16);
}
