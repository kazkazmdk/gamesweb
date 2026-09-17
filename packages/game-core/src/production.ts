export type QualityTier = "high" | "mid" | "low";

export type DrawGfx = {
  fillStyle: (color: number, alpha?: number) => void;
  fillRect: (x: number, y: number, w: number, h: number) => void;
  fillCircle: (x: number, y: number, r: number) => void;
  fillTriangle: (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => void;
  fillRoundedRect?: (x: number, y: number, w: number, h: number, r: number) => void;
  lineStyle?: (w: number, color: number, alpha?: number) => void;
  lineBetween?: (x1: number, y1: number, x2: number, y2: number) => void;
  save?: () => void;
  restore?: () => void;
  translateCanvas?: (x: number, y: number) => void;
  rotateCanvas?: (a: number) => void;
};

export function easeOutCubic(t: number) {
  const x = Math.max(0, Math.min(1, t));
  return 1 - (1 - x) ** 3;
}

export function easeOutBack(t: number) {
  const x = Math.max(0, Math.min(1, t));
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
}

export function easeInOutQuad(t: number) {
  const x = Math.max(0, Math.min(1, t));
  return x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
}

export function animPhase(ms: number, period: number) {
  return ((ms % period) + period) % period;
}

export function qualityFromFps(fps: number, touch: boolean, current: QualityTier): QualityTier {
  if (fps < 40) return "low";
  if (fps < 50) return "mid";
  if (fps > 56) return touch ? "mid" : "high";
  return current;
}

export function fillRound(g: DrawGfx, x: number, y: number, w: number, h: number, r: number) {
  if (g.fillRoundedRect) g.fillRoundedRect(x, y, w, h, r);
  else g.fillRect(x, y, w, h);
}

export function drawLamp(g: DrawGfx, x: number, y: number, h: number, glow: number, pole = 0x1a181c) {
  g.fillStyle(pole, 1);
  g.fillRect(x - 2, y - h, 4, h);
  g.fillStyle(glow, 0.95);
  g.fillCircle(x, y - h - 3, 5);
  g.fillStyle(glow, 0.12);
  g.fillCircle(x, y - h + 8, 18);
}

export function drawChevron(g: DrawGfx, x: number, y: number, dir: number, color: number, scale = 1) {
  const s = 10 * scale;
  const c = Math.cos(dir);
  const n = Math.sin(dir);
  g.fillStyle(color, 0.92);
  g.fillTriangle(x + c * s, y + n * s, x - n * s * 0.7, y + c * s * 0.7, x + n * s * 0.7, y - c * s * 0.7);
}

export function drawRunner(
  g: DrawGfx,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: {
    facing: number;
    grounded: boolean;
    vx: number;
    vy: number;
    t: number;
    color: number;
    dying?: boolean;
    lean?: number;
    squash?: number;
    stretch?: number;
  },
) {
  const squash = opts.squash ?? 1;
  const stretch = opts.stretch ?? 1;
  const bw = w * stretch;
  const bh = h * squash;
  const lean = opts.lean ?? opts.vx * 0.0008;
  const run = opts.grounded && Math.abs(opts.vx) > 18;
  const sprint = Math.abs(opts.vx) > 180;
  const swing = run ? Math.sin(opts.t / (sprint ? 48 : 70)) : 0;
  const air = !opts.grounded;
  g.save?.();
  g.translateCanvas?.(x + w / 2, y + h / 2);
  g.rotateCanvas?.(lean + (opts.dying ? opts.t * 0.02 : 0));
  const body = opts.dying ? 0xffffff : opts.color;
  g.fillStyle(0x000000, 0.28);
  g.fillCircle(2, bh / 2 + 2, bw * 0.38);
  g.fillStyle(body, 1);
  fillRound(g, -bw * 0.32, -bh * 0.18, bw * 0.64, bh * 0.52, 5);
  g.fillCircle(opts.facing * 2, -bh * 0.34, bw * 0.28);
  g.fillStyle(0x0b1220, 1);
  g.fillCircle(opts.facing * 6, -bh * 0.36, 2.2);
  g.fillStyle(body, 0.95);
  const arm = air ? -8 : swing * (sprint ? 10 : 7);
  fillRound(g, -bw * 0.46, -bh * 0.08, 5, 12 + Math.abs(arm) * 0.15, 2);
  fillRound(g, bw * 0.22, -bh * 0.08, 5, 12 + Math.abs(arm) * 0.15, 2);
  const leg = air ? (opts.vy > 0 ? 6 : -4) : swing * (sprint ? 9 : 6);
  fillRound(g, -6, bh * 0.22, 5, 11 + Math.max(0, leg), 2);
  fillRound(g, 1, bh * 0.22, 5, 11 + Math.max(0, -leg), 2);
  if (run) {
    g.fillStyle(0xffffff, 0.18);
    g.fillRect(-bw, bh * 0.4, 6, 2);
  }
  g.restore?.();
}

export function drawMiniPerson(g: DrawGfx, x: number, y: number, color: number, phase: number, scale = 1) {
  const s = 3.2 * scale;
  const bob = Math.sin(phase) * 1.4 * scale;
  g.fillStyle(0x000000, 0.22);
  g.fillCircle(x, y + 6 * scale, 2.2 * scale);
  g.fillStyle(color, 1);
  fillRound(g, x - s * 0.7, y - s + bob, s * 1.4, s * 1.8, 1.4);
  g.fillCircle(x, y - s * 1.15 + bob, s * 0.72);
  g.fillStyle(color, 0.9);
  g.fillRect(x - s * 0.85, y + s * 0.5 + bob, 2, 4 * scale);
  g.fillRect(x + s * 0.25, y + s * 0.5 + bob, 2, 4 * scale);
}

export function drawHoverBlade(
  g: DrawGfx,
  x: number,
  y: number,
  color: number,
  heading: number,
  danger = false,
  t = 0,
) {
  g.save?.();
  g.translateCanvas?.(x, y);
  g.rotateCanvas?.(heading);
  g.fillStyle(0x000000, 0.28);
  g.fillCircle(2, 6, 8);
  g.fillStyle(danger ? 0xffe08a : color, 1);
  g.fillTriangle(16, 0, -10, -8, -10, 8);
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(2, 0, 3.2);
  g.fillStyle(color, 0.35 + Math.sin(t / 90) * 0.12);
  g.fillCircle(0, 0, 14);
  g.restore?.();
}

export function drawArcadeCar(
  g: DrawGfx,
  x: number,
  y: number,
  angle: number,
  opts: {
    accent: number;
    drifting: boolean;
    steer: number;
    lean: number;
    brake: number;
    headlight: number;
    smash?: number;
    wheelSpin?: number;
  },
) {
  g.save?.();
  g.translateCanvas?.(x, y);
  g.fillStyle(0x000000, 0.38);
  g.fillCircle(7, 11, 13);
  g.rotateCanvas?.(angle + opts.lean * 0.08);
  const smash = opts.smash ?? 0;
  const squash = 1 - smash * 0.12;
  g.save?.();
  g.translateCanvas?.(0, 0);
  // wheels
  const spin = opts.wheelSpin ?? 0;
  const steer = opts.steer * 0.35;
  g.fillStyle(0x111113, 1);
  fillRound(g, -11, -13, 9, 5, 2);
  fillRound(g, -11, 8, 9, 5, 2);
  g.save?.();
  g.translateCanvas?.(7, -10.5);
  g.rotateCanvas?.(steer);
  fillRound(g, -4.5, -2.5, 9, 5, 2);
  g.fillStyle(0x3a3a40, 1);
  g.fillRect(-2, -1.4 + Math.sin(spin) * 0.6, 4, 1.2);
  g.restore?.();
  g.save?.();
  g.translateCanvas?.(7, 10.5);
  g.rotateCanvas?.(steer);
  g.fillStyle(0x111113, 1);
  fillRound(g, -4.5, -2.5, 9, 5, 2);
  g.restore?.();
  // body
  g.fillStyle(0x161318, 1);
  fillRound(g, -19 * squash, -11, 38 * squash, 22, 6);
  g.fillStyle(opts.drifting ? opts.accent : 0xf4f0ea, 1);
  fillRound(g, -17 * squash, -9.5, 34 * squash, 19, 5);
  g.fillStyle(mixRgb(opts.accent, 0x1a2430, 0.15), 1);
  fillRound(g, -6, -7.2, 16, 14.4, 3);
  g.fillStyle(0x1c2836, 0.92);
  fillRound(g, -2, -6, 13, 12, 3);
  g.fillStyle(0xffffff, 0.18);
  g.fillRect(-1, -5.2, 10, 3);
  // lights
  g.fillStyle(0xf7e7a2, opts.headlight);
  g.fillRect(14, -7.2, 5, 5);
  g.fillRect(14, 2.2, 5, 5);
  g.fillStyle(0xf7e7a2, opts.headlight * 0.18);
  g.fillCircle(22, 0, 16);
  const tail = opts.brake > 0.2 ? 0xff4466 : 0x4a2028;
  g.fillStyle(tail, 0.95);
  g.fillRect(-18, -6.2, 3.5, 4);
  g.fillRect(-18, 2.2, 3.5, 4);
  g.restore?.();
  g.restore?.();
}

function mixRgb(a: number, b: number, t: number) {
  const k = Math.max(0, Math.min(1, t));
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  return (Math.round(ar + (br - ar) * k) << 16) | (Math.round(ag + (bg - ag) * k) << 8) | Math.round(ab + (bb - ab) * k);
}

export function drawShinyBall(g: DrawGfx, x: number, y: number, r: number, color: number, rot: number) {
  g.fillStyle(0x000000, 0.28);
  g.fillCircle(x + 3, y + 5, r * 0.92);
  g.fillStyle(color, 1);
  g.fillCircle(x, y, r);
  g.fillStyle(0xffffff, 0.22);
  g.fillCircle(x - r * 0.28, y - r * 0.32, r * 0.38);
  g.fillStyle(0xffffff, 0.55);
  g.fillCircle(x - r * 0.32, y - r * 0.38, r * 0.16);
  g.save?.();
  g.translateCanvas?.(x, y);
  g.rotateCanvas?.(rot);
  g.fillStyle(0x000000, 0.12);
  g.fillRect(-r * 0.7, -1, r * 1.4, 2);
  g.restore?.();
}

export function drawGateArch(
  g: DrawGfx,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number,
  labelColor = 0xffffff,
) {
  g.fillStyle(color, 0.95);
  g.fillRect(x, y, 16, h);
  g.fillRect(x + w - 16, y, 16, h);
  fillRound(g, x, y, w, 22, 6);
  g.fillStyle(labelColor, 0.18);
  g.fillRect(x + 18, y + 4, w - 36, 14);
}

export function drawContainer(g: DrawGfx, x: number, y: number, w: number, h: number, color: number) {
  g.fillStyle(color, 1);
  fillRound(g, x, y, w, h, 2);
  g.fillStyle(0x000000, 0.18);
  for (let i = 8; i < w; i += 10) g.fillRect(x + i, y + 4, 2, h - 8);
  g.fillStyle(0xffffff, 0.12);
  g.fillRect(x + 3, y + 3, w - 6, 4);
}

export function drawCrane(g: DrawGfx, x: number, y: number, h: number, color: number) {
  g.fillStyle(color, 0.9);
  g.fillRect(x, y - h, 8, h);
  g.fillRect(x - 70, y - h, 110, 7);
  g.fillRect(x + 28, y - h + 7, 3, 36);
  g.fillRect(x + 20, y - h + 40, 18, 10);
}

export function drawSkyline(g: DrawGfx, y: number, w: number, color: number, seed = 1, parallax = 0) {
  g.fillStyle(color, 1);
  for (let i = 0; i < 18; i += 1) {
    const bx = ((i * 137 + seed * 17) % 40) * (w / 36) - parallax;
    const bh = 40 + ((i * 53 + seed) % 90);
    g.fillRect(bx, y - bh, 28 + (i % 3) * 10, bh);
  }
}
