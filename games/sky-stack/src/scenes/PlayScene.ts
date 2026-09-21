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
  private fever = false;
  private ended = false;
  private placing = false;
  private camY = 0;
  private shake = 0;
  private hue = 198;
  private pbFloors = 0;
  private friendMark = 0;
  private rivalMark = 0;
  private retries = 0;
  private signaledReady = false;
  private longFrames = 0;
  private ticks = 0;
  private started = 0;
  private endedAt = 0;
  private pitch = 220;
  private scraps: Array<{ x: number; y: number; w: number; vx: number; vy: number; rot: number; vr: number; color: number }> = [];
  private clouds: Array<{ x: number; y: number; r: number; a: number; s: number }> = [];
  private halo = 0;
  private event: "none" | "wind" | "narrow" | "fast" | "mirror" = "none";
  private eventT = 0;
  private theme = 0;

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
    this.nativeKeys?.destroy();
    this.nativeKeys = createGameKeyboard();
    this.game.canvas.tabIndex = 0;
    this.game.canvas.focus({ preventScroll: true });
    this.resetClimb();
    this.input.addPointer(2);
    this.input.on("pointerdown", () => this.tryPlace());
    this.game.events.on("platform-pause", () => undefined);
    this.platform.session.start();
    this.platform.events.emit({ name: "gameplay_started", props: { gameId: "sky-stack" } });
    this.started = this.time.now;
    try {
      this.pbFloors = Number(localStorage.getItem("gw:sky-pb") ?? 0);
    } catch {
      this.pbFloors = 0;
    }
    this.friendMark = Number(this.game.registry.get("friendMark") ?? 0);
    this.rivalMark = Number(this.game.registry.get("rivalMark") ?? 0);
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
    this.fever = false;
    this.ended = false;
    this.placing = false;
    this.camY = 0;
    this.hue = 198;
    this.pitch = 220;
    this.halo = 0;
    this.scraps = [];
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
    if (result.leftover > 6) {
      const overlapR = Math.min(this.moving.x + this.moving.w, top.x + top.w);
      const leftScrap = this.moving.x < top.x;
      this.scraps.push({
        x: leftScrap ? this.moving.x : overlapR,
        y: this.moving.y,
        w: result.leftover,
        vx: leftScrap ? -90 : 90,
        vy: 40,
        rot: 0,
        vr: leftScrap ? -2.4 : 2.4,
        color: this.colorFor(this.stack.length),
      });
    }
    if (result.kind === "perfect") {
      this.streak += 1;
      this.perfects += 1;
      this.combo += 1;
      this.halo = 1;
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
        floors: this.floors,
        perfects: this.perfects,
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
    if (!this.ended) {
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
    this.parts.update(dt);
    this.draw(dt);
    this.publishDebug();
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
    const alt = this.floors;
    const skyTop = alt < 6 ? 0xf4c4a8 : alt < 14 ? 0xf0c8b8 : alt < 24 ? 0xc8b8e0 : alt < 36 ? 0xa090d0 : 0x8a78c4;
    const mid = alt < 6 ? 0xf2d4bc : alt < 14 ? 0xe8c8c4 : alt < 24 ? 0xd4c0e0 : alt < 36 ? 0xb8a8d8 : 0x9c8ccc;
    const bottom = alt < 14 ? 0xe8d0b8 : alt < 28 ? 0xdcc8d4 : 0xc8b8d8;
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
          { color: alt < 14 ? 0xffc38a : 0xc8b0e8, x: 0.16, y: 0.16, r: 56, alpha: alt < 14 ? 0.18 : 0.1, parallax: 0.04 },
          { color: alt < 14 ? 0xffe0b0 : 0xb0a0d8, x: 0.78, y: 0.1, r: 70, alpha: 0.1, parallax: 0.05 },
        ],
      },
      { y: this.camY },
    );
    const horizon = h * (0.68 + Math.min(0.08, alt * 0.002)) + this.camY * 0.03;
    g.fillStyle(mixColor(bottom, alt < 14 ? 0xc4b090 : 0xa890c0, 0.4), 1);
    g.fillRect(0, horizon, w, h - horizon + 8);
    g.fillStyle(mixColor(bottom, 0xc4b090, 0.28), 1);
    g.fillTriangle(-40, h, w * 0.28, horizon - 18, w * 0.55, h);
    g.fillTriangle(w * 0.4, h, w * 0.72, horizon - 28, w + 40, h);
    g.fillStyle(mixColor(skyTop, 0xffffff, 0.2), 0.35);
    g.fillRect(0, horizon - 4, w, 6);
    for (const c of this.clouds) {
      if (alt > 30) continue;
      g.fillStyle(0xffffff, c.a * (alt < 16 ? 1.1 : 0.55));
      g.fillCircle(c.x, c.y + this.camY * 0.12, c.r);
      g.fillCircle(c.x + c.r * 0.55, c.y + 8 + this.camY * 0.12, c.r * 0.7);
    }
    const ox = this.shake * (Math.random() - 0.5);
    for (let i = 0; i < this.stack.length; i += 1) {
      const s = this.stack[i];
      const y = s.y + this.camY + ox;
      g.fillStyle(this.colorFor(i), 1);
      g.fillRoundedRect(s.x, y, s.w, SLAB_H - 4, 7);
      g.fillStyle(0xffffff, 0.28);
      g.fillRoundedRect(s.x + 5, y + 3, Math.max(8, s.w - 18), 6, 3);
      g.fillStyle(0x000000, 0.06);
      g.fillRect(s.x + 6, y + SLAB_H - 10, s.w - 12, 3);
    }
    const top = this.stack[this.stack.length - 1];
    if (this.halo > 0.02 && top) {
      g.lineStyle(4, 0xffffff, this.halo * 0.95);
      g.strokeRoundedRect(top.x - 8, top.y + this.camY + ox - 8, top.w + 16, SLAB_H + 8, 10);
      g.fillStyle(0xffffff, this.halo * 0.08);
      g.fillRoundedRect(top.x - 4, top.y + this.camY + ox - 4, top.w + 8, SLAB_H, 8);
    }
    for (const s of this.scraps) {
      g.save();
      g.translateCanvas(s.x + s.w / 2, s.y + this.camY + SLAB_H / 2);
      g.rotateCanvas(s.rot);
      g.fillStyle(s.color, 0.9);
      g.fillRoundedRect(-s.w / 2, -(SLAB_H - 4) / 2, s.w, SLAB_H - 4, 5);
      g.restore();
    }
    if (!this.ended) {
      g.fillStyle(0xeaf6ff, 0.95);
      g.fillRoundedRect(this.moving.x, this.moving.y + this.camY, this.moving.w, SLAB_H - 4, 6);
    }
    drawParticles(g, this.parts, 0, this.camY);
    fillVignette(g, w, h, 0.08 + Math.min(0.08, alt / 120));
    const mark = (floors: number, color: number, label: string) => {
      if (!floors) return;
      const y = this.stack[0].y - floors * (SLAB_H + 6) + this.camY;
      g.lineStyle(2, color, 0.7);
      g.lineBetween(12, y, w - 12, y);
      this.hud;
      void label;
    };
    mark(this.pbFloors, 0x9fd6ff, "PB");
    mark(this.friendMark, 0x8dffc1, "FRIEND");
    mark(this.rivalMark, 0xff8aa0, "RIVAL");
    this.hud.setText(
      `HEIGHT  ${this.floors}   ${this.score.toLocaleString()}${this.fever ? "  STREAK" : this.streak ? `  ${this.streak}x` : ""}`,
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
        paused: false,
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
        hideHud: () => this.hud.setVisible(false),
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
