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
  fillBackdrop,
  fillVignette,
  type GameKeyboard,
} from "@gamesweb/game-core";
import { crowdControlManifest, readRunContext, type PlatformSDK } from "@gamesweb/game-sdk";
import { applyOp, buildCourse, gateColors, gateFamily, opLabel, type GateOp, type Segment } from "../systems/course";
import { finishMultiplier, resolveCrowdClash, stepBossFight } from "../systems/combat";
import { LEVELS } from "../levels/levels";

type Member = { ox: number; oy: number; vx: number; vy: number; phase: number };
type FloatingPopup = { x: number; y: number; text: string; color: string; t: number; maxT: number };

export class CrowdScene extends Phaser.Scene {
  private platform!: PlatformSDK;
  private juice = new Juice();
  private parts!: ParticlePool;
  private synth!: Synth;
  private gfx!: Phaser.GameObjects.Graphics;
  private overlay!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private dashBtnLabel!: Phaser.GameObjects.Text;
  private labels: Phaser.GameObjects.Text[] = [];
  private popupLabels: Phaser.GameObjects.Text[] = [];
  private popups: FloatingPopup[] = [];
  private native: GameKeyboard | null = null;
  private segs: Segment[] = [];
  private z = 0;
  private x = 0.5;
  private pack = 12;
  private members: Member[] = [];
  private speed = 180;
  private dashTimer = 0;
  private dashCd = 0;
  private lastTapAt = 0;
  private bossPopupAcc = 0;
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
  private paused = false;

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
    this.speed = 180;
    this.dashTimer = 0;
    this.dashCd = 0;
    this.lastTapAt = 0;
    this.bossPopupAcc = 0;
    this.ended = false;
    this.hit = 0;
    this.hitSet = new Set();
    this.shortcut = false;
    this.choices = [];
    this.ghost = [];
    this.members = [];
    this.popups = [];
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
    this.parts = new ParticlePool(140);
    this.synth = (this.game.registry.get("synth") as Synth | undefined) ?? new Synth();
    this.game.registry.set("synth", this.synth);
    this.synth.setSettings(this.platform.audio.getSettings());
    this.cameras.main.setBackgroundColor("#8ec8e8");
    this.gfx = this.add.graphics();
    this.overlay = this.add.graphics().setScrollFactor(0).setDepth(20);
    this.hud = this.add
      .text(18, 62, "", {
        fontFamily: "ui-sans-serif, system-ui",
        fontSize: "16px",
        fontStyle: "800",
        color: "#f8fafc",
        stroke: "#0f172a",
        strokeThickness: 4,
      })
      .setScrollFactor(0)
      .setDepth(21);
    this.dashBtnLabel?.destroy();
    this.dashBtnLabel = this.add
      .text(0, 0, "DASH", {
        fontFamily: "ui-sans-serif, system-ui",
        fontSize: "14px",
        fontStyle: "900",
        color: "#0f172a",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(22);
    this.labels.forEach((t) => t.destroy());
    this.labels = [];
    this.popupLabels.forEach((t) => t.destroy());
    this.popupLabels = [];
    this.native?.destroy();
    this.native = createGameKeyboard();
    this.game.canvas.tabIndex = 0;
    this.game.canvas.focus({ preventScroll: true });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (this.isInsideDashBtn(p.x, p.y)) return;
      this.x = Phaser.Math.Clamp(p.x / this.scale.width, 0.08, 0.92);
    });
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.ensureAudio();
      if (this.isInsideDashBtn(p.x, p.y)) {
        this.triggerDash();
        return;
      }
      const now = this.time.now;
      if (now - this.lastTapAt <= 280) {
        this.triggerDash();
      }
      this.lastTapAt = now;
      this.x = Phaser.Math.Clamp(p.x / this.scale.width, 0.08, 0.92);
    });
    this.game.events.on("platform-pause", () => (this.paused = true));
    this.game.events.on("platform-resume", () => (this.paused = false));
    this.platform.session.start();
    this.started = this.time.now;
    this.platform.events.emit({ name: "gameplay_started", props: { gameId: "crowd-control" } });
  }

  private isInsideDashBtn(px: number, py: number) {
    const w = this.scale.width;
    const h = this.scale.height;
    const bx = w - 124;
    const by = h - 78;
    return px >= bx - 8 && px <= bx + 112 && py >= by - 8 && py <= by + 56;
  }

  private triggerDash() {
    if (this.ended || this.dashCd > 0) return;
    this.dashTimer = 0.65;
    this.dashCd = 2.2;
    this.synth.tone(420, 0.06, "triangle", 0.04, 0.14);
    pulseHaptic(6);
    const cx = this.scale.width * (0.2 + this.x * 0.6);
    const cy = this.scale.height * this.viewCy;
    this.parts.burst(cx, cy + 12, 12, 0x38bdf8, 80, 240);
    this.banners.unshift({ text: "SQUAD DASH!", t: 0.65 });
  }

  private spawnPopup(x: number, y: number, text: string, color: string) {
    this.popups.push({ x, y, text, color, t: 0.95, maxT: 0.95 });
    if (this.popups.length > 10) this.popups.shift();
  }

  private ensureAudio() {
    if (this.audioReady) return;
    this.audioReady = true;
    void this.synth.resume();
  }

  private gateSqueeze() {
    let squeeze = 1;
    for (const s of this.segs) {
      if (s.type !== "gate" && s.type !== "finish") continue;
      const d = s.z - this.z;
      if (d > -40 && d < 92) {
        const t = d > 0 ? 1 - d / 92 : 1 - Math.abs(d) / 40;
        squeeze = Math.min(squeeze, 0.26 + (1 - Math.max(0, t)) * 0.74);
      }
    }
    return squeeze;
  }

  private syncPack(scatter = false) {
    const n = Math.max(1, Math.min(120, Math.round(this.pack)));
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
    if (this.paused) {
      this.draw();
      this.publishDebug();
      return;
    }
    if (!this.ended) {
      if (native?.dashPressed) this.triggerDash();
      this.dashTimer = Math.max(0, this.dashTimer - dt);
      this.dashCd = Math.max(0, this.dashCd - dt);
      const steer = Number(Boolean(native?.right)) - Number(Boolean(native?.left));
      if (steer) this.ensureAudio();
      this.x = Phaser.Math.Clamp(this.x + steer * dt * 1.4, 0.08, 0.92);
      const isDashing = this.dashTimer > 0 || Boolean(native?.dash);
      const dash = isDashing ? 1.45 : 1;
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
        const prevPack = Math.round(this.pack);
        const next = stepBossFight(this.boss, this.pack, dt);
        this.boss.hp = next.hp;
        this.pack = next.pack;
        this.syncPack();
        this.bossPopupAcc += dt;
        if (this.bossPopupAcc >= 0.28) {
          this.bossPopupAcc = 0;
          const lost = Math.max(1, prevPack - Math.round(this.pack));
          this.spawnPopup(
            this.scale.width * 0.5 + (Math.random() - 0.5) * 60,
            this.scale.height * 0.52,
            `-${lost}`,
            "#ff4d6d",
          );
        }
        if (next.dead) {
          this.boss.dead = 0.8;
          this.synth.crash(0.8);
          this.juice.flash(0.25);
          this.parts.burst(this.scale.width * 0.5, this.scale.height * 0.48, 24, 0xffd166, 110, 340);
          this.banners.unshift({ text: "GUARDIAN DOWN", t: 1.1 });
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
    for (const p of this.popups) {
      p.t -= dt;
      p.y -= 52 * dt;
    }
    this.popups = this.popups.filter((p) => p.t > 0);
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
      if (i === 0) {
        // Unit #0 is the Squad Commander leading at the front center
        m.ox += (0 - m.ox) * Math.min(1, dt * 10);
        m.oy += (-20 - m.oy) * Math.min(1, dt * 10);
        continue;
      }
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
      const squeeze = this.gateSqueeze();
      const packSpread = (0.22 + Math.min(0.52, this.pack * 0.0052)) * squeeze;
      m.ox = Phaser.Math.Clamp(m.ox + m.vx * dt + Math.sin(this.time.now / 180 + m.phase) * 0.0008, -packSpread, packSpread);
      m.oy = Phaser.Math.Clamp(m.oy + m.vy * dt + Math.cos(this.time.now / 160 + m.phase) * 0.4, -58 * squeeze, 48 * squeeze);
    }
  }

  private touch(seg: Segment) {
    const side: "left" | "right" = this.x < 0.5 ? "left" : "right";
    this.choices.push({ z: seg.z, side });
    const cx = this.scale.width * (0.2 + this.x * 0.6);
    const cy = this.scale.height * 0.68;
    if (seg.type === "gate" || seg.type === "finish") {
      const op = side === "left" ? seg.left : seg.right;
      const before = Math.round(this.pack);
      this.pack = applyOp(this.pack, op);
      const deltaPack = Math.round(this.pack) - before;
      this.syncPack(this.pack > before);
      this.synth.tone(seg.type === "finish" ? 520 : 300 + this.pack, 0.06, "square", 0.04, 0.12);
      void this.platform.achievement.unlock("pack-gate");
      if (op?.kind === "mul" && op.n >= 4) void this.platform.achievement.unlock("x4");
      pulseHaptic(7);
      // Gate shatter particle burst & floating combat number
      const pal = gateColors(op);
      this.parts.burst(cx, cy - 24, 18, pal.face, 95, 310);
      this.parts.burst(cx, cy - 24, 10, 0xffffff, 70, 220);
      const signStr = deltaPack >= 0 ? `+${deltaPack}` : `${deltaPack}`;
      this.spawnPopup(cx, cy - 36, `${opLabel(op)} (${signStr})`, deltaPack >= 0 ? "#4ade80" : "#fb7185");
      if (seg.type === "finish") {
        this.payoff = 1.35;
        this.banners.unshift({ text: `×${finishMultiplier(this.pack)} BONUS · PACK ${Math.round(this.pack)}`, t: 1.2 });
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
        this.parts.burst(cx, cy - 16, 16, 0xff4d6d, 90, 260);
        this.spawnPopup(cx, cy - 32, `-${clash.loss}`, "#ff4d6d");
        this.banners.unshift({ text: clash.left > 0 ? "PUSHED THROUGH" : "ROUTE BROKEN", t: 0.7 });
      }
    } else if (seg.type === "shortcut") {
      const targetSide = seg.side ?? (seg.lane === "right" ? "right" : "left");
      if (targetSide === side) {
        this.shortcut = true;
        this.speed += 40;
        this.parts.burst(cx, cy, 14, 0xffd166, 80, 240);
        this.spawnPopup(cx, cy - 28, "SHORTCUT BOOST!", "#fde047");
        void this.platform.achievement.unlock("cut-in");
      }
    } else if (seg.type === "boss") {
      this.boss = { hp: 36 + Math.round(this.pack * 0.4), max: 36 + Math.round(this.pack * 0.4), t: 0, dead: 0 };
      this.juice.flash(0.18);
      this.synth.tone(90, 0.16, "sawtooth", 0.05, 0.08);
      this.banners.unshift({ text: "GUARDIAN CLASH", t: 0.9 });
    } else if (seg.type === "break") {
      this.breaks.add(seg.z);
      this.speed += 24;
      this.synth.impact(0.55);
      this.parts.burst(this.scale.width * (0.25 + this.x * 0.5), this.scale.height * 0.72, 16, 0xffc18a, 100, 280);
      this.spawnPopup(cx, cy - 28, "BARRIER SMASH!", "#fdba74");
      this.banners.unshift({ text: "BREAK", t: 0.55 });
    }
    if (this.pack <= 0) this.finish();
  }

  private qualityMembers() {
    const cap = this.sys.game.device.input.touch ? 64 : 88;
    if (this.members.length <= cap) return this.members;
    const step = Math.ceil(this.members.length / cap);
    return this.members.filter((_, i) => i === 0 || i % step === 0);
  }

  private finish() {
    if (this.ended) return;
    this.ended = true;
    const finalPack = Math.max(0, Math.round(this.pack));
    const score = Math.round(finalPack * 120 * finishMultiplier(finalPack) + this.z);
    if (finalPack >= 80) void this.platform.achievement.unlock("finish-80");
    try {
      localStorage.setItem("gw:crowd-ghost", JSON.stringify(this.ghost));
    } catch {
      /* noop */
    }
    const ghostSide = this.ghostTape.length ? (this.ghostTape[Math.floor(this.ghostTape.length / 2)].x < 0.5 ? "LEFT" : "RIGHT") : null;
    const mySide = this.x < 0.5 ? "LEFT" : "RIGHT";
    const bossCleared = this.boss ? this.boss.hp <= 0 : true;
    this.synth.finishSting();
    void this.platform.session.end({
      mode: readRunContext().daily ? "daily" : "rush",
      score,
      result: "finish",
      metadata: {
        pack: finalPack,
        bossCleared,
        route: mySide,
        ghostRoute: ghostSide ?? "",
        shortcut: this.shortcut,
        seed: this.seed,
        attemptDurationMs: Math.round(this.time.now - this.started),
        retryHint: ghostSide ? `YOU TOOK ${mySide} · GHOST TOOK ${ghostSide}` : `Pack ${finalPack}`,
      },
    });
  }

  private labelAt(i: number, x: number, y: number, text: string, color: string, size = 15) {
    let t = this.labels[i];
    if (!t) {
      t = this.add
        .text(x, y, text, {
          fontFamily: "ui-sans-serif, system-ui",
          fontSize: `${size}px`,
          color,
          fontStyle: "900",
          stroke: "#0f172a",
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(16);
      this.labels[i] = t;
    }
    t.setPosition(x, y).setText(text).setColor(color).setFontSize(size).setVisible(this.hud.visible).setAlpha(1);
  }

  private popupLabelAt(i: number) {
    let t = this.popupLabels[i];
    if (!t) {
      t = this.add
        .text(0, 0, "", {
          fontFamily: "ui-sans-serif, system-ui",
          fontSize: "22px",
          fontStyle: "900",
          color: "#ffffff",
          stroke: "#0f172a",
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(24);
      this.popupLabels[i] = t;
    }
    return t;
  }

  private targetFraming() {
    const pack = this.pack;
    let zoom = pack < 16 ? 1.68 : pack < 28 ? 1.42 : pack < 48 ? 1.2 : pack < 80 ? 1.04 : pack < 110 ? 0.92 : 0.84;
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

  private drawGateSign(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, op?: GateOp, shattered = false) {
    const family = gateFamily(op);
    const pal = gateColors(op);
    const tSec = this.time.now / 1000;

    // 3D Metallic Side Emitter Posts & Base Pedestals
    g.fillStyle(0x0f172a, 0.95);
    g.fillRoundedRect(x + 2, y - 6, 14, h + 24, 5);
    g.fillRoundedRect(x + w - 16, y - 6, 14, h + 24, 5);
    g.fillStyle(pal.trim, 1);
    g.fillRect(x + 5, y, 8, h + 14);
    g.fillRect(x + w - 13, y, 8, h + 14);

    if (shattered) {
      // Triggered gate leaves a faint shattered energy frame
      g.lineStyle(2, pal.face, 0.32);
      g.strokeRoundedRect(x + 12, y - 4, w - 24, 72, 8);
      return;
    }

    // Translucent Glass-Neon Holographic Forcefield Panel
    const glowAlpha = 0.28 + Math.sin(tSec * 5) * 0.06;
    g.fillStyle(pal.face, glowAlpha);
    g.fillRoundedRect(x + 12, y - 4, w - 24, 74, 8);
    // Solid vibrant top banner & glowing border
    g.fillStyle(pal.face, 0.86);
    g.fillRoundedRect(x + 12, y - 4, w - 24, 22, 6);
    g.lineStyle(3, pal.face, 0.96);
    g.strokeRoundedRect(x + 12, y - 4, w - 24, 74, 8);

    // Animated Holographic Scanlines across the glass panel
    const scanOffset = (tSec * 36) % 18;
    g.lineStyle(1.5, 0xffffff, 0.28);
    for (let sy = y + 20 + scanOffset; sy < y + 66; sy += 18) {
      g.lineBetween(x + 16, sy, x + w - 16, sy);
    }

    // Specular diagonal glass sheen
    g.fillStyle(0xffffff, family === "tax" ? 0.14 : 0.24);
    g.fillRoundedRect(x + 18, y + 2, w - 36, 10, 4);

    // Corner family emblem
    if (family === "add") {
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(x + 26, y + 8, 5);
    } else if (family === "mul") {
      g.fillStyle(0xfef08a, 0.95);
      g.fillCircle(x + 26, y + 8, 6);
    } else if (family === "tax") {
      g.fillStyle(0xffdde5, 0.9);
      g.fillTriangle(x + 26, y + 2, x + 32, y + 13, x + 20, y + 13);
    }
  }

  private drawSquadUnit(
    g: Phaser.GameObjects.Graphics,
    mx: number,
    my: number,
    col: number,
    phase: number,
    scale: number,
    isCommander: boolean,
  ) {
    // Ground drop shadow
    g.fillStyle(0x0f172a, isCommander ? 0.38 : 0.24);
    g.fillEllipse(mx, my + scale * 1.4, scale * 2.4, scale * 1.1);

    if (isCommander) {
      // Commander Unit #0 Aura Ring & Golden/Cyan Chevron
      const pulse = 1 + Math.sin(this.time.now / 140) * 0.12;
      g.lineStyle(2.5, 0x38bdf8, 0.85);
      g.strokeEllipse(mx, my + scale * 1.2, scale * 3.8 * pulse, scale * 1.8 * pulse);
      drawMiniPerson(g, mx, my, 0xfacc15, phase, scale * 1.28);
      // Shoulder cape / armor trim
      g.fillStyle(0x38bdf8, 0.95);
      g.fillRoundedRect(mx - scale * 1.2, my - scale * 0.3, scale * 2.4, scale * 0.55, 2);
      // Floating Golden Commander Chevron above Unit #0
      const chevY = my - scale * 2.5 + Math.sin(this.time.now / 120) * 2;
      g.fillStyle(0xfacc15, 1);
      g.fillTriangle(mx - 7, chevY - 4, mx + 7, chevY - 4, mx, chevY + 4);
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(mx, my - scale * 1.15, scale * 0.35);
      return;
    }

    drawMiniPerson(g, mx, my, col, phase, scale);
    // Expressive torso belt & head specular highlight
    g.fillStyle(0xffffff, 0.55);
    g.fillCircle(mx - scale * 0.2, my - scale * 0.95, Math.max(1.2, scale * 0.26));
  }

  private drawRouteProgressBar(w: number) {
    const barW = Math.min(320, Math.max(180, w - 48));
    const barX = w * 0.5 - barW * 0.5;
    const barY = 18;
    const barH = 12;
    const finishSeg = this.segs[this.segs.length - 1];
    const finishZ = Math.max(1, finishSeg?.z ?? 900);
    const progress = Phaser.Math.Clamp(this.z / finishZ, 0, 1);

    // Outer dark stadium pill casing
    this.overlay.fillStyle(0x0f172a, 0.86);
    this.overlay.fillRoundedRect(barX - 6, barY - 5, barW + 12, barH + 10, 10);
    this.overlay.lineStyle(2, 0x334155, 0.92);
    this.overlay.strokeRoundedRect(barX - 6, barY - 5, barW + 12, barH + 10, 10);

    // Track background & filled progress bar
    this.overlay.fillStyle(0x1e293b, 0.96);
    this.overlay.fillRoundedRect(barX, barY, barW, barH, 6);
    const fillW = Math.max(8, barW * progress);
    this.overlay.fillStyle(0x38bdf8, 0.96);
    this.overlay.fillRoundedRect(barX, barY, fillW, barH, 6);
    this.overlay.fillStyle(0xffffff, 0.35);
    this.overlay.fillRoundedRect(barX + 2, barY + 2, Math.max(4, fillW - 4), 3, 2);

    // Route landmarks: gates (cyan/green), enemy squads (red), boss/finish (gold)
    const midY = barY + barH * 0.5;
    for (const s of this.segs) {
      const sx = barX + Phaser.Math.Clamp(s.z / finishZ, 0, 1) * barW;
      const passed = this.z >= s.z;
      if (s.type === "gate") {
        this.overlay.fillStyle(passed ? 0x4ade80 : 0x38bdf8, 0.95);
        this.overlay.fillRoundedRect(sx - 2, barY - 2, 4, barH + 4, 2);
      } else if (s.type === "enemy") {
        this.overlay.fillStyle(0x0f172a, 0.92);
        this.overlay.fillCircle(sx, midY, 6);
        this.overlay.fillStyle(passed ? 0x64748b : 0xff4d6d, 1);
        this.overlay.fillCircle(sx, midY, 4.2);
      } else if (s.type === "boss" || s.type === "finish") {
        this.overlay.fillStyle(0x0f172a, 0.95);
        this.overlay.fillCircle(sx, midY, 7.5);
        this.overlay.fillStyle(0xfacc15, 1);
        this.overlay.fillCircle(sx, midY, 5.5);
        this.overlay.fillStyle(s.type === "boss" ? 0xff2a5a : 0xffffff, 0.95);
        this.overlay.fillCircle(sx, midY, 2.4);
      }
    }

    // Current player squad marker puck
    const headX = barX + barW * progress;
    this.overlay.fillStyle(0xffffff, 1);
    this.overlay.fillCircle(headX, midY, 6.2);
    this.overlay.fillStyle(0xfacc15, 1);
    this.overlay.fillCircle(headX, midY, 3.8);
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
        top: 0x1e293b,
        mid: 0x334155,
        bottom: 0x0f172a,
        grain: 0.02,
        blobs: [
          { color: 0x38bdf8, x: 0.2, y: 0.12, r: 110, alpha: 0.2, parallax: 0.03 },
          { color: 0xf472b6, x: 0.8, y: 0.18, r: 90, alpha: 0.16, parallax: 0.04 },
        ],
        bands: [{ color: 0x1e293b, y: 0.62, h: 0.4, alpha: 1, parallax: 0 }],
      },
      { y: this.z },
    );

    // Side Neon Stadium Walls
    g.fillStyle(0x0f172a, 1);
    g.fillRect(0, 0, w * 0.15, h);
    g.fillRect(w * 0.85, 0, w * 0.15, h);
    const facade = (this.z * 0.22) % 110;
    for (let i = 0; i < 9; i += 1) {
      const y = i * 110 - facade;
      g.fillStyle(0x1e293b, 1);
      g.fillRoundedRect(6, y, w * 0.12, 88, 6);
      g.fillRoundedRect(w - w * 0.12 - 6, y + 8, w * 0.12, 88, 6);
      g.fillStyle(0x38bdf8, 0.28);
      g.fillRect(14, y + 16, 12, 8);
      g.fillRect(w - 28, y + 24, 12, 8);
    }

    // Track Deck with 3D Curb Rails & Speed Striping
    g.fillStyle(0x334155, 1);
    g.fillRect(w * 0.16, 0, w * 0.68, h);
    const scroll = (this.z * 0.85) % 48;
    g.fillStyle(0x475569, 0.55);
    for (let y = -48 + scroll; y < h + 20; y += 48) {
      g.fillRect(w * 0.16, y, w * 0.68, 10);
    }
    // Center dashed lane divider
    g.fillStyle(0x94a3b8, 0.35);
    for (let y = -48 + scroll; y < h + 20; y += 48) {
      g.fillRect(w / 2 - 2, y, 4, 26);
    }
    // Neon Side Guardrails
    const railColor = this.dashTimer > 0 ? 0x38bdf8 : 0xfacc15;
    g.fillStyle(railColor, 0.88);
    g.fillRect(w * 0.155, 0, 5, h);
    g.fillRect(w * 0.84 - 1, 0, 5, h);

    let labelN = 0;
    for (const t of this.labels) t.setVisible(false);
    for (const s of this.segs) {
      const y = h * (0.58 + view.zoom * 0.06) - (s.z - this.z) * depth;
      if (y < -80 || y > h + 70) continue;
      if (s.type === "gate" || s.type === "finish") {
        const triggered = this.hitSet.has(s.z);
        this.drawGateSign(g, w * 0.175, y - 108, w * 0.3, 118, s.left, triggered);
        this.drawGateSign(g, w * 0.525, y - 108, w * 0.3, 118, s.right, triggered);
        if (s.type === "finish") {
          g.fillStyle(0x0f172a, 1);
          g.fillRoundedRect(w * 0.4, y - 148, w * 0.2, 140, 8);
          g.fillStyle(0xfacc15, 0.92);
          g.fillRoundedRect(w * 0.425, y - 138, w * 0.15, 106, 6);
          g.fillRoundedRect(w * 0.37, y - 158, w * 0.26, 20, 6);
          g.fillStyle(0x38bdf8, 0.65);
          g.fillCircle(w * 0.5, y - 168, 16 + Math.min(28, this.pack * 0.15));
        }
        if (!triggered) {
          const leftInk = gateColors(s.left).ink;
          const rightInk = gateColors(s.right).ink;
          this.labelAt(labelN, w * 0.325, y - 62, opLabel(s.left), leftInk, 32);
          labelN += 1;
          this.labelAt(labelN, w * 0.675, y - 62, opLabel(s.right), rightInk, 32);
          labelN += 1;
        }
      } else if (s.type === "enemy") {
        const foeCount = 8 + Math.floor(this.pack * 0.15);
        const n = this.clash && Math.abs(s.z - this.z) < 40 ? Math.max(2, Math.round(this.clash.right * (this.clash.t / 0.85))) : Math.min(18, foeCount);
        const ex = s.lane === "left" ? w * 0.28 : w * 0.62;
        g.fillStyle(0xff2a6a, 0.22);
        g.fillEllipse(ex + 22, y + 10, 86, 34);
        for (let i = 0; i < n; i += 1) {
          drawMiniPerson(g, ex + (i % 6) * 9, y + Math.floor(i / 6) * 8, 0xff4d6d, this.time.now / 120 + i, 1.1);
        }
        this.labelAt(labelN, ex + 22, y - 24, `FOE ${foeCount}`, "#fda4af", 15);
        labelN += 1;
      } else if (s.type === "boss") {
        const shake = this.boss && this.boss.dead <= 0 ? Math.sin(this.time.now / 40) * 3 : 0;
        g.fillStyle(0x2a0812, 1);
        g.fillRoundedRect(w * 0.34 + shake, y - 72, w * 0.32, 112, 14);
        g.fillStyle(0xff2a5a, 1);
        g.fillRoundedRect(w * 0.37 + shake, y - 54, w * 0.26, 74, 10);
        g.fillStyle(0xffe0d4, 0.92);
        g.fillCircle(w * 0.5 + shake, y - 28, 16);
        if (this.boss) {
          g.fillStyle(0x0f172a, 0.9);
          g.fillRoundedRect(w * 0.36, y - 84, w * 0.28, 10, 4);
          g.fillStyle(0xfacc15, 1);
          g.fillRoundedRect(w * 0.36, y - 84, w * 0.28 * Math.max(0, this.boss.hp / this.boss.max), 10, 4);
        }
      } else if (s.type === "break") {
        if (!this.breaks.has(s.z)) {
          g.fillStyle(0x7c2d12, 1);
          g.fillRoundedRect(w * 0.22, y - 28, w * 0.56, 36, 6);
          g.fillStyle(0xfbbf24, 0.9);
          for (let i = 0; i < 5; i += 1) g.fillRect(w * 0.24 + i * 38, y - 24, 20, 28);
        } else {
          g.fillStyle(0xffc18a, 0.25);
          g.fillRect(w * 0.22, y - 10, w * 0.56, 8);
        }
      } else if (s.type === "shortcut") {
        const side = s.side ?? (s.lane === "right" ? "right" : "left");
        const sx = side === "right" ? w * 0.72 : w * 0.2;
        g.fillStyle(0xfacc15, 0.85);
        g.fillRoundedRect(sx, y - 16, 46, 32, 6);
        g.fillStyle(0x0f172a, 0.85);
        g.fillTriangle(sx + 23, y - 10, sx + 12, y + 8, sx + 34, y + 8);
      }
    }

    const ghost = this.ghostTape.find((p) => p.z >= this.z);
    if (ghost) {
      g.fillStyle(0x38bdf8, 0.28);
      g.fillCircle(w * 0.2 + ghost.x * w * 0.6, h * 0.72, 11);
    }

    const cx = w * 0.2 + this.x * w * 0.6;
    const cy = h * view.cy;
    const shown = this.qualityMembers();
    const person = view.person;
    const squeeze = this.ended ? 1 : this.gateSqueeze();
    const massW = (160 + this.pack * 6.4 * view.zoom) * (0.42 + squeeze * 0.58);
    const massH = (40 + this.pack * 0.9) * (0.7 + squeeze * 0.3);
    const crowdPalette = [0x38bdf8, 0xfacc15, 0x4ade80, 0xf472b6, 0xa78bfa, 0xfb923c];

    // Pack ground aura
    g.fillStyle(this.dashTimer > 0 ? 0x38bdf8 : 0x0f172a, this.dashTimer > 0 ? 0.24 : 0.22);
    g.fillEllipse(cx, cy + 20, massW, massH);

    // Draw squad members (back-to-front so Commander Unit #0 stands out cleanly)
    const frontUnits: Array<{ x: number; y: number }> = [];
    for (let i = shown.length - 1; i >= 0; i -= 1) {
      const m = shown[i];
      const mx = Phaser.Math.Clamp(cx + m.ox * w * (1.55 + this.pack * 0.01), w * 0.17, w * 0.83);
      const my = cy + m.oy * (0.7 + this.pack * 0.005);
      const col = crowdPalette[Math.abs(Math.round(m.phase * 7)) % crowdPalette.length];
      this.drawSquadUnit(g, mx, my, col, this.time.now / 140 + m.phase, person, i === 0);
      if (i < 8) frontUnits.push({ x: mx, y: my });
    }

    // Mob Control / Count Masters Energy Barrage & Explosive VS Badge on Clashes / Boss
    const activeBossFight = Boolean(this.boss && this.boss.dead <= 0);
    const activeClash = Boolean(this.clash && this.clash.t > 0);
    if ((activeClash || activeBossFight) && frontUnits.length > 0) {
      const targetX = activeBossFight
        ? w * 0.5
        : this.clash!.lane === 0
          ? w * 0.28 + 22
          : w * 0.62 + 22;
      const targetY = activeBossFight ? cy - 82 : cy - 42;
      const tSec = this.time.now / 1000;

      for (let i = 0; i < frontUnits.length; i += 1) {
        const u = frontUnits[i];
        const boltCol = i % 2 === 0 ? 0x38bdf8 : 0xfacc15;
        const spreadX = Math.sin(tSec * 24 + i * 1.7) * 18;
        const spreadY = Math.cos(tSec * 20 + i * 2.1) * 10;
        const tx = targetX + spreadX;
        const ty = targetY + spreadY;
        const prog = (tSec * 9 + i * 0.23) % 1;
        const bx1 = u.x + (tx - u.x) * Math.max(0, prog - 0.28);
        const by1 = u.y - 6 + (ty - (u.y - 6)) * Math.max(0, prog - 0.28);
        const bx2 = u.x + (tx - u.x) * prog;
        const by2 = u.y - 6 + (ty - (u.y - 6)) * prog;

        g.lineStyle(4, boltCol, 0.88);
        g.lineBetween(bx1, by1, bx2, by2);
        g.lineStyle(1.8, 0xffffff, 0.95);
        g.lineBetween(bx1, by1, bx2, by2);

        // Impact spark ring at target
        g.fillStyle(boltCol, 0.85);
        g.fillCircle(tx, ty, 3.5 + (i % 3));
        g.fillStyle(0xffffff, 0.95);
        g.fillCircle(tx, ty, 1.8);
      }

      // Central Explosive VS Clash Badge
      const vsPulse = 1 + Math.sin(tSec * 22) * 0.08;
      const vx = w * 0.5;
      const vy = cy - 92;
      const badgeW = 148 * vsPulse;
      const badgeH = 32 * vsPulse;
      g.fillStyle(0xff2a5a, 0.32);
      g.fillEllipse(vx, vy, badgeW + 26, badgeH + 16);
      g.fillStyle(0x0f172a, 0.92);
      g.fillRoundedRect(vx - badgeW * 0.5, vy - badgeH * 0.5, badgeW, badgeH, 16);
      g.lineStyle(2.5, 0xfacc15, 0.98);
      g.strokeRoundedRect(vx - badgeW * 0.5, vy - badgeH * 0.5, badgeW, badgeH, 16);

      const enemyCount = activeBossFight
        ? Math.max(1, Math.ceil(this.boss!.hp))
        : Math.max(1, Math.round(this.clash!.right * (this.clash!.t / 0.85)));
      this.labelAt(labelN, vx, vy, `${Math.max(1, Math.round(this.pack))}  VS  ${enemyCount}`, "#fde047", 18);
      labelN += 1;
    }

    // Floating Squad Count Pill above Commander
    const badgeY = cy - 46;
    g.fillStyle(0x0f172a, 0.88);
    g.fillRoundedRect(cx - 28, badgeY - 13, 56, 24, 12);
    g.lineStyle(2, 0x38bdf8, 0.95);
    g.strokeRoundedRect(cx - 28, badgeY - 13, 56, 24, 12);
    this.labelAt(labelN, cx, badgeY - 1, `${Math.round(this.pack)}`, "#f8fafc", 15);
    labelN += 1;

    // Update Floating Combat / Gate Popups
    this.popupLabels.forEach((lbl) => lbl.setVisible(false));
    for (let i = 0; i < this.popups.length; i += 1) {
      const p = this.popups[i];
      const lbl = this.popupLabelAt(i);
      lbl
        .setPosition(p.x, p.y)
        .setText(p.text)
        .setColor(p.color)
        .setAlpha(Math.max(0, p.t / p.maxT))
        .setVisible(this.hud.visible);
    }

    drawParticles(g, this.parts);
    fillVignette(g, w, h, 0.08);
    this.hud.setText(
      `PACK  ${Math.round(this.pack)}   ·   ROUTE ${this.levelIndex + 1}/${LEVELS.length}${this.banners[0] ? `\n${this.banners[0].text}` : ""}`,
    );

    this.overlay.clear();
    if (this.hud.visible) {
      this.drawRouteProgressBar(w);

      // Top-left HUD Plate
      this.overlay.fillStyle(0x0f172a, 0.78);
      this.overlay.fillRoundedRect(10, 54, 260, 52, 12);
      this.overlay.lineStyle(2, 0x38bdf8, 0.85);
      this.overlay.strokeRoundedRect(10, 54, 260, 52, 12);

      // Interactive Bottom-Right DASH Pill Button
      const bx = w - 124;
      const by = h - 78;
      const ready = this.dashCd <= 0;
      this.overlay.fillStyle(ready ? 0x38bdf8 : 0x1e293b, ready ? 0.94 : 0.78);
      this.overlay.fillRoundedRect(bx, by, 106, 44, 22);
      this.overlay.lineStyle(2.5, ready ? 0xfacc15 : 0x64748b, 0.95);
      this.overlay.strokeRoundedRect(bx, by, 106, 44, 22);
      this.dashBtnLabel
        .setPosition(bx + 53, by + 22)
        .setText(ready ? "DASH ⚡" : `${this.dashCd.toFixed(1)}s`)
        .setColor(ready ? "#0f172a" : "#94a3b8")
        .setVisible(true);
    } else {
      this.dashBtnLabel.setVisible(false);
    }

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
        score: Math.round(this.pack),
        paused: this.paused,
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
          this.pack = Math.max(1, Math.min(120, n));
          this.syncPack(true);
          const snap = this.targetFraming();
          this.viewZoom = snap.zoom;
          this.viewCy = snap.cy;
          if (n >= 80) {
            this.clash = { t: 0.78, left: n, right: 28, lane: 0 };
            this.spawnPopup(this.scale.width * 0.5, this.scale.height * 0.44, "+24", "#4ade80");
          }
        },
        seekGate: () => {
          const next = this.segs.find((s) => (s.type === "gate" || s.type === "finish") && s.z > this.z + 8);
          if (!next) return;
          this.z = next.z - 72;
          this.x = 0.28;
        },
        hideHud: () => {
          this.hud.setVisible(false);
          this.dashBtnLabel?.setVisible(false);
          this.labels.forEach((t) => t.setVisible(false));
          this.popupLabels.forEach((t) => t.setVisible(false));
        },
      },
    );
  }

  shutdown() {
    this.native?.destroy();
    this.dashBtnLabel?.destroy();
    this.labels.forEach((t) => t.destroy());
    this.labels = [];
    this.popupLabels.forEach((t) => t.destroy());
    this.popupLabels = [];
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
