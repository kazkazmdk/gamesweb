import type { ParticlePool } from "./juice";

export type BackdropBand = {
  color: number;
  y: number;
  h: number;
  alpha: number;
  parallax?: number;
};

export type BackdropBlob = {
  color: number;
  x: number;
  y: number;
  r: number;
  alpha: number;
  parallax?: number;
};

export type BackdropSpec = {
  top: number;
  mid?: number;
  bottom: number;
  grain?: number;
  bands?: BackdropBand[];
  blobs?: BackdropBlob[];
};

export type GfxLike = {
  fillStyle: (color: number, alpha?: number) => void;
  fillRect: (x: number, y: number, w: number, h: number) => void;
  fillCircle: (x: number, y: number, r: number) => void;
};

export function mixColor(a: number, b: number, t: number) {
  const k = Math.max(0, Math.min(1, t));
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  return (
    (Math.round(ar + (br - ar) * k) << 16) |
    (Math.round(ag + (bg - ag) * k) << 8) |
    Math.round(ab + (bb - ab) * k)
  );
}

export function fillBackdrop(
  g: GfxLike,
  w: number,
  h: number,
  spec: BackdropSpec,
  scroll: { x?: number; y?: number } = {},
) {
  const sx = scroll.x ?? 0;
  const sy = scroll.y ?? 0;
  const steps = 14;
  const mid = spec.mid ?? mixColor(spec.top, spec.bottom, 0.45);
  for (let i = 0; i < steps; i += 1) {
    const t = i / (steps - 1);
    const color = t < 0.52 ? mixColor(spec.top, mid, t / 0.52) : mixColor(mid, spec.bottom, (t - 0.52) / 0.48);
    g.fillStyle(color, 1);
    g.fillRect(0, (h * i) / steps, w, h / steps + 1.5);
  }
  for (const blob of spec.blobs ?? []) {
    const p = blob.parallax ?? 0.08;
    g.fillStyle(blob.color, blob.alpha);
    g.fillCircle(blob.x * w - sx * p, blob.y * h - sy * p, blob.r);
  }
  for (const band of spec.bands ?? []) {
    const p = band.parallax ?? 0.18;
    g.fillStyle(band.color, band.alpha);
    g.fillRect(0, band.y * h - sy * p, w, band.h * h);
  }
  if (spec.grain && spec.grain > 0) {
    const n = Math.min(160, Math.floor((w * h) / 2200));
    g.fillStyle(0xffffff, spec.grain);
    for (let i = 0; i < n; i += 1) {
      const x = ((i * 127.1 + sx * 0.04) % 1) * w;
      const y = ((i * 311.7 + sy * 0.03) % 1) * h;
      g.fillRect(x, y, 1.2, 1.2);
    }
  }
}

export function fillVignette(g: GfxLike, w: number, h: number, alpha = 0.38) {
  g.fillStyle(0x000000, alpha * 0.85);
  g.fillRect(0, 0, w, Math.max(16, h * 0.06));
  g.fillRect(0, h - Math.max(22, h * 0.08), w, Math.max(22, h * 0.08));
  g.fillStyle(0x000000, alpha * 0.55);
  g.fillRect(0, 0, Math.max(12, w * 0.04), h);
  g.fillRect(w - Math.max(12, w * 0.04), 0, Math.max(12, w * 0.04), h);
}

export function drawParticles(g: GfxLike, pool: ParticlePool, ox = 0, oy = 0) {
  for (const p of pool.items) {
    if (!p.active) continue;
    g.fillStyle(p.color, Math.max(0, p.life / p.max));
    g.fillCircle(p.x + ox, p.y + oy, p.size);
  }
}
