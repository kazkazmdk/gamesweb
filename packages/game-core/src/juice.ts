export type JuiceCamera = {
  x: number;
  y: number;
  setScroll: (x: number, y: number) => void;
  shake?: (duration: number, intensity: number) => void;
};

export type JuiceWorld = {
  timeScale: number;
};

export class Juice {
  private freezeUntil = 0;
  private shakeT = 0;
  private shakeMag = 0;
  private punch = 0;
  private flashA = 0;
  private rumble = 0;
  private slowUntil = 0;
  private now = 0;

  screenShake(intensity: number, durationMs: number) {
    this.shakeMag = Math.max(this.shakeMag, intensity);
    this.shakeT = Math.max(this.shakeT, this.now + durationMs);
  }

  hitStop(durationMs: number) {
    this.freezeUntil = Math.max(this.freezeUntil, this.now + durationMs);
  }

  cameraPunch(amount = 1) {
    this.punch = Math.max(this.punch, amount);
  }

  flash(alpha = 0.35) {
    this.flashA = Math.max(this.flashA, alpha);
  }

  rumbleSimulation(amount = 1) {
    this.rumble = Math.min(1, this.rumble + amount);
  }

  slowMo(scale: number, durationMs: number) {
    this.slowUntil = this.now + durationMs;
    this.pendingScale = scale;
  }

  private pendingScale = 1;

  isFrozen(nowMs: number) {
    this.now = nowMs;
    return nowMs < this.freezeUntil;
  }

  timeScale(nowMs: number) {
    this.now = nowMs;
    if (nowMs < this.slowUntil) return this.pendingScale;
    return 1;
  }

  applyCamera(cam: { x: number; y: number }, nowMs: number): { x: number; y: number } {
    this.now = nowMs;
    let x = 0;
    let y = 0;
    if (nowMs < this.shakeT) {
      x += (Math.random() - 0.5) * 2 * this.shakeMag;
      y += (Math.random() - 0.5) * 2 * this.shakeMag;
    } else {
      this.shakeMag *= 0.85;
    }
    if (this.punch > 0.01) {
      y += this.punch * 4;
      this.punch *= 0.72;
    }
    this.rumble *= 0.86;
    x += (Math.random() - 0.5) * this.rumble * 3;
    return { x: cam.x + x, y: cam.y + y };
  }

  flashAlpha(dt: number) {
    const a = this.flashA;
    this.flashA = Math.max(0, this.flashA - dt * 2.4);
    return a;
  }
}

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: number;
  drag: number;
  active: boolean;
};

export class ParticlePool {
  items: Particle[] = [];
  constructor(private capacity: number) {
    for (let i = 0; i < capacity; i += 1) {
      this.items.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        max: 1,
        size: 2,
        color: 0xffffff,
        drag: 0.92,
        active: false,
      });
    }
  }

  burst(x: number, y: number, n: number, color: number, speed: number, life = 420) {
    let spawned = 0;
    for (const p of this.items) {
      if (p.active) continue;
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random());
      p.x = x;
      p.y = y;
      p.vx = Math.cos(a) * s;
      p.vy = Math.sin(a) * s;
      p.life = life * (0.6 + Math.random() * 0.6);
      p.max = p.life;
      p.size = 1.5 + Math.random() * 3;
      p.color = color;
      p.drag = 0.9 + Math.random() * 0.06;
      p.active = true;
      spawned += 1;
      if (spawned >= n) break;
    }
  }

  emit(partial: Partial<Particle> & { x: number; y: number }) {
    for (const p of this.items) {
      if (p.active) continue;
      p.x = partial.x;
      p.y = partial.y;
      p.vx = partial.vx ?? 0;
      p.vy = partial.vy ?? 0;
      p.life = partial.life ?? 400;
      p.max = p.life;
      p.size = partial.size ?? 2;
      p.color = partial.color ?? 0xffffff;
      p.drag = partial.drag ?? 0.92;
      p.active = true;
      return;
    }
  }

  update(dt: number) {
    for (const p of this.items) {
      if (!p.active) continue;
      p.life -= dt * 1000;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= p.drag;
      p.vy *= p.drag;
      if (p.life <= 0) p.active = false;
    }
  }
}

export function springScale(current: number, target: number, vel: { v: number }, dt: number, k = 180, d = 14) {
  const accel = (target - current) * k - vel.v * d;
  vel.v += accel * dt;
  return current + vel.v * dt;
}

export function audioPitchVariation(base: number, spread = 0.08) {
  return base * (1 - spread + Math.random() * spread * 2);
}

export type FloatingText = {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
  active: boolean;
};

export class FloatingTextPool {
  items: FloatingText[] = [];
  constructor(n = 24) {
    for (let i = 0; i < n; i += 1) {
      this.items.push({ x: 0, y: 0, text: "", life: 0, color: "#fff", active: false });
    }
  }
  spawn(x: number, y: number, text: string, color = "#fff") {
    for (const t of this.items) {
      if (t.active) continue;
      t.x = x;
      t.y = y;
      t.text = text;
      t.life = 700;
      t.color = color;
      t.active = true;
      return;
    }
  }
  update(dt: number) {
    for (const t of this.items) {
      if (!t.active) continue;
      t.life -= dt * 1000;
      t.y -= 28 * dt;
      if (t.life <= 0) t.active = false;
    }
  }
}
