import Phaser from "phaser";
import {
  Juice,
  ParticlePool,
  pulseHaptic,
  Synth,
  publishGwDebug,
  countLongFrame,
  clearGwDebug,
  createGameKeyboard,
  seededRng,
  drawParticles,
  fillBackdrop,
  fillVignette,
  mixColor,
  type GameKeyboard,
} from "@gamesweb/game-core";
import { readRunContext, skyStackManifest, type PlatformSDK } from "@gamesweb/game-sdk";
import { placeSlab, slabScore, type Slab } from "../systems/stack";

const START_W = 210;
const SLAB_H = 28;
const RETRY_GRACE_MS = 450;

export class SkyStackScene extends Phaser.Scene {
  private platform!: PlatformSDK;
  private juice = new Juice();
  private parts!: ParticlePool;
  private synth!: Synth;
  private gfx!: Phaser.GameObjects.Graphics;
  private overlay!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;
  private nativeKeys: GameKeyboard | null = null;
  private rng = Math.random;
  private seed = "local";
  private stack: Slab[] = [];
  private moving: Slab = { x: 0, y: 0, w: START_W };
  private dir = 1;
  private speed = 210;
  private score = 0;
  private floors = 0;
  private combo = 0;
  private perfects = 0;
  private streak = 0;
  private maxStreak = 0;
  private fevers = 0;
  private fever = false;
  private ended = false;
  private placing = false;
  private camY = 0;
  private shake = 0;
  private hue = 198;
  private pbFloors = 0;
  private friendMark = 16;
  private rivalMark = 28;
  private retries = 0;
  private signaledReady = false;
  private longFrames = 0;
  private ticks = 0;
  private started = 0;
  private endedAt = 0;
  private pitch = 220;
  private scraps: Array<{ x: number; y: number; w: number; vx: number; vy: number; rot: number; vr: number; color: number }> = [];
  private clouds: Array<{ x: number; y: number; r: number; a: number; s: number }> = [];
  private ripples: Array<{ x: number; y: number; w: number; t: number; maxT: number; fever: boolean }> = [];
  private feverTrail: number[] = [];
  private markLabels: Phaser.GameObjects.Text[] = [];
  private halo = 0;
  private event: "none" | "wind" | "narrow" | "fast" | "mirror" = "none";
  private eventT = 0;
  private theme = 0;
  private paused = false;

  private get floor() {
    return this.floors;
  }

  constructor() {
    super("sky-stack-play");
  }

  create() {
    this.platform = this.game.registry.get("platform") as PlatformSDK;
    const ctx = readRunContext();
    this.seed = ctx.seed ?? ctx.challengeCode ?? `sky:${Date.now().toString(36)}`;
    this.rng = seededRng(this.seed);
    this.parts = new ParticlePool(140);
    this.synth = (this.game.registry.get("synth") as Synth | undefined) ?? new Synth();
    this.game.registry.set("synth", this.synth);
    this.synth.setSettings(this.platform.audio.getSettings());
    this.cameras.main.setBackgroundColor("#f2c8a8");
    this.gfx = this.add.graphics();
    this.overlay = this.add.graphics().setScrollFactor(0).setDepth(20);
    this.hud = this.add
      .text(18, 64, "", { fontFamily: "ui-sans-serif, system-ui", fontSize: "18px", color: "#2a3040" })
      .setScrollFactor(0)
      .setDepth(21);
    this.banner = this.add
      .text(this.scale.width / 2, this.scale.height * 0.42, "TAP TO PLACE", {
        fontFamily: "ui-sans-serif, system-ui",
        fontSize: "16px",
        color: "#5a6a80",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(21);
    this.markLabels = [0, 1, 2].map(() =>
      this.add
        .text(0, 0, "", {
          fontFamily: "ui-monospace, SFMono-Regular, monospace",
          fontSize: "11px",
          color: "#ffffff",
        })
        .setOrigin(1, 1)
        .setScrollFactor(0)
        .setDepth(19)
        .setAlpha(0),
    );
    this.nativeKeys?.destroy();
    this.nativeKeys = createGameKeyboard();
    this.game.canvas.tabIndex = 0;
    this.game.canvas.focus({ preventScroll: true });
    this.resetClimb();
    this.input.addPointer(2);
    this.input.on("pointerdown", () => this.tryPlace());
    this.game.events.on("platform-pause", () => (this.paused = true));
    this.game.events.on("platform-resume", () => (this.paused = false));
    this.platform.session.start();
    this.platform.events.emit({ name: "gameplay_started", props: { gameId: "sky-stack" } });
    this.started = this.time.now;
    try {
      this.pbFloors = Number(localStorage.getItem("gw:sky-pb") ?? 0);
    } catch {
      this.pbFloors = 0;
    }
    this.friendMark = Number(this.game.registry.get("friendMark") || 16);
    this.rivalMark = Number(this.game.registry.get("rivalMark") || 28);
  }

  private resetClimb() {
    const w = this.scale.width || 390;
    const h = this.scale.height || 844;
    const baseY = h * 0.72;
    this.stack = [{ x: (w - START_W) / 2, w: START_W, y: baseY }];
    this.moving = { x: 24, y: baseY - SLAB_H - 8, w: START_W };
    this.dir = 1;
    this.speed = 200 + this.rng() * 40;
    this.score = 0;
    this.floors = 0;
    this.combo = 0;
    this.perfects = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.fevers = 0;
    this.fever = false;
    this.ended = false;
    this.placing = false;
    this.camY = 0;
    this.hue = 198;
    this.pitch = 220;
    this.halo = 0;
    this.scraps = [];
    this.ripples = [];
    this.feverTrail = [];
    this.clouds = Array.from({ length: 8 }, () => ({
      x: this.rng() * (this.scale.width || 390),
      y: this.rng() * (this.scale.height || 844) * 0.7,
      r: 28 + this.rng() * 42,
      a: 0.08 + this.rng() * 0.1,
      s: 8 + this.rng() * 14,
    }));
    this.banner.setText("TAP").setAlpha(0.9);
    this.event = "none";
    this.eventT = 0;
    this.theme = Math.floor(this.rng() * 3);
  }

  private tryPlace() {
    this.ensureAudio();
    if (this.ended) {
      if (this.time.now - this.endedAt >= RETRY_GRACE_MS) this.retry();
      return;
    }
    if (this.placing) return;
    this.placing = true;
    const top = this.stack[this.stack.length - 1];
    const result = placeSlab(this.moving, top);
    this.banner.setAlpha(0);
    if (result.kind === "miss" || !result.next) {
      this.fail();
      return;
    }
    this.stack.push(result.next);
    this.floors += 1;
    if (this.floors === 1) void this.platform.achievement.unlock("first-place");
    if (result.leftover > 1.5) {
      const overlapR = Math.min(this.moving.x + this.moving.w, top.x + top.w);
      const leftScrap = this.moving.x < top.x;
      const impulse = 105 + Math.min(65, result.leftover * 0.85);
      this.scraps.push({
        x: leftScrap ? this.moving.x : overlapR,
        y: this.moving.y,
        w: Math.max(3, result.leftover),
        vx: leftScrap ? -impulse : impulse,
        vy: -32,
        rot: 0,
        vr: leftScrap ? -3.2 : 3.2,
        color: this.colorFor(this.stack.length),
      });
      this.juice.hitStop(Math.min(35, 10 + result.leftover * 0.35));
    }
    if (result.kind === "perfect") {
      this.streak += 1;
      if (this.streak > this.maxStreak) this.maxStreak = this.streak;
      this.perfects += 1;
      this.combo += 1;
      this.halo = 1;
      this.ripples.push({
        x: result.next.x,
        y: result.next.y,
        w: result.next.w,
        t: 0,
        maxT: 0.52,
        fever: this.fever || this.streak >= 8,
      });
      if (this.ripples.length > 8) this.ripples.shift();
      this.pitch = Math.min(880, this.pitch + 28);
      this.synth.tone(this.pitch, 0.07, "sine", 0.05, 0.18);
      this.synth.tone(this.pitch * 1.5, 0.09, "triangle", 0.03, 0.04);
      pulseHaptic(8);
      this.juice.flash(0.16);
      this.juice.cameraPunch(1.2);
      this.parts.burst(result.next.x + result.next.w / 2, result.next.y, 22, 0xffffff, 110, 280);
      if (this.streak >= 5) void this.platform.achievement.unlock("perfect-5");
      if (this.streak >= 8 && !this.fever) {
        this.fever = true;
        this.fevers += 1;
        void this.platform.achievement.unlock("fever");
        this.synth.levelUp();
      }
    } else {
      this.streak = 0;
      this.fever = false;
      this.combo = result.kind === "near" ? this.combo + 1 : Math.max(0, this.combo - 1);
      this.pitch = Math.max(220, this.pitch - 40);
      this.synth.tone(this.pitch, 0.05, "triangle", 0.03, 0.12);
      this.shake = result.kind === "near" ? 8 : 12;
      this.juice.screenShake(this.shake, 140);
    }
    this.score += slabScore(result.kind, this.combo, this.fever);
    if (this.floors >= 30) void this.platform.achievement.unlock("floor-30");
    if (this.floors >= 67) void this.platform.achievement.unlock("floor-67");
    this.speed = Math.min(420, 200 + this.floors * 4.2);
    if (this.floors > 4 && this.rng() < 0.12) {
      const roll = this.rng();
      this.event = roll < 0.3 ? "wind" : roll < 0.55 ? "narrow" : roll < 0.8 ? "fast" : "mirror";
      this.eventT = 1;
    } else this.event = "none";
    if (this.event === "fast") this.speed *= 1.28;
    const w = this.event === "narrow" ? result.next.w * 0.78 : result.next.w;
    this.dir = this.event === "mirror" ? -this.dir : this.rng() > 0.5 ? 1 : -1;
    this.moving = {
      x: this.dir > 0 ? 8 : this.scale.width - w - 8,
      y: result.next.y - SLAB_H - 6,
      w,
    };
    this.feverTrail = [];
    this.placing = false;
  }

  private fail() {
    this.ended = true;
    this.endedAt = this.time.now;
    this.synth.crash(0.55);
    pulseHaptic([12, 30, 12]);
    this.juice.screenShake(10, 160);
    const pb = this.floors > this.pbFloors;
    if (pb) {
      try {
        localStorage.setItem("gw:sky-pb", String(this.floors));
      } catch {
        /* noop */
      }
      this.synth.personalBest();
    }
    const hint = pb
      ? `New high ${this.floors}. Beat it.`
      : this.friendMark && this.floors < this.friendMark
        ? `Friend sits at ${this.friendMark}.`
        : `I reached ${this.floors}. Beat me.`;
    void this.platform.session.end({
      mode: readRunContext().daily ? "daily" : "climb",
      score: this.score,
      result: "finish",
      metadata: {
        floors: this.floor,
        perfects: this.perfects,
        maxStreak: this.maxStreak,
        fevers: this.fevers,
        combo: this.combo,
        fever: this.fever,
        seed: this.seed,
        attemptDurationMs: Math.round(this.time.now - this.started),
        retryHint: hint,
        pbDelta: this.floors - this.pbFloors,
      },
    });
  }

  private retry() {
    this.retries += 1;
    this.platform.events.emit({
      name: "game_retry",
      props: { gameId: "sky-stack", time_since_run_end_ms: this.ended ? Math.round(this.time.now - this.endedAt) : 0 },
    });
    this.scene.restart();
  }

  private ensureAudio() {
    void this.synth.resume();
  }

  update(_: number, delta: number) {
    const dt = Math.min(0.033, delta / 1000);
    this.ticks += 1;
    this.longFrames = countLongFrame(delta, this.longFrames);
    if (!this.signaledReady) {
      this.signaledReady = true;
      this.platform.events.emit({ name: "game_ready", props: { gameId: "sky-stack" } });
    }
    const native = this.nativeKeys?.read();
    if (native?.jumpPressed || native?.retryPressed) {
      if (this.ended || native.retryPressed) {
        // The platform result screen owns the first moments after a fall.
        if (!this.ended || this.time.now - this.endedAt >= RETRY_GRACE_MS) this.retry();
      } else this.tryPlace();
    }
    if (this.paused) {
      this.draw(dt);
      this.publishDebug();
      return;
    }
    if (!this.ended) {
      if (this.fever) {
        this.feverTrail.push(this.moving.x);
        if (this.feverTrail.length > 4) this.feverTrail.shift();
      } else if (this.feverTrail.length > 0) {
        this.feverTrail.length = 0;
      }
      const wind = this.event === "wind" ? Math.sin(this.time.now / 180) * 40 : 0;
      this.moving.x += (this.dir * this.speed + wind) * dt * (this.fever ? 1.18 : 1);
      if (this.moving.x <= 6) {
        this.moving.x = 6;
        this.dir = 1;
      }
      if (this.moving.x + this.moving.w >= this.scale.width - 6) {
        this.moving.x = this.scale.width - 6 - this.moving.w;
        this.dir = -1;
      }
    }
    const targetCam = Math.max(0, (this.stack[0].y - (this.stack[this.stack.length - 1]?.y ?? 0)) - this.scale.height * 0.18);
    this.camY += (targetCam - this.camY) * (1 - Math.exp(-dt * 3.2));
    this.shake = Math.max(0, this.shake - dt * 28);
    this.halo = Math.max(0, this.halo - dt * 1.6);
    for (const c of this.clouds) {
      c.x += c.s * dt;
      if (c.x - c.r > this.scale.width) c.x = -c.r;
    }
    for (const s of this.scraps) {
      s.vy += 980 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rot += s.vr * dt;
    }
    this.scraps = this.scraps.filter((s) => s.y < this.scale.height + 80);
    for (const r of this.ripples) r.t += dt;
    this.ripples = this.ripples.filter((r) => r.t < r.maxT);
    this.parts.update(dt);
    this.draw(dt);
    this.publishDebug();
  }

  private drawIsometricSlab(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    baseCol: number,
    alpha = 1,
    castShadow = false,
  ) {
    const bevelTopH = 6;
    const bevelSideW = 8;
    const topRimCol = mixColor(baseCol, 0xffffff, 0.42);
    const frontFaceCol = baseCol;
    const rightShadeCol = mixColor(baseCol, 0x161a2c, 0.36);

    if (castShadow) {
      g.fillStyle(0x0c1020, 0.16 * alpha);
      g.fillRoundedRect(x + 4, y + h - 1, w, 6, 3);
    }
    // 1. Bright top rim highlight (2.5D bevel crown)
    g.fillStyle(topRimCol, alpha);
    g.fillRoundedRect(x, y - bevelTopH * 0.55, w, bevelTopH + 4, 5);
    // 2. Rich lit front face
    g.fillStyle(frontFaceCol, alpha);
    g.fillRoundedRect(x, y, w, h, 6);
    // 3. Deeper shaded right & bottom edge bevel
    if (w > bevelSideW * 2) {
      g.fillStyle(rightShadeCol, 0.85 * alpha);
      g.fillRoundedRect(x + w - bevelSideW, y + 1, bevelSideW, h - 1, 4);
    }
    g.fillStyle(rightShadeCol, 0.65 * alpha);
    g.fillRect(x + 4, y + h - 4, Math.max(4, w - 8), 4);
    // Crisp specular edge line along top-left
    g.lineStyle(1.2, 0xffffff, 0.45 * alpha);
    g.lineBetween(x + 5, y + 1.5, x + Math.max(8, w - bevelSideW - 4), y + 1.5);
  }

  private colorFor(i: number) {
    const mats = [0xe8c8b0, 0xd0c8bc, 0xc8d4dc, 0xf0d8a8, 0xe0d0e8];
    const band = this.floors < 10 ? 0 : this.floors < 25 ? 1 : this.floors < 40 ? 2 : this.floors < 60 ? 3 : 4;
    const base = mats[(band + this.theme) % mats.length];
    const h = (this.hue + i * 7) % 360;
    const s = this.fever ? 70 : 38;
    const l = 58 + (i % 3) * 4;
    const tint = Phaser.Display.Color.HSLToColor(h / 360, s / 100, l / 100).color;
    return mixColor(base, tint, 0.45);
  }

  private draw(dt: number) {
    const g = this.gfx;
    g.clear();
    const w = this.scale.width;
    const h = this.scale.height;
    const alt = this.floor;
    // Altitude Sky Biome Progression:
    // 0-10: Dusk Skyline | 11-25: Cloud Deck | 26-45: Aurora Stratosphere | 46+: Orbital Starfield
    const t1 = Math.max(0, Math.min(1, alt / 12));
    const t2 = Math.max(0, Math.min(1, (alt - 11) / 15));
    const t3 = Math.max(0, Math.min(1, (alt - 26) / 20));
    const skyTop =
      alt <= 11
        ? mixColor(0xf4be9c, 0xc4b0e4, t1)
        : alt <= 26
          ? mixColor(0xc4b0e4, 0x283566, t2)
          : mixColor(0x283566, 0x070b1a, t3);
    const mid =
      alt <= 11
        ? mixColor(0xf2d2b6, 0xd6c2e8, t1)
        : alt <= 26
          ? mixColor(0xd6c2e8, 0x3b4e84, t2)
          : mixColor(0x3b4e84, 0x101832, t3);
    const bottom =
      alt <= 11
        ? mixColor(0xe6ccb4, 0xdccad8, t1)
        : alt <= 26
          ? mixColor(0xdccad8, 0x5c6ea2, t2)
          : mixColor(0x5c6ea2, 0x1c284c, t3);
    fillBackdrop(
      g,
      w,
      h,
      {
        top: skyTop,
        mid,
        bottom,
        grain: 0.04,
        blobs: [
          { color: alt <= 15 ? 0xffc38a : alt <= 35 ? 0x62f2c8 : 0x6888ff, x: 0.16, y: 0.16, r: 64, alpha: 0.15, parallax: 0.04 },
          { color: alt <= 15 ? 0xffe0b0 : alt <= 35 ? 0xb478ff : 0x38e8ff, x: 0.78, y: 0.12, r: 74, alpha: 0.12, parallax: 0.05 },
        ],
      },
      { y: this.camY },
    );

    // Biome 4 (Floors 46+ & fade-in from 28+): Orbital Starfield & cosmic dust
    if (alt >= 24) {
      const starAlpha = Math.min(1, (alt - 24) / 22);
      for (let s = 0; s < 28; s += 1) {
        const sx = ((s * 97 + 31) % Math.max(1, Math.floor(w - 16))) + 8;
        const sy = ((s * 67 + Math.floor(this.camY * 0.05)) % Math.max(1, Math.floor(h * 0.75))) + 12;
        const twinkle = 0.45 + 0.55 * Math.sin(this.time.now / 260 + s * 1.7);
        g.fillStyle(s % 3 === 0 ? 0x8ef6ff : 0xffffff, starAlpha * twinkle * 0.85);
        g.fillCircle(sx, sy, s % 4 === 0 ? 2.1 : 1.3);
      }
    }

    // Biome 3 (Floors 26-45): Aurora Stratosphere shimmering ribbon waves
    if (alt >= 20 && alt <= 56) {
      const auroraAlpha = alt < 26 ? (alt - 20) / 6 : alt <= 45 ? 1 : Math.max(0, 1 - (alt - 45) / 11);
      const nowS = this.time.now / 1000;
      for (let band = 0; band < 2; band += 1) {
        const bandCol = band === 0 ? 0x48f5c8 : 0xb46cff;
        const baseY = h * (0.18 + band * 0.11);
        g.lineStyle(10, bandCol, 0.14 * auroraAlpha);
        for (let seg = 0; seg < 12; seg += 1) {
          const x0 = (seg / 12) * w;
          const x1 = ((seg + 1) / 12) * w;
          const y0 = baseY + Math.sin(nowS * 1.4 + seg * 0.55 + band) * 16;
          const y1 = baseY + Math.sin(nowS * 1.4 + (seg + 1) * 0.55 + band) * 16;
          g.lineBetween(x0, y0, x1, y1);
        }
      }
    }

    // Biome 1 (Floors 0-10): Dusk Skyline with distant city silhouettes
    const horizon = h * (0.68 + Math.min(0.14, alt * 0.003)) + this.camY * 0.04;
    if (horizon < h + 60) {
      g.fillStyle(mixColor(bottom, alt < 14 ? 0xc4b090 : 0x706898, 0.4), 1);
      g.fillRect(0, horizon, w, h - horizon + 8);
      g.fillStyle(mixColor(bottom, 0x8a7488, 0.32), 1);
      g.fillTriangle(-40, h, w * 0.28, horizon - 18, w * 0.55, h);
      g.fillTriangle(w * 0.4, h, w * 0.72, horizon - 28, w + 40, h);
      // Distant Dusk City Skyline silhouettes (visible on Floors 0-14)
      const cityAlpha = Math.max(0, 1 - alt / 16) * 0.48;
      if (cityAlpha > 0.02) {
        g.fillStyle(0x362a42, cityAlpha);
        for (let b = 0; b < 11; b += 1) {
          const bw = w / 11 + 2;
          const bx = b * (w / 11);
          const bh = 18 + ((b * 19 + 7) % 38);
          g.fillRect(bx, horizon - bh, bw - 3, bh + 4);
        }
      }
      g.fillStyle(mixColor(skyTop, 0xffffff, 0.2), 0.35);
      g.fillRect(0, horizon - 4, w, 6);
    }

    // Biome 2 (Floors 11-25): Cloud Deck with drifting mist bands
    for (const c of this.clouds) {
      if (alt > 34) continue;
      const cloudAlpha = c.a * (alt >= 11 && alt <= 25 ? 1.55 : alt < 11 ? 1.05 : 0.45);
      const cy = c.y + this.camY * 0.12;
      g.fillStyle(0xffffff, cloudAlpha);
      g.fillCircle(c.x, cy, c.r);
      g.fillCircle(c.x + c.r * 0.55, cy + 8, c.r * 0.7);
      if (alt >= 10 && alt <= 28) {
        g.fillStyle(0xf4f8ff, cloudAlpha * 0.55);
        g.fillRoundedRect(c.x - c.r * 1.2, cy + c.r * 0.25, c.r * 2.8, 10, 5);
      }
    }

    // Wind modifier streaks across the playfield when wind is active
    if (this.event === "wind" && !this.ended) {
      const windForce = Math.sin(this.time.now / 180);
      const windDir = windForce >= 0 ? 1 : -1;
      const windMag = 0.35 + 0.65 * Math.abs(windForce);
      for (let ws = 0; ws < 9; ws += 1) {
        const wy = ((ws * 89 + Math.floor(this.time.now * 0.06)) % Math.max(1, Math.floor(h * 0.78))) + 48;
        const wxBase = ((ws * 137 + Math.floor(this.time.now * 0.38 * windDir)) % (w + 120) + (w + 120)) % (w + 120) - 60;
        const len = 36 + (ws % 3) * 18;
        g.lineStyle(1.8, 0xd8f6ff, 0.24 * windMag);
        g.lineBetween(wxBase, wy, wxBase + len * windDir, wy - 2);
      }
    }

    const ox = this.shake * (Math.random() - 0.5);
    for (let i = 0; i < this.stack.length; i += 1) {
      const s = this.stack[i];
      const y = s.y + this.camY + ox;
      if (y > h + 60 || y < -60) continue;
      this.drawIsometricSlab(g, s.x, y, s.w, SLAB_H - 4, this.colorFor(i), 1, i > 0);
    }

    // Perfect Drop Harmonic Dual-Ring Shockwaves (golden & cyan expanding rings)
    const top = this.stack[this.stack.length - 1];
    for (const r of this.ripples) {
      const p = r.t / r.maxT;
      const ease = 1 - Math.pow(1 - p, 2);
      const alpha = (1 - p) * 0.9;
      const ry = r.y + this.camY + ox;
      const padOuter = 6 + ease * 36;
      const padInner = 2 + ease * 18;
      g.lineStyle(3, 0xffdf6b, alpha);
      g.strokeRoundedRect(r.x - padOuter, ry - padOuter * 0.45, r.w + padOuter * 2, SLAB_H - 4 + padOuter * 0.9, 12);
      g.lineStyle(2, 0x48f2ff, alpha * 0.85);
      g.strokeRoundedRect(r.x - padInner, ry - padInner * 0.45, r.w + padInner * 2, SLAB_H - 4 + padInner * 0.9, 9);
    }
    if (this.halo > 0.02 && top) {
      g.lineStyle(3, 0xffffff, this.halo * 0.85);
      g.strokeRoundedRect(top.x - 6, top.y + this.camY + ox - 6, top.w + 12, SLAB_H + 4, 10);
      g.fillStyle(0xffffff, this.halo * 0.08);
      g.fillRoundedRect(top.x - 4, top.y + this.camY + ox - 4, top.w + 8, SLAB_H, 8);
    }

    // FEVER luminous crown at the summit of the tower
    if (this.fever && top) {
      const crownY = top.y + this.camY + ox;
      const crownPulse = 0.55 + 0.25 * Math.sin(this.time.now / 110);
      g.lineStyle(2.4, 0xffdf6b, crownPulse);
      g.strokeRoundedRect(top.x - 5, crownY - 5, top.w + 10, SLAB_H + 2, 9);
      g.lineStyle(1.4, 0x48f2ff, crownPulse * 0.85);
      g.strokeRoundedRect(top.x - 2, crownY - 3, top.w + 4, SLAB_H - 2, 7);
      for (let c = 0; c < 3; c += 1) {
        const cx = top.x + top.w * (0.22 + c * 0.28);
        const crestH = c === 1 ? 9 : 6;
        g.fillStyle(c === 1 ? 0xffdf6b : 0x48f2ff, crownPulse * 0.78);
        g.fillTriangle(cx - 5, crownY - 3, cx, crownY - 3 - crestH, cx + 5, crownY - 3);
      }
    }

    // Monument Valley-style Architectural Ghost Blueprint between top slab and moving slab
    if (!this.ended && top) {
      const topY = top.y + this.camY + ox;
      const movY = this.moving.y + this.camY;
      const leftX = top.x;
      const rightX = top.x + top.w;
      g.lineStyle(1.2, 0x48f2ff, 0.24);
      for (let dy = movY; dy < topY; dy += 6) {
        const yEnd = Math.min(topY, dy + 3.5);
        g.lineBetween(leftX, dy, leftX, yEnd);
        g.lineBetween(rightX, dy, rightX, yEnd);
      }
      g.fillStyle(0x48f2ff, 0.06);
      g.fillRoundedRect(leftX, movY, top.w, SLAB_H - 4, 6);
      g.lineStyle(1, 0x48f2ff, 0.24);
      g.strokeRoundedRect(leftX, movY, top.w, SLAB_H - 4, 6);
      const ovL = Math.max(leftX, this.moving.x);
      const ovR = Math.min(rightX, this.moving.x + this.moving.w);
      if (ovR > ovL) {
        g.fillStyle(0x48f2ff, 0.11);
        g.fillRoundedRect(ovL, movY + 2, ovR - ovL, SLAB_H - 8, 4);
      }
    }

    for (const s of this.scraps) {
      g.save();
      g.translateCanvas(s.x + s.w / 2, s.y + this.camY + SLAB_H / 2);
      g.rotateCanvas(s.rot);
      this.drawIsometricSlab(g, -s.w / 2, -(SLAB_H - 4) / 2, s.w, SLAB_H - 4, s.color, 0.9, false);
      g.restore();
    }
    if (!this.ended) {
      if (this.fever && this.feverTrail.length > 0) {
        const movY = this.moving.y + this.camY;
        for (let i = 0; i < this.feverTrail.length; i += 1) {
          const tx = this.feverTrail[i] - this.dir * (this.feverTrail.length - i) * 3.5;
          const tRatio = (i + 1) / (this.feverTrail.length + 1);
          const ghostCol = i % 2 === 0 ? 0xffdf6b : 0x48f2ff;
          g.fillStyle(ghostCol, 0.1 + tRatio * 0.16);
          g.fillRoundedRect(tx, movY, this.moving.w, SLAB_H - 4, 6);
          g.lineStyle(1.2, ghostCol, 0.18 + tRatio * 0.22);
          g.strokeRoundedRect(tx, movY, this.moving.w, SLAB_H - 4, 6);
        }
      }
      this.drawIsometricSlab(
        g,
        this.moving.x,
        this.moving.y + this.camY,
        this.moving.w,
        SLAB_H - 4,
        this.fever ? 0xffe680 : 0xeaf6ff,
        0.96,
        true,
      );
    }
    drawParticles(g, this.parts, 0, this.camY);
    fillVignette(g, w, h, 0.08 + Math.min(0.08, alt / 120));

    // Competitive Height Benchmark Lines (PACE · 16F, RIVAL · 28F, PB)
    const mark = (idx: number, floors: number, color: number, hexColor: string, label: string) => {
      const lbl = this.markLabels[idx];
      if (!floors) {
        lbl?.setAlpha(0);
        return;
      }
      const y = this.stack[0].y - floors * (SLAB_H + 6) + this.camY;
      if (y < 24 || y > h - 16) {
        lbl?.setAlpha(0);
        return;
      }
      g.lineStyle(1.8, color, 0.78);
      g.lineBetween(12, y, w - 12, y);
      g.fillStyle(0x141a29, 0.76);
      const badgeW = label.length * 6.8 + 14;
      g.fillRoundedRect(w - 14 - badgeW, y - 18, badgeW, 16, 4);
      if (lbl) {
        lbl.setText(label).setColor(hexColor).setPosition(w - 18, y - 3).setAlpha(0.95);
      }
    };
    mark(0, this.pbFloors, 0x9fd6ff, "#9fd6ff", `PB · ${this.pbFloors}F`);
    mark(1, this.friendMark, 0x8dffc1, "#8dffc1", `PACE · ${this.friendMark}F`);
    mark(2, this.rivalMark, 0xff8aa0, "#ff8aa0", `RIVAL · ${this.rivalMark}F`);
    this.hud.setText(
      `HEIGHT  ${this.floors}   ${this.score.toLocaleString()}${this.fever ? "  FEVER" : this.streak ? `  ${this.streak}x` : ""}${this.event === "wind" ? "  · WIND" : ""}`,
    );
    this.overlay.clear();
    const fa = this.juice.flashAlpha(dt);
    if (fa) {
      this.overlay.fillStyle(0xffffff, fa);
      this.overlay.fillRect(0, 0, w, h);
    }
    void dt;
  }

  private publishDebug() {
    publishGwDebug(
      {
        gameId: "sky-stack",
        ready: this.signaledReady,
        runState: this.ended ? "ended" : "playing",
        playerX: this.moving.x,
        playerY: this.moving.y,
        score: this.score,
        paused: this.paused,
        fps: this.game.loop.actualFps,
        longFrames: this.longFrames,
        tick: this.ticks,
        frozen: false,
        level: this.floors,
      },
      {
        finishRun: () => {
          this.floors = Math.max(this.floors, 8);
          this.fail();
        },
        killPlayer: () => this.fail(),
        jump: () => {
          const top = this.stack[this.stack.length - 1];
          if (top) this.moving.x = top.x;
          this.tryPlace();
        },
        stackTo: (n: number) => {
          const target = Math.max(1, Math.min(48, Math.round(n)));
          while (this.floors < target && !this.ended) {
            const top = this.stack[this.stack.length - 1];
            if (top) this.moving.x = top.x;
            this.tryPlace();
          }
        },
        hideHud: () => {
          this.hud.setVisible(false);
          this.markLabels.forEach((l) => l.setVisible(false));
        },
      },
    );
  }

  shutdown() {
    this.nativeKeys?.destroy();
    this.nativeKeys = null;
    clearGwDebug();
  }
}

export function mountSkyStack(parent: HTMLElement, platform: PlatformSDK) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: Math.max(320, parent.clientWidth || 390),
    height: Math.max(240, parent.clientHeight || 844),
    backgroundColor: "#f2c8a8",
    scale: { mode: Phaser.Scale.RESIZE },
    scene: [SkyStackScene],
    disableContextMenu: true,
    banner: false,
    autoFocus: true,
    input: { keyboard: { target: typeof window !== "undefined" ? window : undefined }, activePointers: 3 },
    fps: { target: 60 },
    render: { preserveDrawingBuffer: true },
  });
  game.registry.set("platform", platform);
  game.registry.set("manifest", skyStackManifest);
  (game as Phaser.Game & { restartRun: () => void }).restartRun = () => {
    game.scene.getScene("sky-stack-play")?.scene.restart();
  };
  game.events.once("destroy", () => {
    const synth = game.registry.get("synth") as Synth | undefined;
    synth?.dispose();
    clearGwDebug();
  });
  return game;
}
