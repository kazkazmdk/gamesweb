import Phaser from "phaser";
import {
  clamp,
  Juice,
  ParticlePool,
  pulseHaptic,
  Synth,
  publishGwDebug,
  countLongFrame,
  clearGwDebug,
  createGameKeyboard,
  drawParticles,
  fillBackdrop,
  fillVignette,
  mixColor,
  drawRunner,
  drawLamp,
  drawContainer,
  type GameKeyboard,
} from "@gamesweb/game-core";
import { knockoutCircuitManifest, readRunContext, type PlatformSDK } from "@gamesweb/game-sdk";
import { MAPS, type MapDef, type Rect } from "../systems/maps";

function aabb(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export class KnockoutScene extends Phaser.Scene {
  private platform!: PlatformSDK;
  private map!: MapDef;
  private mapIndex = 0;
  private juice = new Juice();
  private parts!: ParticlePool;
  private synth!: Synth;
  private gfx!: Phaser.GameObjects.Graphics;
  private overlay!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private nativeKeys: GameKeyboard | null = null;
  private x = 80;
  private y = 600;
  private vx = 0;
  private vy = 0;
  private grounded = false;
  private dash = 0;
  private timeMs = 0;
  private running = false;
  private ended = false;
  private dying = 0;
  private hits = 0;
  private camX = 0;
  private camY = 0;
  private touchMove = 0;
  private touchJump = false;
  private touchDash = false;
  private moveId = -1;
  private jumpId = -1;
  private dashId = -1;
  private started = 0;
  private signaledReady = false;
  private ticks = 0;
  private longFrames = 0;
  private recorder: Array<{ t: number; x: number; y: number }> = [];
  private ghosts: Array<{ name: string; color: number; samples: Array<{ t: number; x: number; y: number }> }> = [];
  private usedExpert = false;
  private spawn = { x: 80, y: 600 };
  private rag = { x: 0, y: 0, vx: 0, vy: 0, rot: 0, av: 0 };

  constructor() {
    super("knockout-play");
  }

  create() {
    this.platform = this.game.registry.get("platform") as PlatformSDK;
    this.mapIndex = Number(this.game.registry.get("mapIndex") ?? readRunContext().modeIndex ?? 0);
    this.map = MAPS[this.mapIndex] ?? MAPS[0];
    const spawn = this.map.solids.find((s) => s.kind === "spawn");
    this.spawn = { x: spawn?.x ?? 80, y: spawn?.y ?? 600 };
    this.x = this.spawn.x;
    this.y = this.spawn.y;
    this.vx = this.vy = 0;
    this.ended = false;
    this.running = false;
    this.timeMs = 0;
    this.hits = 0;
    this.dash = 0;
    this.dying = 0;
    this.recorder = [];
    this.usedExpert = false;
    this.parts = new ParticlePool(120);
    this.synth = (this.game.registry.get("synth") as Synth | undefined) ?? new Synth();
    this.game.registry.set("synth", this.synth);
    this.synth.setSettings(this.platform.audio.getSettings());
    this.cameras.main.setBackgroundColor(this.map.theme.sky);
    this.gfx = this.add.graphics();
    this.overlay = this.add.graphics().setScrollFactor(0).setDepth(20);
    this.hud = this.add.text(20, 64, "", { fontFamily: "ui-sans-serif, system-ui", fontSize: "16px", color: "#2a1a10" }).setScrollFactor(0).setDepth(21);
    this.nativeKeys?.destroy();
    this.nativeKeys = createGameKeyboard();
    this.game.canvas.tabIndex = 0;
    this.game.canvas.focus({ preventScroll: true });
    this.input.addPointer(3);
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (!p.wasTouch) return;
      if (p.x < this.scale.width * 0.28) {
        this.touchMove = -1;
        this.moveId = p.id;
      } else if (p.x > this.scale.width * 0.72) {
        this.touchMove = 1;
        this.moveId = p.id;
      } else if (p.y > this.scale.height * 0.7) {
        this.touchJump = true;
        this.jumpId = p.id;
      } else {
        this.touchDash = true;
        this.dashId = p.id;
      }
    });
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (p.id === this.moveId) {
        this.touchMove = 0;
        this.moveId = -1;
      }
      if (p.id === this.jumpId) this.jumpId = -1;
      if (p.id === this.dashId) this.dashId = -1;
    });
    this.loadGhosts();
    this.platform.events.emit({ name: "gameplay_started", props: { gameId: "knockout-circuit" } });
  }

  private loadGhosts() {
    this.ghosts = [];
    try {
      const raw = localStorage.getItem(`gw:ko-ghost:${this.map.id}`);
      if (raw) this.ghosts.push({ name: "PB", color: 0xffe08a, samples: JSON.parse(raw) });
    } catch {
      /* noop */
    }
  }

  update(_: number, delta: number) {
    const dt = Math.min(0.033, delta / 1000);
    this.ticks += 1;
    this.longFrames = countLongFrame(delta, this.longFrames);
    if (!this.signaledReady) {
      this.signaledReady = true;
      this.platform.events.emit({ name: "game_ready", props: { gameId: "knockout-circuit" } });
    }
    const native = this.nativeKeys?.read();
    if (native?.retryPressed) this.scene.restart();
    if (native?.onePressed) this.switchMap(0);
    if (native?.twoPressed) this.switchMap(1);
    if (native?.threePressed) this.switchMap(2);
    if (this.dying > 0) {
      this.dying -= dt * 1000;
      this.rag.vy += 1680 * dt;
      this.rag.x += this.rag.vx * dt;
      this.rag.y += this.rag.vy * dt;
      this.rag.rot += this.rag.av * dt;
      this.parts.update(dt);
      this.draw();
      if (this.dying <= 0) {
        this.x = this.spawn.x;
        this.y = this.spawn.y;
        this.vx = this.vy = 0;
        this.running = false;
        this.timeMs = 0;
        this.recorder = [];
      }
      return;
    }
    const move = Number(Boolean(native?.right)) - Number(Boolean(native?.left)) || this.touchMove;
    const jump = Boolean(native?.jumpPressed) || this.touchJump;
    const dash = Boolean(native?.dashPressed) || this.touchDash;
    this.touchJump = false;
    this.touchDash = false;
    if (!this.running && (move || jump || dash)) {
      this.running = true;
      this.started = this.time.now;
      this.platform.session.start();
    }
    if (!this.ended) {
      this.vx = move * (this.dash > 0 ? 420 : 260);
      if (jump && this.grounded) {
        this.vy = -620;
        this.grounded = false;
        this.synth.tone(340, 0.04, "square", 0.03, 0.1);
      }
      if (dash && this.dash <= 0) {
        this.dash = 180;
        this.synth.noiseBurst(0.08, 0.04, 500);
      }
      this.dash = Math.max(0, this.dash - dt * 1000);
      this.vy += 1680 * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.collide();
      if (this.running) this.timeMs = this.time.now - this.started;
      if (this.ticks % 4 === 0) this.recorder.push({ t: this.timeMs, x: this.x, y: this.y });
      const finish = this.map.solids.find((s) => s.kind === "finish");
      if (finish && aabb(this.x, this.y, 22, 32, finish.x, finish.y, finish.w, finish.h)) this.win();
      if (this.y > this.map.height + 40) this.die();
    }
    this.camX += (this.x - this.camX) * (1 - Math.exp(-dt * 6));
    this.camY += (this.y - 40 - this.camY) * (1 - Math.exp(-dt * 4));
    this.camX = clamp(this.camX, this.scale.width / 2, Math.max(this.scale.width / 2, this.map.width - this.scale.width / 2));
    this.camY = clamp(this.camY, this.scale.height / 2, Math.max(this.scale.height / 2, this.map.height - this.scale.height / 2));
    this.cameras.main.centerOn(this.camX, this.camY);
    this.parts.update(dt);
    this.draw();
    this.publishDebug();
  }

  private collide() {
    this.grounded = false;
    const t = this.time.now / 1000;
    for (const s of this.map.solids) {
      if (s.kind === "spawn" || s.kind === "finish") continue;
      const live = this.liveRect(s, t);
      if (!aabb(this.x, this.y, 22, 32, live.x, live.y, live.w, live.h)) continue;
      if (s.kind === "spike" || s.kind === "spinner" || s.kind === "beam") {
        this.die();
        return;
      }
      if (s.route === "expert") this.usedExpert = true;
      if (this.vy >= 0 && this.y + 20 <= live.y + 12) {
        this.y = live.y - 32;
        this.vy = 0;
        this.grounded = true;
      } else if (this.x + 11 < live.x + live.w / 2) this.x = live.x - 22;
      else this.x = live.x + live.w;
    }
  }

  private liveRect(s: Rect, t: number) {
    if (s.kind === "mover") return { ...s, x: s.x + Math.sin(t * 1.6 + (s.phase ?? 0)) * 70 };
    if (s.kind === "gate") {
      const open = (Math.sin(t * 1.8 + (s.phase ?? 0)) + 1) / 2;
      return { ...s, h: s.h * (0.25 + open * 0.75), y: s.y + s.h * (1 - (0.25 + open * 0.75)) };
    }
    if (s.kind === "fall") return { ...s, y: s.y + Math.max(0, Math.sin(t * 2 + (s.phase ?? 0))) * 80 };
    if (s.kind === "spinner") {
      const a = t * 2.4 + (s.phase ?? 0);
      return { x: s.x + Math.cos(a) * 36, y: s.y + Math.sin(a) * 36, w: 28, h: 28, kind: s.kind };
    }
    if (s.kind === "beam") return { ...s, x: s.x + Math.sin(t * 1.3 + (s.phase ?? 0)) * 90 };
    return s;
  }

  private die() {
    if (this.ended || this.dying > 0) return;
    this.hits += 1;
    this.dying = 520;
    this.rag = { x: this.x, y: this.y, vx: this.vx * 0.35 + (Math.random() - 0.5) * 140, vy: -340, rot: 0, av: 9 + Math.random() * 6 };
    this.parts.burst(this.x + 11, this.y + 12, 16, this.map.theme.danger, 140, 380);
    this.synth.impact(0.6);
    this.juice.flash(0.2);
    if (this.running) {
      void this.platform.session.end({
        mode: this.map.id,
        score: Math.floor(this.timeMs),
        result: "attempt-death",
        metadata: { competitive: false, hideResult: true, attemptDurationMs: Math.floor(this.timeMs) },
      });
    }
  }

  private win() {
    if (this.ended) return;
    this.ended = true;
    this.synth.finishSting();
    pulseHaptic([8, 20, 8]);
    try {
      localStorage.setItem(`gw:ko-ghost:${this.map.id}`, JSON.stringify(this.recorder));
      const key = "gw:ko-cleared";
      const got = new Set((localStorage.getItem(key) ?? "").split(",").filter(Boolean));
      got.add(this.map.id);
      localStorage.setItem(key, [...got].join(","));
      if (got.size >= MAPS.length) void this.platform.achievement.unlock("all-maps");
    } catch {
      /* noop */
    }
    void this.platform.achievement.unlock("first-gate");
    if (this.hits === 0) void this.platform.achievement.unlock("no-hit");
    if (this.usedExpert) void this.platform.achievement.unlock("shortcut");
    void this.platform.session.end({
      mode: this.map.id,
      score: Math.floor(this.timeMs),
      result: "finish",
      metadata: {
        lowerIsBetter: true,
        hits: this.hits,
        expert: this.usedExpert,
        attemptDurationMs: Math.floor(this.timeMs),
        retryHint: `${this.map.name} ${(this.timeMs / 1000).toFixed(2)}s`,
      },
    });
  }

  private switchMap(i: number) {
    this.game.registry.set("mapIndex", i);
    this.scene.restart();
  }

  private drawPlace(g: Phaser.GameObjects.Graphics, th: MapDef["theme"]) {
    const env = this.map.env;
    if (env === "factory") {
      g.fillStyle(mixColor(th.sky, 0xffffff, 0.12), 1);
      for (let i = 0; i < 8; i += 1) {
        const x = i * 380 + this.camX * 0.18;
        g.fillRect(x, this.map.height * 0.28, 86, this.map.height * 0.72);
        g.fillStyle(0xffffff, 0.22);
        g.fillRect(x + 14, this.map.height * 0.34, 14, 16);
        g.fillStyle(mixColor(th.sky, 0xffffff, 0.12), 1);
      }
      g.fillStyle(0xf2e6d0, 1);
      g.fillRect(0, this.map.height - 52, this.map.width, 52);
      g.fillStyle(th.danger, 0.85);
      for (let i = 0; i < this.map.width; i += 28) {
        g.fillTriangle(i, this.map.height - 52, i + 14, this.map.height - 52, i + 14, this.map.height - 34);
      }
      g.fillStyle(th.accent, 0.55);
      for (let i = 0; i < 5; i += 1) g.fillRect(i * 520 + this.camX * 0.08, this.map.height * 0.14, 160, 16);
      for (let i = 0; i < 7; i += 1) {
        const x = 90 + i * 380;
        drawLamp(g, x, this.map.height * 0.4, 64, 0xffe08a, 0x6a6a70);
        if (i % 2 === 0) drawContainer(g, x + 40, this.map.height - 96, 48, 30, i % 4 === 0 ? 0xff6b4a : 0x4ad4e8);
      }
      g.fillStyle(0xc8c4bc, 0.85);
      for (let i = 0; i < 6; i += 1) {
        const x = 220 + i * 440;
        g.fillRect(x, this.map.height * 0.18, 12, this.map.height * 0.42);
        g.fillRect(x - 46, this.map.height * 0.18, 104, 10);
      }
      g.fillStyle(0x2a2218, 0.55);
      g.fillRect(this.camX * 0.2, this.map.height * 0.08, 220, 48);
      g.fillStyle(0xffe08a, 0.9);
      g.fillRect(this.camX * 0.2 + 10, this.map.height * 0.08 + 10, 200, 28);
      const crowd = [0xff6b4a, 0x4ad4e8, 0xffd166, 0xff8ad4];
      for (let i = 0; i < 18; i += 1) {
        g.fillStyle(crowd[i % crowd.length], 0.85);
        g.fillCircle(40 + i * 28 + this.camX * 0.05, this.map.height * 0.22, 7);
      }
    } else if (env === "skyworks") {
      g.fillStyle(0xfff4c8, 0.85);
      g.fillCircle(this.map.width * 0.72, 84, 56);
      g.fillStyle(0xffffff, 0.55);
      for (let i = 0; i < 7; i += 1) {
        const x = i * 460 + this.camX * 0.14;
        g.fillRect(x + 80, 70, 10, this.map.height);
        g.fillRect(x, 110 + (i % 3) * 36, 180, 10);
      }
    } else {
      g.fillStyle(th.accent, 0.16);
      for (let i = 0; i < 12; i += 1) g.fillRect(i * 280 + this.camX * 0.1, 36, 8, this.map.height);
      g.fillStyle(0xffffff, 0.4);
      g.fillRect(0, this.map.height * 0.18, this.map.width, 12);
    }
  }

  private draw() {
    const g = this.gfx;
    const th = this.map.theme;
    const t = this.time.now / 1000;
    g.clear();
    fillBackdrop(
      g,
      this.map.width,
      this.map.height,
      {
        top: mixColor(th.sky, 0xffffff, 0.2),
        mid: th.sky,
        bottom: mixColor(th.sky, 0xf4e8c8, 0.35),
        grain: 0.02,
        blobs: [
          { color: 0xfff4c8, x: 0.22, y: 0.16, r: 140, alpha: 0.28, parallax: 0.03 },
          { color: 0xffffff, x: 0.78, y: 0.12, r: 110, alpha: 0.2, parallax: 0.04 },
        ],
      },
      { x: this.camX, y: this.camY },
    );
    this.drawPlace(g, th);
    for (const s of this.map.solids) {
      const live = this.liveRect(s, t);
      if (s.kind === "spawn") continue;
      if (s.kind === "spinner") {
        const a = t * 2.8 + (s.phase ?? 0);
        const cx = live.x + live.w / 2;
        const cy = live.y + live.h / 2;
        g.fillStyle(0x2a2218, 1);
        g.fillRect(cx - 10, cy + 18, 20, 40);
        g.fillStyle(0xffe08a, 0.35);
        g.fillCircle(cx, cy, 46);
        g.save();
        g.translateCanvas(cx, cy);
        g.rotateCanvas(a);
        g.fillStyle(th.danger, 1);
        g.fillRoundedRect(-78, -11, 156, 22, 10);
        g.fillRoundedRect(-11, -78, 22, 156, 10);
        g.fillStyle(0xffe08a, 0.55);
        g.fillRect(-72, -6, 22, 12);
        g.fillStyle(0xffffff, 0.9);
        g.fillCircle(0, 0, 12);
        g.restore();
        continue;
      }
      if (s.kind === "beam") {
        g.fillStyle(0xff6b4a, 1);
        g.fillRoundedRect(live.x - 6, live.y - 4, live.w + 12, live.h + 8, live.h / 2 + 4);
        g.fillStyle(0xffffff, 0.28);
        const stripe = ((t * 48) % 16);
        for (let i = -16; i < live.w + 16; i += 16) g.fillRect(live.x + i + stripe, live.y + 2, 6, live.h - 4);
        continue;
      }
      if (s.kind === "spike") {
        g.fillStyle(0x6a6a70, 1);
        g.fillRect(live.x + live.w / 2 - 6, live.y + live.h, 12, 18);
        g.fillStyle(th.danger, 1);
        g.fillRoundedRect(live.x, live.y, live.w, live.h, 6);
        g.fillStyle(0xffffff, 0.3);
        g.fillRect(live.x + 4, live.y + 3, live.w - 8, 4);
        continue;
      }
      if (s.kind === "finish") {
        g.fillStyle(0x2a2218, 1);
        g.fillRect(live.x, live.y, 12, live.h);
        g.fillRect(live.x + live.w - 12, live.y, 12, live.h);
        g.fillStyle(0xffe08a, 1);
        g.fillRect(live.x, live.y, live.w, 22);
        for (let i = 0; i < 8; i += 1) {
          g.fillStyle(i % 2 ? 0x111113 : 0xf3f1ec, 1);
          g.fillRect(live.x + 8 + i * 10, live.y, 10, 22);
        }
        g.fillStyle(0xff6b4a, 0.45);
        g.fillCircle(live.x + live.w / 2, live.y - 18, 16);
        continue;
      }
      if (s.kind === "gate") {
        g.fillStyle(0x3a3a44, 1);
        g.fillRect(live.x - 14, live.y - 8, 14, live.h + 16);
        g.fillRect(live.x + live.w, live.y - 8, 14, live.h + 16);
        g.fillStyle(th.danger, 0.55 + Math.sin(t * 4) * 0.2);
        g.fillRect(live.x, live.y, live.w, 16);
        g.fillRect(live.x, live.y + live.h - 16, live.w, 16);
        continue;
      }
      if (s.kind === "mover") {
        g.fillStyle(0x2a2a30, 1);
        g.fillRect(live.x - 24, live.y + live.h / 2 - 3, live.w + 48, 6);
        g.fillStyle(th.ground, 1);
        g.fillRoundedRect(live.x, live.y, live.w, live.h, 6);
        g.fillStyle(0xff8a4a, 0.7);
        for (let i = 6; i < live.w - 4; i += 14) g.fillTriangle(live.x + i, live.y + 4, live.x + i + 8, live.y + live.h / 2, live.x + i, live.y + live.h - 4);
        continue;
      }
      if (s.kind === "fall") {
        g.fillStyle(0x8aa0b0, 0.85);
        g.fillCircle(live.x + live.w / 2, live.y + live.h / 2, Math.max(live.w, live.h) * 0.55);
        g.fillStyle(0xffffff, 0.35);
        g.fillCircle(live.x + live.w / 2, live.y + live.h / 2, Math.max(live.w, live.h) * 0.22);
        continue;
      }
      g.fillStyle(s.route === "expert" ? 0xff8a4a : th.ground, 1);
      g.fillRoundedRect(live.x, live.y, live.w, live.h, 7);
      g.fillStyle(0x000000, 0.08);
      g.fillRect(live.x + 4, live.y + live.h - 6, live.w - 8, 5);
      g.fillStyle(0xffffff, 0.35);
      g.fillRect(live.x + 6, live.y + 3, live.w - 12, 5);
      g.fillStyle(th.accent, 0.55);
      g.fillRect(live.x + 8, live.y + 4, 10, 3);
    }
    for (const ghost of this.ghosts) {
      const pose = ghost.samples.find((s) => s.t >= this.timeMs) ?? ghost.samples[ghost.samples.length - 1];
      if (!pose) continue;
      drawRunner(g, pose.x, pose.y, 22, 32, {
        facing: 1,
        grounded: true,
        vx: 80,
        vy: 0,
        t: pose.t,
        color: ghost.color,
      });
      g.fillStyle(ghost.color, 0.12);
      g.fillCircle(pose.x + 11, pose.y + 28, 14);
    }
    drawParticles(g, this.parts);
    const bodyX = this.dying > 0 ? this.rag.x : this.x;
    const bodyY = this.dying > 0 ? this.rag.y : this.y;
    drawRunner(g, bodyX, bodyY, 22, 32, {
      facing: this.vx >= 0 ? 1 : -1,
      grounded: this.grounded,
      vx: this.vx,
      vy: this.vy,
      t: this.timeMs,
      color: th.accent,
      dying: this.dying > 0,
      lean: this.dying > 0 ? this.rag.rot : this.vx * 0.0009,
    });
    fillVignette(g, this.map.width, this.map.height, 0.08);
    this.hud.setText(`GATE  ${this.map.name.toUpperCase()}\n${(this.timeMs / 1000).toFixed(2)}s   LIVE SHOW`);
    this.overlay.clear();
    const fa = this.juice.flashAlpha(0.016);
    if (fa) {
      this.overlay.fillStyle(0xffffff, fa);
      this.overlay.fillRect(0, 0, this.scale.width, this.scale.height);
    }
    if (this.sys.game.device.input.touch) {
      this.overlay.fillStyle(0xffffff, 0.06);
      this.overlay.fillRoundedRect(12, this.scale.height * 0.3, this.scale.width * 0.24, this.scale.height * 0.45, 16);
      this.overlay.fillRoundedRect(this.scale.width * 0.76, this.scale.height * 0.3, this.scale.width * 0.22, this.scale.height * 0.45, 16);
      this.overlay.fillStyle(th.accent, 0.2);
      this.overlay.fillRoundedRect(this.scale.width / 2 - 50, this.scale.height - 84, 100, 56, 14);
    }
  }

  private publishDebug() {
    publishGwDebug(
      {
        gameId: "knockout-circuit",
        ready: this.signaledReady,
        runState: this.ended ? "ended" : "playing",
        playerX: this.x,
        playerY: this.y,
        score: Math.floor(this.timeMs),
        paused: false,
        fps: this.game.loop.actualFps,
        longFrames: this.longFrames,
        tick: this.ticks,
        frozen: false,
        contentId: this.map.id,
      },
      {
        finishRun: () => this.win(),
        killPlayer: () => this.die(),
        hideHud: () => this.hud.setVisible(false),
      },
    );
  }

  shutdown() {
    this.nativeKeys?.destroy();
    clearGwDebug();
  }
}

export function mountKnockoutCircuit(parent: HTMLElement, platform: PlatformSDK, mapIndex = 0) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: Math.max(320, parent.clientWidth || 1280),
    height: Math.max(240, parent.clientHeight || 720),
    backgroundColor: "#87c8ea",
    scale: { mode: Phaser.Scale.RESIZE },
    scene: [KnockoutScene],
    disableContextMenu: true,
    banner: false,
    autoFocus: true,
    input: { keyboard: { target: typeof window !== "undefined" ? window : undefined }, activePointers: 4 },
    fps: { target: 60 },
    render: { preserveDrawingBuffer: true },
  });
  game.registry.set("platform", platform);
  game.registry.set("mapIndex", mapIndex);
  game.registry.set("manifest", knockoutCircuitManifest);
  (game as Phaser.Game & { restartRun: () => void }).restartRun = () => {
    game.scene.getScene("knockout-play")?.scene.restart();
  };
  game.events.once("destroy", () => {
    (game.registry.get("synth") as Synth | undefined)?.dispose();
    clearGwDebug();
  });
  return game;
}
