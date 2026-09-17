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
  type GameKeyboard,
} from "@gamesweb/game-core";
import { pocketStrikerManifest, readRunContext, type PlatformSDK } from "@gamesweb/game-sdk";
import { LAYOUTS, type Layout } from "../systems/layouts";

export class PocketScene extends Phaser.Scene {
  private platform!: PlatformSDK;
  private layout!: Layout;
  private layoutIndex = 0;
  private juice = new Juice();
  private parts!: ParticlePool;
  private synth!: Synth;
  private gfx!: Phaser.GameObjects.Graphics;
  private overlay!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private native: GameKeyboard | null = null;
  private bx = 0;
  private by = 0;
  private vx = 0;
  private vy = 0;
  private strokes = 0;
  private aiming = false;
  private ax = 0;
  private ay = 0;
  private ended = false;
  private banked = false;
  private wallThisShot = false;
  private signaledReady = false;
  private ticks = 0;
  private longFrames = 0;
  private started = 0;
  private scaleX = 1;
  private scaleY = 1;

  constructor() {
    super("pocket-play");
  }

  create() {
    this.platform = this.game.registry.get("platform") as PlatformSDK;
    const ctx = readRunContext();
    this.layoutIndex = Number(this.game.registry.get("layoutIndex") ?? ctx.modeIndex ?? 0) % LAYOUTS.length;
    if (ctx.seed) this.layoutIndex = Math.abs([...ctx.seed].reduce((h, c) => h + c.charCodeAt(0), 0)) % LAYOUTS.length;
    this.layout = LAYOUTS[this.layoutIndex];
    this.bx = this.layout.ball.x;
    this.by = this.layout.ball.y;
    this.vx = this.vy = 0;
    this.strokes = 0;
    this.ended = false;
    this.parts = new ParticlePool(80);
    this.synth = (this.game.registry.get("synth") as Synth | undefined) ?? new Synth();
    this.game.registry.set("synth", this.synth);
    this.synth.setSettings(this.platform.audio.getSettings());
    this.gfx = this.add.graphics();
    this.overlay = this.add.graphics().setScrollFactor(0).setDepth(20);
    this.hud = this.add.text(16, 48, "", { fontFamily: "ui-sans-serif, system-ui", fontSize: "16px", color: "#d9f5d4" }).setScrollFactor(0).setDepth(21);
    this.native?.destroy();
    this.native = createGameKeyboard();
    this.game.canvas.tabIndex = 0;
    this.game.canvas.focus({ preventScroll: true });
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (this.ended) {
        this.scene.restart();
        return;
      }
      if (Math.hypot(this.vx, this.vy) > 12) return;
      this.aiming = true;
      this.ax = p.x / this.scaleX;
      this.ay = p.y / this.scaleY;
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!this.aiming) return;
      this.ax = p.x / this.scaleX;
      this.ay = p.y / this.scaleY;
    });
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (!this.aiming) return;
      this.ax = p.x / this.scaleX;
      this.ay = p.y / this.scaleY;
      this.shoot();
    });
    this.platform.session.start();
    this.started = this.time.now;
    this.platform.events.emit({ name: "gameplay_started", props: { gameId: "pocket-striker" } });
  }

  private shoot() {
    this.aiming = false;
    const dx = this.bx - this.ax;
    const dy = this.by - this.ay;
    const len = Math.hypot(dx, dy);
    if (len < 8) return;
    const power = Math.min(1, len / 160);
    this.vx = (dx / len) * power * 620;
    this.vy = (dy / len) * power * 620;
    this.strokes += 1;
    this.wallThisShot = false;
    this.synth.tone(180 + power * 80, 0.06, "triangle", 0.05, 0.16);
    pulseHaptic(6);
  }

  update(_: number, delta: number) {
    const dt = Math.min(0.033, delta / 1000);
    this.ticks += 1;
    this.longFrames = countLongFrame(delta, this.longFrames);
    if (!this.signaledReady) {
      this.signaledReady = true;
      this.platform.events.emit({ name: "game_ready", props: { gameId: "pocket-striker" } });
    }
    this.scaleX = this.scale.width / this.layout.w;
    this.scaleY = this.scale.height / this.layout.h;
    const native = this.native?.read();
    if (native?.retryPressed) this.scene.restart();
    if (!this.ended) {
      this.bx += this.vx * dt;
      this.by += this.vy * dt;
      this.vx *= Math.pow(0.985, dt * 60);
      this.vy *= Math.pow(0.985, dt * 60);
      this.bounce();
      if (Math.hypot(this.vx, this.vy) < 8) {
        this.vx = 0;
        this.vy = 0;
      }
      const hole = this.layout.hole;
      const dist = Math.hypot(this.bx - hole.x, this.by - hole.y);
      const speed = Math.hypot(this.vx, this.vy);
      if (dist < hole.r && speed < 90) this.sink();
      if (this.strokes >= 12 && speed < 8) this.sink(false);
    }
    this.parts.update(dt);
    this.draw();
    this.publishDebug();
  }

  private bounce() {
    for (const w of this.layout.walls) {
      const nx = Math.max(w.x, Math.min(this.bx, w.x + w.w));
      const ny = Math.max(w.y, Math.min(this.by, w.y + w.h));
      const dx = this.bx - nx;
      const dy = this.by - ny;
      if (dx * dx + dy * dy > 12 * 12) continue;
      this.wallThisShot = true;
      if (Math.abs(dx) > Math.abs(dy)) {
        this.vx *= -0.72;
        this.bx += Math.sign(dx) * 3;
      } else {
        this.vy *= -0.72;
        this.by += Math.sign(dy) * 3;
      }
      this.synth.tone(520, 0.03, "square", 0.02, 0.08);
    }
  }

  private sink(ok = true) {
    if (this.ended) return;
    this.ended = true;
    if (ok) {
      this.synth.finishSting();
      void this.platform.achievement.unlock("first-pocket");
      if (this.strokes === 1) void this.platform.achievement.unlock("perfect");
      if (this.wallThisShot) {
        this.banked = true;
        void this.platform.achievement.unlock("bank");
      }
      if (this.strokes <= this.layout.par) void this.platform.achievement.unlock("par-table");
    } else this.synth.crash(0.4);
    void this.platform.session.end({
      mode: readRunContext().daily ? "daily" : "layout",
      score: Math.max(1, this.strokes),
      result: ok ? "finish" : "death",
      metadata: {
        lowerIsBetter: true,
        strokes: Math.max(1, this.strokes),
        par: this.layout.par,
        layout: this.layout.id,
        bank: this.banked,
        perfect: this.strokes === 1,
        attemptDurationMs: Math.round(this.time.now - this.started),
        retryHint: `${this.layout.name} · ${this.strokes} vs par ${this.layout.par}`,
      },
    });
  }

  private draw() {
    const g = this.gfx;
    g.clear();
    g.save();
    g.scaleCanvas(this.scaleX, this.scaleY);
    g.fillStyle(0x173322, 1);
    g.fillRect(0, 0, this.layout.w, this.layout.h);
    g.fillStyle(0x1f4a32, 1);
    g.fillRect(18, 18, this.layout.w - 36, this.layout.h - 36);
    g.fillStyle(0x0f2418, 1);
    for (const w of this.layout.walls) g.fillRect(w.x, w.y, w.w, w.h);
    g.fillStyle(0x08140c, 1);
    g.fillCircle(this.layout.hole.x, this.layout.hole.y, this.layout.hole.r);
    g.fillStyle(0xc4f1c2, 1);
    g.fillCircle(this.bx, this.by, 11);
    if (this.aiming) {
      g.lineStyle(2, 0xffffff, 0.7);
      g.lineBetween(this.bx, this.by, this.bx + (this.bx - this.ax), this.by + (this.by - this.ay));
    }
    g.restore();
    this.hud.setText(`${this.layout.name}\n${this.strokes} / par ${this.layout.par}`);
    this.overlay.clear();
  }

  private publishDebug() {
    publishGwDebug(
      {
        gameId: "pocket-striker",
        ready: this.signaledReady,
        runState: this.ended ? "ended" : "playing",
        playerX: this.bx,
        playerY: this.by,
        score: this.strokes,
        paused: false,
        fps: this.game.loop.actualFps,
        longFrames: this.longFrames,
        tick: this.ticks,
        frozen: false,
      },
      {
        finishRun: () => this.sink(true),
        hideHud: () => this.hud.setVisible(false),
      },
    );
  }

  shutdown() {
    this.native?.destroy();
    clearGwDebug();
  }
}

export function mountPocketStriker(parent: HTMLElement, platform: PlatformSDK, layoutIndex = 0) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: Math.max(320, parent.clientWidth || 720),
    height: Math.max(240, parent.clientHeight || 480),
    backgroundColor: "#173322",
    scale: { mode: Phaser.Scale.RESIZE },
    scene: [PocketScene],
    disableContextMenu: true,
    banner: false,
    autoFocus: true,
    input: { keyboard: { target: typeof window !== "undefined" ? window : undefined }, activePointers: 3 },
    fps: { target: 60 },
    render: { preserveDrawingBuffer: true },
  });
  game.registry.set("platform", platform);
  game.registry.set("layoutIndex", layoutIndex);
  game.registry.set("manifest", pocketStrikerManifest);
  (game as Phaser.Game & { restartRun: () => void }).restartRun = () => {
    game.scene.getScene("pocket-play")?.scene.restart();
  };
  game.events.once("destroy", () => {
    (game.registry.get("synth") as Synth | undefined)?.dispose();
    clearGwDebug();
  });
  return game;
}
