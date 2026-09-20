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
  drawMiniPerson,
  drawGateArch,
  fillBackdrop,
  fillVignette,
  type GameKeyboard,
} from "@gamesweb/game-core";
import { crowdControlManifest, readRunContext, type PlatformSDK } from "@gamesweb/game-sdk";
import { applyOp, buildCourse, opLabel, type Segment } from "../systems/course";
import { finishMultiplier, resolveCrowdClash, stepBossFight } from "../systems/combat";
import { LEVELS } from "../levels/levels";

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
  private clash: { t: number; left: number; right: number; lane: number } | null = null;
  private boss: { hp: number; max: number; t: number; dead: number } | null = null;
  private breaks = new Set<number>();
  private payoff = 0;
  private banners: Array<{ text: string; t: number }> = [];
  private levelIndex = 0;
  private viewZoom = 1.62;
  private viewCy = 0.68;

  constructor() {
    super("crowd-play");
  }

  create() {
    this.platform = this.game.registry.get("platform") as PlatformSDK;
    const ctx = readRunContext();
    this.seed = ctx.seed ?? ctx.challengeCode ?? "rush";
    if (ctx.modeIndex !== undefined && Number.isFinite(ctx.modeIndex)) {
      this.levelIndex = Math.abs(ctx.modeIndex) % LEVELS.length;
    } else if (ctx.seed && ctx.seed !== "rush") {
      this.levelIndex = Math.abs([...this.seed].reduce((h, c) => h + c.charCodeAt(0), 0)) % LEVELS.length;
    } else {
      this.levelIndex = Math.abs(Number(this.game.registry.get("levelIndex") ?? 0)) % LEVELS.length;
    }
    this.segs = LEVELS[this.levelIndex] ?? buildCourse(this.seed);
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
    this.clash = null;
    this.boss = null;
    this.breaks = new Set();
    this.payoff = 0;
    this.banners = [];
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
    this.cameras.main.setBackgroundColor("#8ec8e8");
    this.gfx = this.add.graphics();
    this.overlay = this.add.graphics().setScrollFactor(0).setDepth(20);
    this.hud = this.add
      .text(16, 64, "", { fontFamily: "ui-sans-serif, system-ui", fontSize: "16px", color: "#1a3040" })
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
        ox: scatter ? (Math.random() - 0.5) * 0.42 : 0,
        oy: scatter ? (Math.random() - 0.5) * 42 : 0,
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
      if (this.clash) {
        this.clash.t -= dt;
        if (this.clash.t <= 0) this.clash = null;
      }
      if (this.boss && this.boss.dead <= 0) {
        const next = stepBossFight(this.boss, this.pack, dt);
        this.boss.hp = next.hp;
        this.pack = next.pack;
        this.syncPack();
        if (next.dead) {
          this.boss.dead = 0.8;
          this.synth.crash(0.8);
          this.juice.flash(0.25);
          this.banners.push({ text: "GUARDIAN DOWN", t: 1.1 });
        }
      } else if (this.boss) {
        this.boss.dead -= dt;
        if (this.boss.dead <= 0) this.boss = null;
      }
      if (this.payoff > 0) {
        this.payoff -= dt;
        if (this.payoff <= 0) this.finish();
      }
      for (const b of this.banners) b.t -= dt;
      this.banners = this.banners.filter((b) => b.t > 0);
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
      const packSpread = 0.22 + Math.min(0.46, this.pack * 0.005);
      m.ox = Phaser.Math.Clamp(m.ox + m.vx * dt + Math.sin(this.time.now / 180 + m.phase) * 0.0008, -packSpread, packSpread);
      m.oy = Phaser.Math.Clamp(m.oy + m.vy * dt + Math.cos(this.time.now / 160 + m.phase) * 0.4, -58, 48);
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
      if (seg.type === "finish") {
        this.payoff = 1.35;
        this.banners.push({ text: `${this.pack >= 96 ? "96" : this.pack >= 48 ? "48" : this.pack >= 24 ? "24" : "12"}`, t: 1.2 });
      }
    } else if (seg.type === "enemy") {
      if ((seg.lane === "left" && side === "left") || (seg.lane === "right" && side === "right")) {
        const foe = 8 + Math.floor(this.pack * 0.15);
        const clash = resolveCrowdClash(this.pack, foe);
        this.clash = { t: 0.85, left: this.pack, right: foe, lane: side === "left" ? 0 : 1 };
        this.pack = clash.left;
        this.hit += 1;
        this.syncPack();
        this.synth.impact(0.4);
        this.juice.flash(0.12);
        this.banners.push({ text: clash.left > 0 ? "PUSHED THROUGH" : "ROUTE BROKEN", t: 0.7 });
      }
    } else if (seg.type === "shortcut" && side === "left") {
      this.shortcut = true;
      this.speed += 40;
      void this.platform.achievement.unlock("cut-in");
    } else if (seg.type === "boss") {
      this.boss = { hp: 36 + Math.round(this.pack * 0.4), max: 36 + Math.round(this.pack * 0.4), t: 0, dead: 0 };
      this.juice.flash(0.18);
      this.synth.tone(90, 0.16, "sawtooth", 0.05, 0.08);
      this.banners.push({ text: "GUARDIAN", t: 0.9 });
    } else if (seg.type === "break") {
      this.breaks.add(seg.z);
      this.speed += 24;
      this.synth.impact(0.55);
      this.parts.burst(this.scale.width * (0.25 + this.x * 0.5), this.scale.height * 0.72, 16, 0xffc18a, 100, 280);
      this.banners.push({ text: "BREAK", t: 0.55 });
    }
    if (this.pack <= 0) this.finish();
  }

  private qualityMembers() {
    const cap = this.sys.game.device.input.touch ? 56 : 72;
    if (this.members.length <= cap) return this.members;
    const step = Math.ceil(this.members.length / cap);
    return this.members.filter((_, i) => i % step === 0);
  }

  private finish() {
    if (this.ended) return;
    this.ended = true;
    const score = Math.round(this.pack * 120 * finishMultiplier(this.pack) + this.z);
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

  private targetFraming() {
    const pack = this.pack;
    let zoom = pack < 16 ? 1.68 : pack < 28 ? 1.42 : pack < 48 ? 1.2 : pack < 72 ? 1.06 : 0.96;
    if (this.clash) zoom *= 0.94;
    if (this.payoff > 0) zoom = 1.52;
    const cy = this.payoff > 0 ? 0.64 : pack < 20 ? 0.67 : pack < 48 ? 0.7 : 0.73;
    const depth = 1.15 + zoom * 0.7;
    const person = pack < 16 ? 7.4 : pack < 28 ? 5.6 : pack < 48 ? 4.2 : pack < 72 ? 3.3 : 2.9;
    return { zoom, cy, depth, person };
  }

  private framing() {
    const target = this.targetFraming();
    this.viewZoom += (target.zoom - this.viewZoom) * 0.14;
    this.viewCy += (target.cy - this.viewCy) * 0.14;
    return { zoom: this.viewZoom, cy: this.viewCy, depth: target.depth, person: target.person };
  }

  private draw() {
    const g = this.gfx;
    const w = this.scale.width;
    const h = this.scale.height;
    const view = this.framing();
    const depth = view.depth;
    g.clear();
    fillBackdrop(
      g,
      w,
      h,
      {
        top: 0x8ec8e8,
        mid: 0xb8dcf0,
        bottom: 0x7ab86a,
        grain: 0.02,
        blobs: [
          { color: 0xfff4c8, x: 0.2, y: 0.12, r: 90, alpha: 0.28, parallax: 0.03 },
          { color: 0xffffff, x: 0.8, y: 0.18, r: 70, alpha: 0.2, parallax: 0.04 },
        ],
        bands: [{ color: 0x8ec46a, y: 0.62, h: 0.4, alpha: 1, parallax: 0 }],
      },
      { y: this.z },
    );
    g.fillStyle(0xf0c878, 1);
    g.fillRect(0, h * 0.42, w * 0.16, h);
    g.fillRect(w * 0.84, h * 0.42, w * 0.16, h);
    g.fillStyle(0xe8a050, 1);
    for (let i = 0; i < 6; i += 1) {
      g.fillRect(8, h * 0.2 + i * 90 - (this.z * 0.15) % 90, 40, 48);
      g.fillRect(w - 48, h * 0.24 + i * 90 - (this.z * 0.15) % 90, 40, 48);
    }
    g.fillStyle(0xd8d0c4, 1);
    g.fillRect(w * 0.16, 0, w * 0.68, h);
    const scroll = (this.z * 0.7) % 46;
    g.fillStyle(0xc8c0b4, 0.7);
    for (let y = -46 + scroll; y < h + 20; y += 46) {
      g.fillRect(w * 0.16, y, w * 0.68, 8);
    }
    g.fillStyle(0xffffff, 0.35);
    g.fillRect(w / 2 - 3, 0, 6, h);
    g.lineStyle(4, 0xffd166, 0.35);
    g.strokeRect(w * 0.16, 0, w * 0.68, h);

    let labelN = 0;
    for (const t of this.labels) t.setVisible(false);
    for (const s of this.segs) {
      const y = h * (0.58 + view.zoom * 0.06) - (s.z - this.z) * depth;
      if (y < -50 || y > h + 50) continue;
      if (s.type === "gate" || s.type === "finish") {
        const leftC = s.left?.kind === "mul" || s.left?.kind === "add" ? 0x2db36a : 0xe23a4a;
        const rightC = s.right?.kind === "mul" || s.right?.kind === "add" ? 0x2db36a : 0xe23a4a;
        drawGateArch(g, w * 0.18, y - 48, w * 0.28, 78, leftC);
        drawGateArch(g, w * 0.54, y - 48, w * 0.28, 78, rightC);
        if (s.type === "finish") {
          g.fillStyle(0x2a2018, 1);
          g.fillRect(w * 0.4, y - 150, w * 0.2, 150);
          g.fillStyle(0xffd166, 0.85 + (this.payoff > 0 ? 0.15 : 0));
          g.fillRect(w * 0.43, y - 140, w * 0.14, 110);
          g.fillRect(w * 0.38, y - 160, w * 0.24, 18);
          g.fillStyle(0xff8a4a, 0.55);
          g.fillCircle(w * 0.5, y - 170, 16 + Math.min(28, this.pack * 0.15));
        }
        this.labelAt(labelN, w * 0.33, y - 18, opLabel(s.left), "#fff4ea");
        labelN += 1;
        this.labelAt(labelN, w * 0.67, y - 18, opLabel(s.right), "#fff4ea");
        labelN += 1;
      } else if (s.type === "enemy") {
        const n = this.clash && Math.abs(s.z - this.z) < 40 ? Math.max(2, Math.round(this.clash.right * (this.clash.t / 0.85))) : 10;
        for (let i = 0; i < n; i += 1) {
          drawMiniPerson(g, (s.lane === "left" ? w * 0.28 : w * 0.62) + (i % 6) * 9, y + (i % 3) * 7, 0xff4d6d, this.time.now / 120 + i, 1.05);
        }
      } else if (s.type === "boss") {
        const shake = this.boss && this.boss.dead <= 0 ? Math.sin(this.time.now / 40) * 3 : 0;
        g.fillStyle(0x3a1218, 1);
        g.fillRoundedRect(w * 0.34 + shake, y - 70, w * 0.32, 110, 12);
        g.fillStyle(0xff3d5a, 1);
        g.fillRoundedRect(w * 0.37 + shake, y - 52, w * 0.26, 70, 10);
        g.fillStyle(0xffe0d4, 0.85);
        g.fillCircle(w * 0.5 + shake, y - 28, 16);
        if (this.boss) {
          g.fillStyle(0x120c10, 0.85);
          g.fillRect(w * 0.37, y - 78, w * 0.26, 6);
          g.fillStyle(0xffd166, 1);
          g.fillRect(w * 0.37, y - 78, w * 0.26 * Math.max(0, this.boss.hp / this.boss.max), 6);
        }
      } else if (s.type === "break") {
        if (!this.breaks.has(s.z)) {
          g.fillStyle(0x6a4630, 1);
          g.fillRect(w * 0.22, y - 28, w * 0.56, 36);
          g.fillStyle(0x3a2418, 1);
          for (let i = 0; i < 5; i += 1) g.fillRect(w * 0.24 + i * 36, y - 24, 20, 28);
        } else {
          g.fillStyle(0xffc18a, 0.25);
          g.fillRect(w * 0.22, y - 10, w * 0.56, 8);
        }
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
    const cy = h * view.cy;
    const shown = this.qualityMembers();
    const person = view.person;
    const massW = 160 + this.pack * 6.4 * view.zoom;
    const massH = 40 + this.pack * 0.9;
    const crowdPalette = [0xff6a4a, 0xffd166, 0x4ad4e8, 0xff8ad4, 0x7d5fff, 0x3ad48a];
    g.fillStyle(0x2a2018, 0.12 + Math.min(0.22, this.pack * 0.003));
    g.fillEllipse(cx, cy + 22, massW, massH);
    for (const m of shown) {
      const mx = Phaser.Math.Clamp(cx + m.ox * w * (1.55 + this.pack * 0.01), w * 0.1, w * 0.9);
      const my = cy + m.oy * (0.7 + this.pack * 0.005);
      const col = crowdPalette[Math.abs(Math.round(m.phase * 7)) % crowdPalette.length];
      drawMiniPerson(g, mx, my, col, this.time.now / 140 + m.phase, person);
    }
    if (this.pack > shown.length) {
      g.fillStyle(0xff8a62, 0.22);
      g.fillEllipse(cx, cy + 10, 56 + (this.pack - shown.length) * 1.6, 24 + (this.pack - shown.length) * 0.4);
    }
    drawParticles(g, this.parts);
    fillVignette(g, w, h, 0.08);
    this.hud.setText(`PACK  ${this.pack}${this.banners[0] ? `\n${this.banners[0].text}` : ""}`);
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
        contentId: `route-${this.levelIndex}`,
        boss: this.boss ? (this.boss.dead ? "down" : `hp:${Math.ceil(this.boss.hp)}`) : "none",
      },
      {
        finishRun: () => this.finish(),
        setPack: (n: number) => {
          this.pack = Math.max(1, Math.min(96, n));
          this.syncPack(true);
          const snap = this.targetFraming();
          this.viewZoom = snap.zoom;
          this.viewCy = snap.cy;
        },
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

export function mountCrowdControl(parent: HTMLElement, platform: PlatformSDK, levelIndex = 0) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: Math.max(320, parent.clientWidth || 720),
    height: Math.max(240, parent.clientHeight || 1280),
    backgroundColor: "#8ec8e8",
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
  game.registry.set("levelIndex", levelIndex);
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
