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
  type GameKeyboard,
} from "@gamesweb/game-core";
import { readRunContext, skyStackManifest, type PlatformSDK } from "@gamesweb/game-sdk";
import { placeSlab, slabScore, type Slab } from "../systems/stack";

const START_W = 210;
const SLAB_H = 28;

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
    this.cameras.main.setBackgroundColor("#101826");
    this.gfx = this.add.graphics();
    this.overlay = this.add.graphics().setScrollFactor(0).setDepth(20);
    this.hud = this.add
      .text(18, 48, "", { fontFamily: "ui-sans-serif, system-ui", fontSize: "18px", color: "#eaf6ff" })
      .setScrollFactor(0)
      .setDepth(21);
    this.banner = this.add
      .text(this.scale.width / 2, this.scale.height * 0.42, "TAP TO PLACE", {
        fontFamily: "ui-sans-serif, system-ui",
        fontSize: "16px",
        color: "#9fd6ff",
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
    this.banner.setAlpha(0.85);
  }

  private tryPlace() {
    this.ensureAudio();
    if (this.ended) {
      this.retry();
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
    if (result.kind === "perfect") {
      this.streak += 1;
      this.perfects += 1;
      this.combo += 1;
      this.pitch = Math.min(880, this.pitch + 28);
      this.synth.tone(this.pitch, 0.07, "sine", 0.05, 0.18);
      pulseHaptic(8);
      this.juice.flash(0.08);
      this.parts.burst(result.next.x + result.next.w / 2, result.next.y, 14, 0xffffff, 90, 240);
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
      this.shake = result.kind === "near" ? 4 : 7;
    }
    this.score += slabScore(result.kind, this.combo, this.fever);
    if (this.floors >= 30) void this.platform.achievement.unlock("floor-30");
    if (this.floors >= 67) void this.platform.achievement.unlock("floor-67");
    this.speed = Math.min(420, 200 + this.floors * 4.2);
    const w = result.next.w;
    this.dir = this.rng() > 0.5 ? 1 : -1;
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
      if (this.ended || native.retryPressed) this.retry();
      else this.tryPlace();
    }
    if (!this.ended) {
      this.moving.x += this.dir * this.speed * dt * (this.fever ? 1.18 : 1);
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
    this.draw(dt);
    this.publishDebug();
  }

  private colorFor(i: number) {
    const h = (this.hue + i * 7) % 360;
    const s = this.fever ? 70 : 42;
    const l = 58 + (i % 3) * 4;
    return Phaser.Display.Color.HSLToColor(h / 360, s / 100, l / 100).color;
  }

  private draw(dt: number) {
    const g = this.gfx;
    g.clear();
    const w = this.scale.width;
    const h = this.scale.height;
    g.fillStyle(0x101826, 1);
    g.fillRect(0, 0, w, h);
    g.fillStyle(0x7ec8ff, 0.08);
    g.fillCircle(w * 0.7, 90 - this.camY * 0.08, 70);
    g.fillStyle(0xffc38a, 0.1);
    g.fillCircle(w * 0.18, h * 0.2, 46);
    const ox = (this.rng() * 0 + this.shake) * (Math.random() - 0.5);
    for (let i = 0; i < this.stack.length; i += 1) {
      const s = this.stack[i];
      const y = s.y + this.camY + ox;
      g.fillStyle(this.colorFor(i), 1);
      g.fillRoundedRect(s.x, y, s.w, SLAB_H - 4, 6);
    }
    if (!this.ended) {
      g.fillStyle(0xeaf6ff, 0.95);
      g.fillRoundedRect(this.moving.x, this.moving.y + this.camY, this.moving.w, SLAB_H - 4, 6);
    }
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
      `${this.floors}   ${this.score.toLocaleString()}${this.fever ? "  FEVER" : this.streak ? `  ${this.streak}x` : ""}`,
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
      },
      {
        finishRun: () => {
          this.floors = Math.max(this.floors, 8);
          this.fail();
        },
        killPlayer: () => this.fail(),
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
    backgroundColor: "#101826",
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
