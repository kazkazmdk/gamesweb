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
  fillBackdrop,
  fillVignette,
  type GameKeyboard,
} from "@gamesweb/game-core";
import { crowdControlManifest, readRunContext, type PlatformSDK } from "@gamesweb/game-sdk";
import { applyOp, buildCourse, opLabel, type Segment } from "../systems/course";

type Member = { ox: number; oy: number; vx: number; vy: number; phase: number };

export class CrowdScene extends Phaser.Scene {
  private platform!: PlatformSDK;
  private juice = new Juice();
  private parts!: ParticlePool;
  private synth!: Synth;
  private gfx!: Phaser.GameObjects.Graphics;
  private overlay!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private labels: Phaser.GameObjects.Text[] = [];
  private native: GameKeyboard | null = null;
  private segs: Segment[] = [];
  private z = 0;
  private x = 0.5;
  private pack = 12;
  private members: Member[] = [];
  private speed = 180;
  private ended = false;
  private hit = 0;
  private shortcut = false;
  private hitSet = new Set<number>();
  private choices: Array<{ z: number; side: "left" | "right" }> = [];
  private ghost: Array<{ z: number; x: number }> = [];
  private ghostTape: Array<{ z: number; x: number }> = [];
  private signaledReady = false;
  private ticks = 0;
  private longFrames = 0;
  private started = 0;
  private seed = "rush";
  private stepAcc = 0;
  private audioReady = false;

  constructor() {
    super("crowd-play");
  }

  create() {
    this.platform = this.game.registry.get("platform") as PlatformSDK;
    const ctx = readRunContext();
    this.seed = ctx.seed ?? ctx.challengeCode ?? "rush";
    this.segs = buildCourse(this.seed);
    this.z = 0;
    this.x = 0.5;
    this.pack = 12;
    this.ended = false;
    this.hit = 0;
    this.hitSet = new Set();
    this.shortcut = false;
    this.choices = [];
    this.ghost = [];
    this.members = [];
    this.stepAcc = 0;
    this.syncPack(true);
    try {
      const raw = localStorage.getItem("gw:crowd-ghost");
      if (raw) this.ghostTape = JSON.parse(raw);
    } catch {
      this.ghostTape = [];
    }
    this.parts = new ParticlePool(80);
    this.synth = (this.game.registry.get("synth") as Synth | undefined) ?? new Synth();
    this.game.registry.set("synth", this.synth);
    this.synth.setSettings(this.platform.audio.getSettings());
    this.cameras.main.setBackgroundColor("#1a0e0a");
    this.gfx = this.add.graphics();
    this.overlay = this.add.graphics().setScrollFactor(0).setDepth(20);
    this.hud = this.add
      .text(16, 64, "", { fontFamily: "ui-sans-serif, system-ui", fontSize: "16px", color: "#ffe0d4" })
      .setScrollFactor(0)
      .setDepth(21);
    this.labels.forEach((t) => t.destroy());
    this.labels = [];
    this.native?.destroy();
    this.native = createGameKeyboard();
    this.game.canvas.tabIndex = 0;
    this.game.canvas.focus({ preventScroll: true });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      this.x = Phaser.Math.Clamp(p.x / this.scale.width, 0.08, 0.92);
    });
    this.input.on("pointerdown", () => this.ensureAudio());
    this.platform.session.start();
    this.started = this.time.now;
    this.platform.events.emit({ name: "gameplay_started", props: { gameId: "crowd-control" } });
  }

  private ensureAudio() {
    if (this.audioReady) return;
    this.audioReady = true;
    void this.synth.resume();
  }

  private syncPack(scatter = false) {
    const n = Math.max(1, Math.min(96, Math.round(this.pack)));
    while (this.members.length < n) {
      this.members.push({
        ox: scatter ? (Math.random() - 0.5) * 0.16 : 0,
        oy: scatter ? (Math.random() - 0.5) * 36 : 0,
        vx: 0,
        vy: 0,
        phase: Math.random() * Math.PI * 2,
      });
    }
    while (this.members.length > n) this.members.pop();
  }

  update(_: number, delta: number) {
    const dt = Math.min(0.033, delta / 1000);
    this.ticks += 1;
    this.longFrames = countLongFrame(delta, this.longFrames);
    if (!this.signaledReady) {
      this.signaledReady = true;
      this.platform.events.emit({ name: "game_ready", props: { gameId: "crowd-control" } });
    }
    const native = this.native?.read();
    if (native?.retryPressed) this.scene.restart();
    if (!this.ended) {
      const steer = Number(Boolean(native?.right)) - Number(Boolean(native?.left));
      if (steer) this.ensureAudio();
      this.x = Phaser.Math.Clamp(this.x + steer * dt * 1.4, 0.08, 0.92);
      const dash = native?.dash ? 1.45 : 1;
      this.z += this.speed * dt * dash;
      this.stepAcc += this.speed * dt * dash;
      if (this.stepAcc > 38) {
        this.stepAcc = 0;
        this.synth.noiseBurst(0.035, 0.018 + Math.min(0.03, this.pack * 0.00035), 180 + this.pack * 1.4);
      }
      if (this.ticks % 3 === 0) this.ghost.push({ z: this.z, x: this.x });
      const seg = this.segs.find((s) => !this.hitSet.has(s.z) && Math.abs(s.z - this.z) < 18);
      if (seg) {
        this.hitSet.add(seg.z);
        this.touch(seg);
      }
      this.flock(dt);
    }
    this.parts.update(dt);
    this.draw();
    this.publishDebug();
  }

  private flock(dt: number) {
    this.syncPack();
    const n = this.members.length;
    const spread = 0.018 + Math.min(0.11, n * 0.0016);
    for (let i = 0; i < n; i += 1) {
      const m = this.members[i];
      let ax = -m.ox * 3.4;
      let ay = -m.oy * 2.6;
      for (let j = 0; j < n; j += 1) {
        if (i === j) continue;
        const o = this.members[j];
        const dx = m.ox - o.ox;
        const dy = (m.oy - o.oy) / 220;
        const d2 = dx * dx + dy * dy;
        if (d2 > 0.0004 && d2 < spread * spread) {
          const inv = 0.012 / d2;
          ax += dx * inv;
          ay += dy * inv * 80;
        }
      }
      m.vx += ax * dt;
      m.vy += ay * dt;
      m.vx *= 0.86;
      m.vy *= 0.86;
      m.ox = Phaser.Math.Clamp(m.ox + m.vx * dt + Math.sin(this.time.now / 180 + m.phase) * 0.0008, -0.22, 0.22);
      m.oy = Phaser.Math.Clamp(m.oy + m.vy * dt + Math.cos(this.time.now / 160 + m.phase) * 0.4, -42, 36);
    }
  }

  private touch(seg: Segment) {
    const side: "left" | "right" = this.x < 0.5 ? "left" : "right";
    this.choices.push({ z: seg.z, side });
    if (seg.type === "gate" || seg.type === "finish") {
      const op = side === "left" ? seg.left : seg.right;
      const before = this.pack;
      this.pack = applyOp(this.pack, op);
      this.syncPack(this.pack > before);
      this.synth.tone(seg.type === "finish" ? 520 : 300 + this.pack, 0.06, "square", 0.04, 0.12);
      void this.platform.achievement.unlock("pack-gate");
      if (op?.kind === "mul" && op.n >= 4) void this.platform.achievement.unlock("x4");
      pulseHaptic(7);
      this.parts.burst(this.scale.width * (0.2 + this.x * 0.6), this.scale.height * 0.78, 10, 0xff7a59, 80, 280);
      if (seg.type === "finish") this.finish();
    } else if (seg.type === "enemy") {
      if ((seg.lane === "left" && side === "left") || (seg.lane === "right" && side === "right")) {
        this.pack = Math.max(0, this.pack - 8);
        this.hit += 1;
        this.syncPack();
        this.synth.impact(0.4);
        this.juice.flash(0.12);
      }
    } else if (seg.type === "shortcut" && side === "left") {
      this.shortcut = true;
      this.speed += 40;
      void this.platform.achievement.unlock("cut-in");
    }
    if (this.pack <= 0) this.finish();
  }

  private finish() {
    if (this.ended) return;
    this.ended = true;
    const score = Math.round(this.pack * 120 + this.z);
    if (this.pack >= 80) void this.platform.achievement.unlock("finish-80");
    try {
      localStorage.setItem("gw:crowd-ghost", JSON.stringify(this.ghost));
    } catch {
      /* noop */
    }
    const ghostSide = this.ghostTape.length ? (this.ghostTape[Math.floor(this.ghostTape.length / 2)].x < 0.5 ? "LEFT" : "RIGHT") : null;
    const mySide = this.x < 0.5 ? "LEFT" : "RIGHT";
    this.synth.finishSting();
    void this.platform.session.end({
      mode: readRunContext().daily ? "daily" : "rush",
      score,
      result: "finish",
      metadata: {
        pack: this.pack,
        route: mySide,
        ghostRoute: ghostSide ?? "",
        shortcut: this.shortcut,
        seed: this.seed,
        attemptDurationMs: Math.round(this.time.now - this.started),
        retryHint: ghostSide ? `YOU TOOK ${mySide} · GHOST TOOK ${ghostSide}` : `Pack ${this.pack}`,
      },
    });
  }

  private labelAt(i: number, x: number, y: number, text: string, color: string) {
    let t = this.labels[i];
    if (!t) {
      t = this.add
        .text(x, y, text, { fontFamily: "ui-sans-serif, system-ui", fontSize: "15px", color, fontStyle: "700" })
        .setOrigin(0.5)
        .setDepth(16);
      this.labels[i] = t;
    }
    t.setPosition(x, y).setText(text).setColor(color).setVisible(true).setAlpha(1);
  }

  private draw() {
    const g = this.gfx;
    const w = this.scale.width;
    const h = this.scale.height;
    g.clear();
    fillBackdrop(
      g,
      w,
      h,
      {
        top: 0x2a140e,
        mid: 0x1c100c,
        bottom: 0x120a08,
        grain: 0.05,
        blobs: [
          { color: 0xff7a59, x: 0.18, y: 0.16, r: 90, alpha: 0.08, parallax: 0.04 },
          { color: 0xffd166, x: 0.82, y: 0.22, r: 70, alpha: 0.06, parallax: 0.05 },
        ],
        bands: [{ color: 0x2a1812, y: 0.58, h: 0.5, alpha: 1, parallax: 0 }],
      },
      { y: this.z },
    );
    g.fillStyle(0x3a2218, 1);
    g.fillRect(w * 0.16, 0, w * 0.68, h);
    const scroll = (this.z * 0.7) % 46;
    g.fillStyle(0x2a1812, 0.55);
    for (let y = -46 + scroll; y < h + 20; y += 46) {
      g.fillRect(w * 0.16, y, w * 0.68, 10);
    }
    g.lineStyle(3, 0xffc38a, 0.18);
    g.lineBetween(w / 2, 0, w / 2, h);
    g.lineStyle(2, 0xff7a59, 0.16);
    g.strokeRect(w * 0.16, 0, w * 0.68, h);

    let labelN = 0;
    for (const t of this.labels) t.setVisible(false);
    for (const s of this.segs) {
      const y = h * 0.75 - (s.z - this.z) * 0.7;
      if (y < -50 || y > h + 50) continue;
      if (s.type === "gate" || s.type === "finish") {
        const leftC = s.type === "finish" ? 0x3d2a12 : 0x4a2c20;
        const rightC = s.type === "finish" ? 0x2a3218 : 0x4a2c20;
        g.fillStyle(leftC, 1);
        g.fillRoundedRect(w * 0.2, y - 20, w * 0.26, 40, 10);
        g.fillStyle(rightC, 1);
        g.fillRoundedRect(w * 0.54, y - 20, w * 0.26, 40, 10);
        g.lineStyle(2, 0xffe0d4, 0.35);
        g.strokeRoundedRect(w * 0.2, y - 20, w * 0.26, 40, 10);
        g.strokeRoundedRect(w * 0.54, y - 20, w * 0.26, 40, 10);
        this.labelAt(labelN, w * 0.33, y, opLabel(s.left), "#ffe8d8");
        labelN += 1;
        this.labelAt(labelN, w * 0.67, y, opLabel(s.right), "#ffe8d8");
        labelN += 1;
      } else if (s.type === "enemy") {
        g.fillStyle(0xff4d6d, 0.95);
        g.fillCircle(s.lane === "left" ? w * 0.33 : w * 0.67, y, 16);
        g.fillStyle(0xffffff, 0.35);
        g.fillCircle(s.lane === "left" ? w * 0.33 : w * 0.67, y - 3, 5);
      } else if (s.type === "shortcut") {
        g.fillStyle(0xffd166, 0.7);
        g.fillRoundedRect(w * 0.18, y - 10, 22, 20, 4);
      }
    }
    const ghost = this.ghostTape.find((p) => p.z >= this.z);
    if (ghost) {
      g.fillStyle(0xffffff, 0.22);
      g.fillCircle(w * 0.2 + ghost.x * w * 0.6, h * 0.72, 10);
    }
    const cx = w * 0.2 + this.x * w * 0.6;
    const cy = h * 0.78;
    for (const m of this.members) {
      const mx = Phaser.Math.Clamp(cx + m.ox * w * 0.6, w * 0.2, w * 0.8);
      const my = cy + m.oy * 0.35;
      g.fillStyle(0xff8a62, 1);
      g.fillCircle(mx, my, 7);
      g.fillStyle(0xffe0d4, 0.35);
      g.fillCircle(mx - 1.4, my - 1.6, 2.2);
    }
    drawParticles(g, this.parts);
    fillVignette(g, w, h, 0.28);
    this.hud.setText(`${this.pack}  pack`);
    this.overlay.clear();
    const fa = this.juice.flashAlpha(0.016);
    if (fa) {
      this.overlay.fillStyle(0xffffff, fa);
      this.overlay.fillRect(0, 0, w, h);
    }
  }

  private publishDebug() {
    publishGwDebug(
      {
        gameId: "crowd-control",
        ready: this.signaledReady,
        runState: this.ended ? "ended" : "playing",
        playerX: this.x,
        playerY: this.z,
        score: this.pack,
        paused: false,
        fps: this.game.loop.actualFps,
        longFrames: this.longFrames,
        tick: this.ticks,
        frozen: false,
      },
      {
        finishRun: () => this.finish(),
        hideHud: () => {
          this.hud.setVisible(false);
          this.labels.forEach((t) => t.setVisible(false));
        },
      },
    );
  }

  shutdown() {
    this.native?.destroy();
    this.labels.forEach((t) => t.destroy());
    this.labels = [];
    clearGwDebug();
  }
}

export function mountCrowdControl(parent: HTMLElement, platform: PlatformSDK) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: Math.max(320, parent.clientWidth || 720),
    height: Math.max(240, parent.clientHeight || 1280),
    backgroundColor: "#1c100c",
    scale: { mode: Phaser.Scale.RESIZE },
    scene: [CrowdScene],
    disableContextMenu: true,
    banner: false,
    autoFocus: true,
    input: { keyboard: { target: typeof window !== "undefined" ? window : undefined }, activePointers: 3 },
    fps: { target: 60 },
    render: { preserveDrawingBuffer: true },
  });
  game.registry.set("platform", platform);
  game.registry.set("manifest", crowdControlManifest);
  (game as Phaser.Game & { restartRun: () => void }).restartRun = () => {
    game.scene.getScene("crowd-play")?.scene.restart();
  };
  game.events.once("destroy", () => {
    (game.registry.get("synth") as Synth | undefined)?.dispose();
    clearGwDebug();
  });
  return game;
}
