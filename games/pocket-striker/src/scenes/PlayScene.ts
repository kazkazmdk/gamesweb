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
  drawParticles,
  drawShinyBall,
  fillBackdrop,
  type GameKeyboard,
} from "@gamesweb/game-core";
import { pocketStrikerManifest, readRunContext, type PlatformSDK } from "@gamesweb/game-sdk";
import { LAYOUTS, type Layout } from "../systems/layouts";
import { stepBall, type BallState } from "../systems/physics";

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
  private trail: Array<{ x: number; y: number }> = [];
  private portalCd = 0;
  private lastPortal = false;

  constructor() {
    super("pocket-play");
  }

  create() {
    this.platform = this.game.registry.get("platform") as PlatformSDK;
    const ctx = readRunContext();
    if (ctx.modeIndex !== undefined && Number.isFinite(ctx.modeIndex)) {
      this.layoutIndex = Math.abs(ctx.modeIndex) % LAYOUTS.length;
    } else if (ctx.seed) {
      this.layoutIndex = Math.abs([...ctx.seed].reduce((h, c) => h + c.charCodeAt(0), 0)) % LAYOUTS.length;
    } else {
      this.layoutIndex = Math.abs(Number(this.game.registry.get("layoutIndex") ?? 0)) % LAYOUTS.length;
    }
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
    this.hud = this.add.text(16, 64, "DRAG → RELEASE", { fontFamily: "ui-sans-serif, system-ui", fontSize: "16px", color: "#3a2414" }).setScrollFactor(0).setDepth(21);
    this.trail = [];
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
      const next = stepBall({ x: this.bx, y: this.by, vx: this.vx, vy: this.vy, portalCd: this.portalCd }, this.layout, dt);
      if (next.portalCd > this.portalCd) {
        this.synth.tone(720, 0.05, "sine", 0.04, 0.08);
        this.parts.burst(this.bx, this.by, 8, 0x7dffc3, 70, 220);
        this.lastPortal = true;
      }
      if ((next.broke ?? 0) > 0) {
        this.synth.impact(0.45);
        this.parts.burst(next.x, next.y, 10, 0xffc18a, 80, 240);
      }
      this.bx = next.x;
      this.by = next.y;
      this.vx = next.vx;
      this.vy = next.vy;
      this.portalCd = next.portalCd;
      if (Math.hypot(this.vx, this.vy) > 20 && this.ticks % 2 === 0) {
        this.trail.push({ x: this.bx, y: this.by });
        if (this.trail.length > 18) this.trail.shift();
      }
      if (Math.hypot(this.vx, this.vy) < 8) {
        this.vx = 0;
        this.vy = 0;
        this.trail = [];
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

  private drawFurniture(g: Phaser.GameObjects.Graphics, theme: Layout["theme"]) {
    g.fillStyle(0xf0c060, 0.22);
    g.fillCircle(80, 36, 46);
    g.fillStyle(0x6a4a28, 1);
    g.fillRect(68, 8, 8, 28);
    g.fillStyle(0xffe08a, 0.9);
    g.fillCircle(72, 8, 10);
    g.fillStyle(0xf2e6d0, 1);
    g.fillRoundedRect(28, 54, 36, 22, 3);
    g.fillStyle(0xc45c3a, 1);
    g.fillRect(32, 58, 12, 14);
    if (theme === "workshop") {
      g.fillStyle(0x8a6a40, 0.7);
      g.fillRect(40, 40, 54, 16);
      g.fillRect(630, 40, 54, 16);
      for (let i = 40; i < 680; i += 70) g.fillRect(i, 36, 10, 4);
    } else if (theme === "garden") {
      g.fillStyle(0x3a7a44, 0.7);
      g.fillCircle(70, 70, 20);
      g.fillCircle(650, 70, 16);
      g.fillCircle(70, 410, 14);
      g.fillCircle(650, 410, 18);
    } else {
      g.fillStyle(0xc45c3a, 0.28);
      g.fillRect(40, 40, 80, 8);
      g.fillRect(600, 40, 80, 8);
      g.fillStyle(0x3a6a88, 0.22);
      g.fillRect(40, 430, 80, 8);
      g.fillRect(600, 430, 80, 8);
    }
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
      this.parts.burst(this.bx, this.by, 5, 0xc4f1c2, 50, 180);
    }
    for (const b of this.layout.bumpers ?? []) {
      const dx = this.bx - b.x;
      const dy = this.by - b.y;
      const d = Math.hypot(dx, dy);
      if (d > b.r + 11 || d < 0.1) continue;
      const nx = dx / d;
      const ny = dy / d;
      const vn = this.vx * nx + this.vy * ny;
      if (vn < 0) {
        this.vx -= 2.1 * vn * nx;
        this.vy -= 2.1 * vn * ny;
      }
      this.bx = b.x + nx * (b.r + 12);
      this.by = b.y + ny * (b.r + 12);
      this.synth.tone(680, 0.04, "triangle", 0.03, 0.1);
    }
  }

  private predict() {
    const pts: Array<{ x: number; y: number }> = [];
    let x = this.bx;
    let y = this.by;
    const dx = this.bx - this.ax;
    const dy = this.by - this.ay;
    const len = Math.hypot(dx, dy);
    if (len < 8) return pts;
    const power = Math.min(1, len / 160);
    let vx = (dx / len) * power * 620;
    let vy = (dy / len) * power * 620;
    const step = 0.028;
    for (let i = 0; i < 14; i += 1) {
      x += vx * step;
      y += vy * step;
      vx *= Math.pow(0.985, step * 60);
      vy *= Math.pow(0.985, step * 60);
      for (const w of this.layout.walls) {
        const nx = Math.max(w.x, Math.min(x, w.x + w.w));
        const ny = Math.max(w.y, Math.min(y, w.y + w.h));
        if ((x - nx) ** 2 + (y - ny) ** 2 > 12 * 12) continue;
        if (Math.abs(x - nx) > Math.abs(y - ny)) vx *= -0.72;
        else vy *= -0.72;
      }
      pts.push({ x, y });
    }
    return pts;
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
    const theme = this.layout.theme ?? "garden";
    const felt = theme === "workshop" ? 0xc4a06a : theme === "arcade" ? 0x3a6a88 : 0x2f7a4a;
    const rail = theme === "workshop" ? 0x8a5a2c : theme === "arcade" ? 0x6a3a22 : 0x7a4a24;
    fillBackdrop(g, this.scale.width, this.scale.height, {
      top: 0xf2e6d0,
      mid: 0xe8d4b0,
      bottom: 0xd4b888,
      grain: 0.03,
      blobs: [{ color: 0xffe08a, x: 0.18, y: 0.12, r: 80, alpha: 0.18 }],
    });
    g.save();
    g.scaleCanvas(this.scaleX, this.scaleY);
    g.fillStyle(0x5a3a1c, 1);
    g.fillRoundedRect(0, 0, this.layout.w, this.layout.h, 22);
    g.fillStyle(rail, 1);
    g.fillRoundedRect(8, 8, this.layout.w - 16, this.layout.h - 16, 16);
    g.fillStyle(felt, 1);
    g.fillRoundedRect(24, 24, this.layout.w - 48, this.layout.h - 48, 12);
    g.fillStyle(0xa06a38, 1);
    g.fillRect(12, 12, this.layout.w - 24, 14);
    g.fillRect(12, this.layout.h - 26, this.layout.w - 24, 14);
    g.fillRect(12, 12, 14, this.layout.h - 24);
    g.fillRect(this.layout.w - 26, 12, 14, this.layout.h - 24);
    this.drawFurniture(g, theme);
    g.fillStyle(theme === "arcade" ? 0xff6ad5 : 0xc4b48a, 0.34);
    for (let i = 0; i < 10; i += 1) {
      g.fillCircle(28 + i * 70, 18, 3.4);
      g.fillCircle(28 + i * 70, this.layout.h - 18, 3.4);
    }
    for (let i = 0; i < 6; i += 1) {
      g.fillCircle(16, 48 + i * 64, 2.6);
      g.fillCircle(this.layout.w - 16, 48 + i * 64, 2.6);
    }
    g.fillStyle(0x2a2018, 0.9);
    g.fillRect(this.layout.w - 92, 28, 64, 18);
    g.fillStyle(theme === "arcade" ? 0xff6ad5 : 0xffd166, 0.8);
    g.fillRect(this.layout.w - 86, 33, 18, 8);
    g.fillStyle(theme === "workshop" ? 0x2a1c12 : theme === "arcade" ? 0x1a1028 : 0x0f2418, 1);
    for (const w of this.layout.walls) {
      if (w.x === 0 || w.y === 0 || w.w >= this.layout.w - 2 || w.h >= this.layout.h - 2) continue;
      g.fillRoundedRect(w.x, w.y, w.w, w.h, theme === "garden" ? 8 : 3);
      if (theme === "workshop") {
        g.fillStyle(0x8a6a40, 0.7);
        g.fillCircle(w.x + 6, w.y + 6, 2);
        g.fillCircle(w.x + w.w - 6, w.y + 6, 2);
        g.fillStyle(0x2a1c12, 1);
      } else if (theme === "garden") {
        g.fillStyle(0x2a6a3c, 0.55);
        g.fillRect(w.x, w.y, w.w, 5);
        g.fillStyle(0x0f2418, 1);
      } else {
        g.fillStyle(0xff6ad5, 0.35);
        g.fillRect(w.x, w.y, w.w, 3);
        g.fillStyle(0x1a1028, 1);
      }
    }
    const hole = this.layout.hole;
    g.fillStyle(0x3a6a48, 0.9);
    g.fillCircle(hole.x, hole.y, hole.r + 6);
    g.fillStyle(0x08140c, 1);
    g.fillCircle(hole.x, hole.y, hole.r);
    g.fillStyle(0xffffff, 0.12);
    g.fillCircle(hole.x - 3, hole.y - 3, hole.r * 0.35);
    for (let i = 0; i < this.trail.length; i += 1) {
      const p = this.trail[i];
      g.fillStyle(0xc4f1c2, 0.08 + (i / this.trail.length) * 0.28);
      g.fillCircle(p.x, p.y, 4 + (i / this.trail.length) * 4);
    }
    if (this.aiming) {
      const dx = this.bx - this.ax;
      const dy = this.by - this.ay;
      const len = Math.hypot(dx, dy);
      const power = Math.min(1, len / 160);
      g.lineStyle(3, 0xffffff, 0.35 + power * 0.45);
      g.lineBetween(this.bx, this.by, this.bx + dx, this.by + dy);
      g.fillStyle(0xffe08a, 0.85);
      g.fillCircle(this.bx + dx, this.by + dy, 4 + power * 5);
      const pts = this.predict();
      for (let i = 0; i < pts.length; i += 1) {
        g.fillStyle(0xffffff, 0.18 + (1 - i / pts.length) * 0.35);
        g.fillCircle(pts[i].x, pts[i].y, 2.4);
      }
    }
    for (const b of this.layout.bumpers ?? []) {
      g.fillStyle(theme === "arcade" ? 0xff6ad5 : theme === "workshop" ? 0xc47a28 : 0x7ab86a, 1);
      g.fillCircle(b.x, b.y, b.r);
      g.fillStyle(0xffffff, 0.25);
      g.fillCircle(b.x - 4, b.y - 4, 5);
    }
    for (const m of this.layout.movingBlockers ?? []) {
      g.fillStyle(theme === "arcade" ? 0x6ad4ff : 0x8a6a40, 1);
      g.fillRoundedRect(m.x, m.y, m.w, m.h, 4);
      g.fillStyle(0xffffff, 0.2);
      g.fillRect(m.x + 3, m.y + 3, m.w - 6, 3);
    }
    for (const r of this.layout.rotators ?? []) {
      g.save();
      g.translateCanvas(r.x, r.y);
      g.rotateCanvas(r.a);
      g.fillStyle(0xc4c4c8, 1);
      g.fillRect(0, -5, r.len, 10);
      g.fillStyle(0x3a3a40, 1);
      g.fillCircle(0, 0, 8);
      g.restore();
    }
    for (const p of this.layout.portals ?? []) {
      g.lineStyle(3, 0x7dffc3, 0.9);
      g.strokeCircle(p.x, p.y, p.r + 4);
      g.fillStyle(0x1a3a34, 0.85);
      g.fillCircle(p.x, p.y, p.r);
      g.fillStyle(0x7dffc3, 0.35 + Math.sin(this.time.now / 120) * 0.15);
      g.fillCircle(p.x, p.y, p.r * 0.55);
    }
    for (const p of this.layout.forcePads ?? []) {
      g.fillStyle(0xffe08a, 0.55);
      g.fillRoundedRect(p.x, p.y, p.w, p.h, 4);
      g.fillStyle(0xffffff, 0.7);
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;
      g.fillTriangle(cx + Math.sign(p.ax) * 10, cy + Math.sign(p.ay) * 10, cx - 6, cy - 6, cx - 6, cy + 6);
    }
    for (const b of this.layout.breakables ?? []) {
      if (b.hp <= 0) continue;
      g.fillStyle(0xc4a070, 0.95);
      g.fillRoundedRect(b.x, b.y, b.w, b.h, 3);
      g.fillStyle(0x000000, 0.2);
      g.fillRect(b.x + 4, b.y + 4, b.w - 8, 3);
    }
    for (const gate of this.layout.gates ?? []) {
      if (gate.open) {
        g.fillStyle(0x7dffc3, 0.18);
        g.fillRect(gate.x, gate.y, gate.w, gate.h);
      } else {
        g.fillStyle(0xff6a6a, 0.9);
        g.fillRect(gate.x, gate.y, gate.w, gate.h);
      }
    }
    drawShinyBall(g, this.bx, this.by, 11, theme === "arcade" ? 0xffd0f0 : 0xe8f6e6, this.time.now / 80);
    drawParticles(g, this.parts);
    g.restore();
    this.hud.setText(`TABLE  ${this.layout.name.toUpperCase()}\n${this.strokes}  ·  PAR ${this.layout.par}`);
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
        contentId: this.layout.id,
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
    backgroundColor: "#e8d4b0",
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
