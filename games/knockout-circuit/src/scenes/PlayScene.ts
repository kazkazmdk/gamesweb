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

type GhostSample = { t: number; x: number; y: number; vx?: number; vy?: number; grounded?: boolean };
type GhostRunner = { name: string; color: number; samples: GhostSample[] };

const RIVAL_SPECS: Array<{ name: string; color: number; targetMs: number; seedOffset: number }> = [
  { name: "BLITZ", color: 0x38bdf8, targetMs: 27000, seedOffset: 11 },
  { name: "VEX", color: 0xf472b6, targetMs: 32000, seedOffset: 29 },
  { name: "NOVA", color: 0xa78bfa, targetMs: 37000, seedOffset: 47 },
  { name: "ECHO", color: 0x34d399, targetMs: 43000, seedOffset: 73 },
];

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
  private checkpointLabel!: Phaser.GameObjects.Text;
  private ghostLabels: Phaser.GameObjects.Text[] = [];
  private nativeKeys: GameKeyboard | null = null;
  private x = 80;
  private y = 600;
  private vx = 0;
  private vy = 0;
  private grounded = false;
  private dash = 0;
  private timeMs = 0;
  private elapsed = 0;
  private running = false;
  private ended = false;
  private dying = 0;
  private hits = 0;
  private falls = 0;
  private checkpointIdx = 0;
  private checkpointBannerTimer = 0;
  private coyoteMs = 0;
  private jumpBufferMs = 0;
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
  private recorder: GhostSample[] = [];
  private ghosts: GhostRunner[] = [];
  private playerTrail: Array<{ x: number; y: number }> = [];
  private usedExpert = false;
  private spawn = { x: 80, y: 600 };
  private rag = { x: 0, y: 0, vx: 0, vy: 0, rot: 0, av: 0 };
  private paused = false;
  private rank = 1;
  private totalRunners = 5;

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
    this.elapsed = 0;
    this.hits = 0;
    this.falls = 0;
    this.checkpointIdx = 0;
    this.checkpointBannerTimer = 0;
    this.dash = 0;
    this.dying = 0;
    this.coyoteMs = 0;
    this.jumpBufferMs = 0;
    this.recorder = [];
    this.playerTrail = [];
    this.usedExpert = false;
    this.parts = new ParticlePool(160);
    this.synth = (this.game.registry.get("synth") as Synth | undefined) ?? new Synth();
    this.game.registry.set("synth", this.synth);
    this.synth.setSettings(this.platform.audio.getSettings());
    this.cameras.main.setBackgroundColor(this.map.theme.sky);
    this.gfx = this.add.graphics();
    this.overlay = this.add.graphics().setScrollFactor(0).setDepth(20);
    this.hud = this.add
      .text(20, 64, "", {
        fontFamily: "ui-sans-serif, system-ui",
        fontSize: "16px",
        fontStyle: "800",
        color: "#fff8ec",
        stroke: "#1c120c",
        strokeThickness: 4,
      })
      .setScrollFactor(0)
      .setDepth(21);
    this.checkpointLabel = this.add
      .text(this.scale.width * 0.5, 58, "CHECKPOINT ✓", {
        fontFamily: "ui-sans-serif, system-ui",
        fontSize: "14px",
        fontStyle: "900",
        color: "#38bdf8",
        stroke: "#091524",
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(22)
      .setVisible(false);
    this.ghostLabels.forEach((lbl) => lbl.destroy());
    this.ghostLabels = [];
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
    this.game.events.on("platform-pause", () => (this.paused = true));
    this.game.events.on("platform-resume", () => (this.paused = false));
    this.platform.events.emit({ name: "gameplay_started", props: { gameId: "knockout-circuit" } });
  }

  private buildRivalSamples(targetMs: number, seedOffset: number): GhostSample[] {
    const finish = this.map.solids.find((s) => s.kind === "finish");
    const endX = finish ? finish.x + 8 : this.map.width - 220;
    const endY = finish ? finish.y + finish.h - 32 : this.spawn.y;
    const walkable = this.map.solids.filter(
      (s) => (s.kind === "solid" || s.kind === "mover" || s.kind === "fall") && s.route !== "expert",
    );
    const hazards = this.map.solids.filter((s) => s.kind === "spinner" || s.kind === "beam" || s.kind === "gate");
    const samples: GhostSample[] = [];
    const stepMs = 80;
    const steps = Math.max(20, Math.ceil(targetMs / stepMs));
    const startX = this.spawn.x + ((seedOffset % 5) - 2) * 6;
    const startY = this.spawn.y;

    let prevX = startX;
    let prevY = startY;
    for (let i = 0; i <= steps; i += 1) {
      const t = Math.min(targetMs, i * stepMs);
      const u = t / targetMs;
      const wobble = Math.sin(u * Math.PI * 6 + seedOffset) * 0.008 * (1 - u);
      const progress = clamp(u + wobble, 0, 1);
      const x = startX + (endX - startX) * progress;

      // Find supporting platform at x, or interpolate between nearest platforms for jump arcs
      let groundY = startY + (endY - startY) * progress;
      let onPlat: Rect | undefined;
      let prevPlat: Rect | undefined;
      let nextPlat: Rect | undefined;
      for (const p of walkable) {
        if (x >= p.x - 10 && x <= p.x + p.w + 10) {
          onPlat = p;
          break;
        }
        if (p.x + p.w < x && (!prevPlat || p.x + p.w > prevPlat.x + prevPlat.w)) {
          prevPlat = p;
        }
        if (p.x > x && (!nextPlat || p.x < nextPlat.x)) {
          nextPlat = p;
        }
      }

      let jumpArc = 0;
      let grounded = true;
      if (onPlat) {
        groundY = onPlat.y - 32;
      } else if (prevPlat && nextPlat) {
        const gapStart = prevPlat.x + prevPlat.w;
        const gapEnd = nextPlat.x;
        const gapU = clamp((x - gapStart) / Math.max(1, gapEnd - gapStart), 0, 1);
        groundY = (prevPlat.y - 32) * (1 - gapU) + (nextPlat.y - 32) * gapU;
        jumpArc = Math.sin(gapU * Math.PI) * 74;
        grounded = false;
      }

      // Also jump over nearby spinners/beams/gates
      for (const h of hazards) {
        const hx = h.x + h.w * 0.5;
        const dist = Math.abs(x - hx);
        if (dist < 85) {
          const hu = 1 - dist / 85;
          const hop = Math.sin(hu * Math.PI * 0.5) * 68;
          if (hop > jumpArc) {
            jumpArc = hop;
            grounded = false;
          }
        }
      }

      const y = groundY - jumpArc;
      const dtSec = stepMs / 1000;
      const vx = i === 0 ? 180 : (x - prevX) / dtSec;
      const vy = i === 0 ? 0 : (y - prevY) / dtSec;
      samples.push({ t, x, y, vx, vy, grounded });
      prevX = x;
      prevY = y;
    }
    return samples;
  }

  private loadGhosts() {
    this.ghosts = [];
    for (const rival of RIVAL_SPECS) {
      this.ghosts.push({
        name: rival.name,
        color: rival.color,
        samples: this.buildRivalSamples(rival.targetMs, rival.seedOffset + this.mapIndex * 17),
      });
    }
    try {
      const raw = localStorage.getItem(`gw:ko-ghost:${this.map.id}`);
      if (raw) {
        const parsed = JSON.parse(raw) as GhostSample[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.ghosts.push({ name: "PB", color: 0xffe08a, samples: parsed });
        }
      }
    } catch {
      /* noop */
    }
    this.totalRunners = 1 + this.ghosts.length;
  }

  private sampleGhostAt(ghost: GhostRunner, tMs: number): GhostSample | null {
    const pts = ghost.samples;
    if (!pts.length) return null;
    if (tMs <= pts[0].t) return pts[0];
    const last = pts[pts.length - 1];
    if (tMs >= last.t) return { ...last, vx: 0, vy: 0, grounded: true };
    let idx = 0;
    for (let i = 0; i < pts.length - 1; i += 1) {
      if (pts[i + 1].t >= tMs) {
        idx = i;
        break;
      }
    }
    const a = pts[idx];
    const b = pts[idx + 1] ?? a;
    const span = Math.max(1, b.t - a.t);
    const u = clamp((tMs - a.t) / span, 0, 1);
    return {
      t: tMs,
      x: a.x + (b.x - a.x) * u,
      y: a.y + (b.y - a.y) * u,
      vx: b.vx ?? ((b.x - a.x) / span) * 1000,
      vy: b.vy ?? ((b.y - a.y) / span) * 1000,
      grounded: a.grounded ?? Math.abs((b.y ?? a.y) - a.y) < 1.5,
    };
  }

  private formatOrdinal(n: number) {
    if (n === 1) return "1ST";
    if (n === 2) return "2ND";
    if (n === 3) return "3RD";
    return `${n}TH`;
  }

  private updateRaceRank() {
    let ahead = 0;
    for (const ghost of this.ghosts) {
      const pose = this.sampleGhostAt(ghost, this.elapsed);
      if (pose && pose.x > this.x + 2) ahead += 1;
    }
    this.rank = 1 + ahead;
    this.totalRunners = 1 + this.ghosts.length;
  }

  update(_: number, delta: number) {
    const rawDt = Math.min(0.033, delta / 1000);
    const dt = rawDt * this.juice.timeScale(this.time.now);
    this.ticks += 1;
    this.longFrames = countLongFrame(delta, this.longFrames);
    if (!this.signaledReady) {
      this.signaledReady = true;
      this.platform.events.emit({ name: "game_ready", props: { gameId: "knockout-circuit" } });
    }
    const native = this.nativeKeys?.read();
    if (native?.retryPressed) this.scene.restart();
    if (this.paused) {
      this.draw();
      this.publishDebug();
      return;
    }
    if (this.checkpointBannerTimer > 0) {
      this.checkpointBannerTimer = Math.max(0, this.checkpointBannerTimer - rawDt);
    }
    if (native?.onePressed) this.switchMap(0);
    if (native?.twoPressed) this.switchMap(1);
    if (native?.threePressed) this.switchMap(2);
    if (this.dying > 0) {
      this.dying -= delta;
      if (!this.juice.isFrozen(this.time.now)) {
        this.rag.vy += 1680 * dt;
        this.rag.x += this.rag.vx * dt;
        this.rag.y += this.rag.vy * dt;
        this.rag.rot += this.rag.av * dt;
      }
      const shaken = this.juice.applyCamera({ x: this.camX, y: this.camY }, this.time.now);
      this.cameras.main.centerOn(shaken.x, shaken.y);
      this.parts.update(dt);
      this.draw();
      if (this.dying <= 0) {
        this.x = this.spawn.x;
        this.y = this.spawn.y;
        this.vx = this.vy = 0;
        this.running = false;
        this.timeMs = 0;
        this.elapsed = 0;
        this.recorder = [];
        this.playerTrail = [];
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
      if (this.grounded) this.coyoteMs = 95;
      else this.coyoteMs = Math.max(0, this.coyoteMs - delta);
      if (jump) this.jumpBufferMs = 115;
      else this.jumpBufferMs = Math.max(0, this.jumpBufferMs - delta);

      this.vx = move * (this.dash > 0 ? 420 : 260);
      if (this.jumpBufferMs > 0 && (this.grounded || this.coyoteMs > 0)) {
        this.vy = -620;
        this.grounded = false;
        this.coyoteMs = 0;
        this.jumpBufferMs = 0;
        this.synth.tone(340, 0.04, "square", 0.03, 0.1);
        this.parts.burst(this.x + 11, this.y + 30, 8, 0xffffff, 45, 160);
      }
      if (dash && this.dash <= 0) {
        this.dash = 180;
        this.juice.cameraPunch(0.55);
        this.synth.noiseBurst(0.08, 0.04, 500);
        this.parts.burst(this.x + 11, this.y + 16, 10, this.map.theme.accent, 80, 220);
      }
      this.dash = Math.max(0, this.dash - delta);
      this.vy += 1680 * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.collide();
      if (this.running) {
        this.timeMs = this.time.now - this.started;
        this.elapsed = this.timeMs;
      }
      if (this.ticks % 2 === 0 && (Math.abs(this.vx) > 20 || Math.abs(this.vy) > 20)) {
        this.playerTrail.push({ x: this.x, y: this.y });
        if (this.playerTrail.length > 7) this.playerTrail.shift();
      }
      if (this.ticks % 4 === 0) {
        this.recorder.push({ t: this.timeMs, x: this.x, y: this.y, vx: this.vx, vy: this.vy, grounded: this.grounded });
      }
      // Track checkpoint/gate progression
      let passedGates = 0;
      for (const s of this.map.solids) {
        if ((s.kind === "gate" || s.kind === "mover" || s.kind === "spinner") && this.x > s.x + s.w) {
          passedGates += 1;
        }
      }
      if (passedGates > this.checkpointIdx) {
        this.checkpointIdx = passedGates;
        this.checkpointBannerTimer = 1.35;
        this.parts.burst(this.x + 11, this.y - 6, 16, 0x38bdf8, 95, 360);
        this.synth.tone(580, 0.05, "triangle", 0.03, 0.12);
      }
      this.updateRaceRank();
      const finish = this.map.solids.find((s) => s.kind === "finish");
      if (finish && aabb(this.x, this.y, 22, 32, finish.x, finish.y, finish.w, finish.h)) this.win();
      if (this.y > this.map.height + 40) this.die();
    }
    this.camX += (this.x - this.camX) * (1 - Math.exp(-dt * 6));
    this.camY += (this.y - 40 - this.camY) * (1 - Math.exp(-dt * 4));
    this.camX = clamp(this.camX, this.scale.width / 2, Math.max(this.scale.width / 2, this.map.width - this.scale.width / 2));
    this.camY = clamp(this.camY, this.scale.height / 2, Math.max(this.scale.height / 2, this.map.height - this.scale.height / 2));
    const shaken = this.juice.applyCamera({ x: this.camX, y: this.camY }, this.time.now);
    this.cameras.main.centerOn(shaken.x, shaken.y);
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
    this.falls += 1;
    this.dying = 520;
    this.rag = { x: this.x, y: this.y, vx: this.vx * 0.35 + (Math.random() - 0.5) * 140, vy: -340, rot: 0, av: 9 + Math.random() * 6 };
    this.parts.burst(this.x + 11, this.y + 12, 18, this.map.theme.danger, 140, 380);
    this.synth.impact(0.6);
    this.juice.screenShake(0.35, 110);
    this.juice.hitStop(35);
    this.juice.flash(0.2);
    if (this.running) {
      void this.platform.session.end({
        mode: this.map.id,
        score: Math.floor(this.timeMs),
        result: "attempt-death",
        metadata: {
          competitive: false,
          hideResult: true,
          falls: this.falls,
          gates: this.checkpointIdx,
          attemptDurationMs: Math.floor(this.timeMs),
        },
      });
    }
  }

  private win() {
    if (this.ended) return;
    this.ended = true;
    this.synth.finishSting();
    this.juice.flash(0.32);
    this.juice.cameraPunch(0.75);
    this.juice.slowMo(0.35, 320);
    pulseHaptic([8, 20, 8]);
    // Multi-color confetti burst at finish arch!
    const confettiColors = [0x38bdf8, 0xf472b6, 0xffe08a, 0x34d399, 0xa78bfa];
    for (let i = 0; i < confettiColors.length; i += 1) {
      this.parts.burst(this.x + 11, this.y - 8, 12, confettiColors[i], 120, 420);
    }
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
        falls: this.falls,
        gates: this.checkpointIdx,
        rank: this.rank,
        expert: this.usedExpert,
        attemptDurationMs: Math.floor(this.timeMs),
        retryHint: `${this.formatOrdinal(this.rank)} / ${this.totalRunners} · ${this.map.name} ${(this.timeMs / 1000).toFixed(2)}s`,
      },
    });
  }

  private switchMap(i: number) {
    this.game.registry.set("mapIndex", i);
    this.scene.restart();
  }

  private ensureGhostLabel(idx: number) {
    let lbl = this.ghostLabels[idx];
    if (!lbl) {
      lbl = this.add
        .text(0, 0, "", {
          fontFamily: "ui-sans-serif, system-ui",
          fontSize: "11px",
          fontStyle: "800",
          color: "#ffffff",
        })
        .setOrigin(0.5, 0.5)
        .setDepth(15);
      this.ghostLabels[idx] = lbl;
    }
    return lbl;
  }

  private drawCapsuleBean(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    color: number,
    opts: { facing: 1 | -1; grounded: boolean; vx: number; vy: number; t: number; dying?: boolean; lean?: number; isPlayer?: boolean },
  ) {
    // Base runner legs/capsule
    drawRunner(g, x, y, 22, 32, { ...opts, color });
    if (opts.dying) return;
    // Expressive Fall-Guys style glossy visor face & headband crown
    const cx = x + 11;
    const cy = y + 11;
    const dir = opts.facing;
    // Headband / ear-muff trim
    g.fillStyle(mixColor(color, 0xffffff, 0.45), 0.95);
    g.fillRoundedRect(cx - 10, y + 3, 20, 4, 2);
    // Faceplate visor
    g.fillStyle(0x181824, 0.92);
    g.fillRoundedRect(cx - 6 + dir * 2, cy - 4, 12, 8, 4);
    // Expressive pill eyes inside visor
    g.fillStyle(0xffffff, 0.96);
    g.fillCircle(cx - 2 + dir * 2.5, cy - 0.5, 1.8);
    g.fillCircle(cx + 3 + dir * 2.5, cy - 0.5, 1.8);
    if (opts.isPlayer) {
      // Golden contender crown badge above player bean
      g.fillStyle(0xffe066, 0.96);
      g.fillTriangle(cx - 6, y - 2, cx - 4, y - 9, cx - 1, y - 4);
      g.fillTriangle(cx - 2, y - 2, cx, y - 11, cx + 2, y - 2);
      g.fillTriangle(cx + 1, y - 4, cx + 4, y - 9, cx + 6, y - 2);
    }
  }

  private drawPlace(g: Phaser.GameObjects.Graphics, th: MapDef["theme"]) {
    const env = this.map.env;
    const t = this.time.now / 1000;
    // Distant TV Game Show Towers & Blimps
    g.fillStyle(mixColor(th.sky, 0xfff0c8, 0.18), 1);
    for (let i = 0; i < 8; i += 1) {
      const x = i * 380 + this.camX * 0.16;
      g.fillRoundedRect(x, this.map.height * 0.22, 92, this.map.height * 0.28, 12);
      g.fillStyle(0xffffff, 0.18);
      g.fillRoundedRect(x + 10, this.map.height * 0.24, 18, this.map.height * 0.22, 6);
      g.fillStyle(mixColor(th.sky, 0xfff0c8, 0.18), 1);
    }
    // Overhead Broadcast Scoreboard Gantries
    for (let i = 0; i < 6; i += 1) {
      const gx = i * 520 + this.camX * 0.06;
      g.fillStyle(0xff6b4a, 0.92);
      g.fillRoundedRect(gx, this.map.height * 0.1, 184, 30, 8);
      g.fillStyle(0x1f1924, 0.9);
      g.fillRoundedRect(gx + 10, this.map.height * 0.108, 164, 16, 4);
      g.fillStyle(0xffe08a, 0.95);
      g.fillRoundedRect(gx + 16, this.map.height * 0.113, 152, 8, 3);
    }
    // Cheering Stadium Bleachers
    const crowd = [0xff6b4a, 0x38bdf8, 0xffd166, 0xf472b6, 0xa78bfa, 0x34d399];
    for (let i = 0; i < 18; i += 1) {
      const x = 40 + i * 150 + this.camX * 0.08;
      g.fillStyle(0x2a1f2d, 0.22);
      g.fillRoundedRect(x - 2, this.map.height * 0.16 + 4, 74, 38, 8);
      g.fillStyle(0xffe08a, 0.95);
      g.fillRoundedRect(x, this.map.height * 0.16, 70, 36, 7);
      for (let j = 0; j < 4; j += 1) {
        const hop = Math.abs(Math.sin(t * 5 + i * 0.7 + j * 1.1)) * 4;
        g.fillStyle(crowd[(i + j) % crowd.length], 1);
        g.fillCircle(x + 12 + j * 14, this.map.height * 0.172 - hop, 6.2);
      }
    }
    // 3D Abyss Grid & Elimination Slime/Laser Pit at the bottom
    const abyssY = this.map.height - 56;
    g.fillStyle(0x181122, 0.96);
    g.fillRect(0, abyssY, this.map.width, 56);
    // Perspective Abyss Grid lines
    g.lineStyle(1.5, th.danger, 0.34);
    for (let row = 1; row <= 3; row += 1) {
      const ry = abyssY + row * 13;
      g.lineBetween(0, ry, this.map.width, ry);
    }
    const gridScroll = (t * 48) % 44;
    for (let gx = -44 + gridScroll; gx < this.map.width; gx += 44) {
      g.lineBetween(gx, abyssY, gx - 18, this.map.height);
    }
    // Glowing top laser rim & hazard saw-teeth
    g.fillStyle(th.danger, 0.85);
    g.fillRect(0, abyssY, this.map.width, 4);
    for (let i = 0; i < this.map.width; i += 28) {
      g.fillTriangle(i, abyssY, i + 14, abyssY, i + 7, abyssY - 12);
    }
    if (env === "factory") {
      for (let i = 0; i < 7; i += 1) {
        const x = 90 + i * 380;
        drawLamp(g, x, this.map.height * 0.4, 64, 0xffe08a, 0xff8a4a);
        if (i % 2 === 0) drawContainer(g, x + 40, this.map.height - 96, 48, 30, i % 4 === 0 ? 0xff6b4a : 0x4ad4e8);
      }
    } else if (env === "skyworks") {
      g.fillStyle(0xfff4c8, 0.85);
      g.fillCircle(this.map.width * 0.72, 84, 56);
    }
  }

  private drawPlatform3D(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    topColor: number,
    route?: Rect["route"],
    kind: Rect["kind"] = "solid",
    t = 0,
  ) {
    const extrude = 10;
    const sideDark = mixColor(topColor, 0x160d1e, 0.46);
    const lipDark = mixColor(topColor, 0x09050d, 0.62);
    // Drop shadow into abyss
    g.fillStyle(0x000000, 0.18);
    g.fillRoundedRect(x + 4, y + 6, w, h + extrude, 10);
    // 3D Bottom bevel extrusion
    g.fillStyle(lipDark, 1);
    g.fillRoundedRect(x, y + 4, w, h + extrude, 10);
    // 3D Mid bevel band
    g.fillStyle(sideDark, 1);
    g.fillRoundedRect(x, y + 2, w, h + extrude - 4, 9);
    // Top padded deck
    g.fillStyle(topColor, 1);
    g.fillRoundedRect(x, y, w, h, 8);
    // Specular highlight strip along top lip
    g.fillStyle(0xffffff, 0.48);
    g.fillRoundedRect(x + 6, y + 3, Math.max(8, w - 12), 6, 3);

    if (kind === "mover") {
      // Animated chevron conveyor belt on moving platforms
      g.fillStyle(0x1f1924, 0.72);
      g.fillRoundedRect(x + 10, y + 5, Math.max(12, w - 20), h - 8, 4);
      const scroll = (t * 60) % 24;
      g.lineStyle(2.5, 0xffe066, 0.92);
      for (let cx = x + 16 + scroll; cx < x + w - 16; cx += 24) {
        g.lineBetween(cx - 5, y + 7, cx + 2, y + h * 0.5);
        g.lineBetween(cx + 2, y + h * 0.5, cx - 5, y + h - 5);
      }
    } else if (route === "fast") {
      // Speed route forward chevrons
      g.lineStyle(2, 0xffffff, 0.65);
      for (let cx = x + 22; cx < x + w - 18; cx += 32) {
        g.lineBetween(cx - 4, y + 6, cx + 3, y + h * 0.5);
        g.lineBetween(cx + 3, y + h * 0.5, cx - 4, y + h - 6);
      }
    } else if (route === "expert") {
      // High-risk hazard corner badges
      g.fillStyle(0xffe066, 0.9);
      for (let sx = x + 12; sx < x + w - 18; sx += 28) {
        g.fillRect(sx, y + h - 5, 12, 3);
      }
    } else {
      // Rivet accents on standard platforms
      g.fillStyle(this.map.theme.accent, 0.75);
      g.fillRoundedRect(x + 8, y + 4, 14, 5, 2);
      if (w > 80) g.fillRoundedRect(x + w - 22, y + 4, 14, 5, 2);
    }
  }

  private drawRaceProgressBar() {
    const o = this.overlay;
    const w = this.scale.width;
    const barW = Math.min(340, w - 32);
    const barH = 22;
    const barX = w * 0.5 - barW * 0.5;
    const barY = 18;
    const th = this.map.theme;

    o.fillStyle(0x161020, 0.82);
    o.fillRoundedRect(barX, barY, barW, barH, 11);
    o.lineStyle(1.8, this.rank === 1 ? 0xffe066 : th.accent, 0.92);
    o.strokeRoundedRect(barX, barY, barW, barH, 11);

    const trackLeft = barX + 14;
    const trackRight = barX + barW - 24;
    const trackSpan = Math.max(1, trackRight - trackLeft);
    const midY = barY + barH * 0.5;

    const finish = this.map.solids.find((s) => s.kind === "finish");
    const finishX = finish ? finish.x : this.map.width - 220;
    const spanX = Math.max(1, finishX - this.spawn.x);
    const norm = (rx: number) => clamp((rx - this.spawn.x) / spanX, 0, 1);
    const playerU = norm(this.x);

    // Base track groove & player progress fill
    o.fillStyle(0xffffff, 0.14);
    o.fillRoundedRect(trackLeft, midY - 2, trackSpan, 4, 2);
    o.fillStyle(this.rank === 1 ? 0xffe066 : th.accent, 0.55);
    o.fillRoundedRect(trackLeft, midY - 2, Math.max(4, trackSpan * playerU), 4, 2);

    // Checkpoint tick marks along the progress track
    for (const s of this.map.solids) {
      if (s.kind === "gate" || s.kind === "mover" || s.kind === "spinner") {
        const cu = norm(s.x + s.w * 0.5);
        const cx = trackLeft + cu * trackSpan;
        const passed = this.x > s.x + s.w;
        o.fillStyle(passed ? 0x38bdf8 : 0xffffff, passed ? 0.95 : 0.35);
        o.fillRect(cx - 1, midY - 4, 2, 8);
      }
    }

    // Checkered finish flag icon on the right
    const flagX = trackRight + 6;
    const flagY = barY + 5;
    o.fillStyle(0xffe08a, 0.95);
    o.fillRect(flagX - 2, flagY, 1.8, 12);
    for (let r = 0; r < 2; r += 1) {
      for (let c = 0; c < 3; c += 1) {
        o.fillStyle((r + c) % 2 === 0 ? 0xffffff : 0x111118, 0.95);
        o.fillRect(flagX + c * 3, flagY + r * 3.5, 3, 3.5);
      }
    }

    // Rivals (BLITZ, VEX, NOVA, ECHO) + PB ghost pips
    for (const ghost of this.ghosts) {
      const pose = this.sampleGhostAt(ghost, this.elapsed);
      if (!pose) continue;
      const gu = norm(pose.x);
      const gx = trackLeft + gu * trackSpan;
      const isPb = ghost.name === "PB";
      o.fillStyle(0x14101c, 0.9);
      o.fillCircle(gx, midY, isPb ? 4.8 : 5.5);
      o.fillStyle(ghost.color, isPb ? 0.78 : 0.96);
      o.fillCircle(gx, midY, isPb ? 3.4 : 4.2);
      o.fillStyle(0xffffff, 0.55);
      o.fillCircle(gx - 1, midY - 1, 1.2);
    }

    // Player cursor (YOU in gold #ffe066, larger + mini-crown when 1st)
    const px = trackLeft + playerU * trackSpan;
    o.fillStyle(0x14101c, 0.95);
    o.fillCircle(px, midY, 7.2);
    o.fillStyle(0xffe066, 1);
    o.fillCircle(px, midY, 5.6);
    o.fillStyle(th.accent, 0.95);
    o.fillCircle(px, midY, 2.5);
    if (this.rank === 1) {
      o.fillStyle(0xffe066, 0.98);
      o.fillTriangle(px - 5, midY - 6, px - 3.5, midY - 11, px - 1, midY - 7);
      o.fillTriangle(px - 2, midY - 6, px, midY - 12.5, px + 2, midY - 6);
      o.fillTriangle(px + 1, midY - 7, px + 3.5, midY - 11, px + 5, midY - 6);
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
          { color: 0xfff4c8, x: 0.22, y: 0.16, r: 140, alpha: 0.38, parallax: 0.03 },
          { color: 0xff8a4a, x: 0.78, y: 0.12, r: 90, alpha: 0.14, parallax: 0.04 },
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
        // Sweeping danger radius & motion-blur arc trail
        g.lineStyle(3, th.danger, 0.25);
        g.strokeCircle(cx, cy, 56);
        g.lineStyle(10, th.danger, 0.22);
        g.beginPath();
        g.arc(cx, cy, 46, a - 1.15, a, false);
        g.strokePath();
        g.lineStyle(5, 0xffe08a, 0.38);
        g.beginPath();
        g.arc(cx, cy, 46, a - 0.65, a, false);
        g.strokePath();
        // Pedestal & 3D hub
        g.fillStyle(0x2a1f2d, 0.85);
        g.fillRoundedRect(cx - 12, cy + 14, 24, 42, 6);
        g.fillStyle(0xff8a4a, 1);
        g.fillRoundedRect(cx - 9, cy + 16, 18, 38, 4);
        g.fillStyle(0x1f1924, 1);
        g.fillCircle(cx, cy + 3, 20);
        g.fillStyle(0xffd166, 1);
        g.fillCircle(cx, cy, 18);
        g.save();
        g.translateCanvas(cx, cy);
        g.rotateCanvas(a);
        if (s.prop === "hammer") {
          g.fillStyle(0x9d174d, 1);
          g.fillRoundedRect(-18, -14, 36, 122, 14);
          g.fillStyle(0xff8ad4, 1);
          g.fillRoundedRect(-18, -18, 36, 120, 14);
          g.fillStyle(0xb45309, 1);
          g.fillRoundedRect(-52, 82, 104, 48, 16);
          g.fillStyle(0xffd166, 1);
          g.fillRoundedRect(-52, 78, 104, 48, 16);
          g.fillStyle(0xffffff, 0.45);
          g.fillRoundedRect(-44, 84, 44, 14, 7);
        } else if (s.prop === "disc") {
          g.fillStyle(0x0369a1, 1);
          g.fillCircle(0, 4, 62);
          g.fillStyle(0x4ad4e8, 1);
          g.fillCircle(0, 0, 62);
          g.lineStyle(4, 0xffffff, 0.45);
          g.strokeCircle(0, 0, 48);
          g.fillStyle(0xffffff, 0.35);
          g.fillCircle(-16, -14, 16);
          g.fillStyle(0xffd166, 1);
          g.fillCircle(0, 0, 18);
        } else {
          g.fillStyle(0x881337, 0.95);
          g.fillRoundedRect(-56, -4, 112, 16, 8);
          g.fillRoundedRect(-8, -52, 16, 112, 8);
          g.fillStyle(th.danger, 0.98);
          g.fillRoundedRect(-56, -8, 112, 16, 8);
          g.fillRoundedRect(-8, -56, 16, 112, 8);
          g.fillStyle(0xffe08a, 0.65);
          g.fillRect(-48, -4, 20, 8);
          g.fillRect(28, -4, 20, 8);
        }
        g.fillStyle(0xffffff, 0.9);
        g.fillCircle(0, 0, 6);
        g.restore();
        continue;
      }
      if (s.kind === "beam") {
        const pulse = 0.55 + Math.sin(t * 9 + (s.phase ?? 0)) * 0.3;
        g.fillStyle(0x1f1924, 1);
        g.fillRoundedRect(live.x - 12, live.y - 10, 18, live.h + 20, 5);
        g.fillRoundedRect(live.x + live.w - 6, live.y - 10, 18, live.h + 20, 5);
        g.fillStyle(th.danger, pulse * 0.45);
        g.fillRect(live.x, live.y + live.h / 2 - 8, live.w, 16);
        g.fillStyle(th.danger, pulse);
        g.fillRect(live.x, live.y + live.h / 2 - 4, live.w, 8);
        g.fillStyle(0xffffff, 0.85);
        g.fillRect(live.x, live.y + live.h / 2 - 1.5, live.w, 3);
        continue;
      }
      if (s.kind === "spike") {
        g.fillStyle(th.danger, 1);
        g.fillTriangle(live.x, live.y + live.h, live.x + live.w / 2, live.y, live.x + live.w, live.y + live.h);
        continue;
      }
      if (s.kind === "finish") {
        // Glowing Holographic Finish Arch & Checkered Pylons
        const archW = 68;
        const archX = live.x - 16;
        // Holographic energy curtain
        const holoAlpha = 0.22 + Math.sin(t * 5) * 0.08;
        g.fillStyle(0x38bdf8, holoAlpha);
        g.fillRect(archX + 10, live.y + 24, archW - 20, live.h - 24);
        g.lineStyle(2, 0xffe08a, 0.45);
        for (let sy = live.y + 36 + ((t * 40) % 28); sy < live.y + live.h; sy += 28) {
          g.lineBetween(archX + 12, sy, archX + archW - 12, sy);
        }
        // Left & Right 3D Pylons
        g.fillStyle(0x1f1924, 1);
        g.fillRoundedRect(archX, live.y, 14, live.h, 5);
        g.fillRoundedRect(archX + archW - 14, live.y, 14, live.h, 5);
        g.fillStyle(0x38bdf8, 0.85);
        g.fillRect(archX + 4, live.y + 28, 6, live.h - 34);
        g.fillRect(archX + archW - 10, live.y + 28, 6, live.h - 34);
        // Overhead Checkered Arch Header
        g.fillStyle(0x1f1924, 1);
        g.fillRoundedRect(archX - 8, live.y - 10, archW + 16, 34, 10);
        g.fillStyle(0xffe08a, 1);
        g.fillRoundedRect(archX - 4, live.y - 6, archW + 8, 26, 8);
        for (let i = 0; i < 8; i += 1) {
          g.fillStyle(i % 2 === 0 ? 0x111118 : 0xffffff, 1);
          g.fillRect(archX + i * 8, live.y - 2, 8, 9);
          g.fillStyle(i % 2 === 1 ? 0x111118 : 0xffffff, 1);
          g.fillRect(archX + i * 8, live.y + 7, 8, 9);
        }
        // Floating Crown Emblem atop Finish Arch
        const crownY = live.y - 22 + Math.sin(t * 4) * 3;
        g.fillStyle(0xffe066, 0.98);
        g.fillCircle(archX + archW * 0.5, crownY, 12);
        g.fillStyle(0xff6b4a, 1);
        g.fillCircle(archX + archW * 0.5, crownY, 6);
        continue;
      }
      if (s.kind === "gate") {
        if (s.prop === "inflate") {
          g.fillStyle(0x0284c7, 1);
          g.fillRoundedRect(live.x - 22, live.y - 4, 28, live.h + 16, 14);
          g.fillRoundedRect(live.x + live.w - 6, live.y - 4, 28, live.h + 16, 14);
          g.fillStyle(0x4ad4e8, 1);
          g.fillRoundedRect(live.x - 22, live.y - 8, 28, live.h + 16, 14);
          g.fillRoundedRect(live.x + live.w - 6, live.y - 8, 28, live.h + 16, 14);
          g.fillStyle(0xff8ad4, 1);
          g.fillRoundedRect(live.x - 28, live.y - 36, live.w + 56, 42, 18);
          g.fillStyle(0xffffff, 0.42);
          g.fillRoundedRect(live.x - 16, live.y - 26, live.w + 32, 14, 8);
        } else {
          g.fillStyle(0xc2410c, 1);
          g.fillRoundedRect(live.x - 10, live.y + 4, 12, live.h, 6);
          g.fillRoundedRect(live.x + live.w - 2, live.y + 4, 12, live.h, 6);
          g.fillStyle(0xff8a4a, 1);
          g.fillRoundedRect(live.x - 10, live.y, 12, live.h, 6);
          g.fillRoundedRect(live.x + live.w - 2, live.y, 12, live.h, 6);
          g.fillStyle(0x38bdf8, 0.34 + Math.sin(t * 4) * 0.1);
          g.fillRect(live.x, live.y, live.w, live.h);
        }
        continue;
      }
      if (s.kind === "mover") {
        g.fillStyle(0x2a2a38, 0.9);
        g.fillRoundedRect(s.x - 74, live.y + live.h / 2 - 3, s.w + 148, 6, 3);
        this.drawPlatform3D(g, live.x, live.y, live.w, live.h, th.ground, s.route, "mover", t);
        continue;
      }
      if (s.kind === "fall") {
        const dropColor = mixColor(th.ground, th.danger, 0.35);
        this.drawPlatform3D(g, live.x, live.y, live.w, live.h, dropColor, s.route, "fall", t);
        g.lineStyle(2, th.danger, 0.75);
        g.lineBetween(live.x + 8, live.y + 4, live.x + live.w - 8, live.y + live.h - 4);
        continue;
      }
      const platColor =
        s.route === "expert"
          ? 0xff7a3a
          : s.route === "fast"
            ? mixColor(th.ground, 0x34d399, 0.38)
            : th.ground;
      this.drawPlatform3D(g, live.x, live.y, live.w, live.h, platColor, s.route, "solid", t);
    }

    // Luminous Checkpoint Beacons on course gates/obstacles
    for (const s of this.map.solids) {
      if (s.kind === "gate" || s.kind === "mover" || s.kind === "spinner") {
        const passed = this.x > s.x + s.w;
        const bx = s.x + s.w + 8;
        const by = s.y - 18;
        g.fillStyle(0x1f1924, 0.9);
        g.fillRect(bx - 1.5, by - 14, 3, 18);
        g.fillStyle(passed ? 0x38bdf8 : 0xffffff, passed ? 0.95 : 0.35);
        g.fillTriangle(bx + 1.5, by - 14, bx + 14, by - 9, bx + 1.5, by - 4);
        if (passed) {
          g.fillStyle(0x38bdf8, 0.28 + Math.sin(t * 7) * 0.1);
          g.fillCircle(bx + 4, by - 9, 10);
        }
      }
    }

    // Draw Pace-Rival & PB Ghosts with motion trails & floating namepills
    this.ghostLabels.forEach((lbl) => lbl.setVisible(false));
    for (let gi = 0; gi < this.ghosts.length; gi += 1) {
      const ghost = this.ghosts[gi];
      const pose = this.sampleGhostAt(ghost, this.elapsed);
      if (!pose) continue;
      // Motion trail behind rival
      for (let ti = 1; ti <= 3; ti += 1) {
        const trailPose = this.sampleGhostAt(ghost, Math.max(0, this.elapsed - ti * 65));
        if (trailPose) {
          g.fillStyle(ghost.color, 0.24 - ti * 0.06);
          g.fillCircle(trailPose.x + 11, trailPose.y + 18, 9 - ti * 1.5);
        }
      }
      this.drawCapsuleBean(g, pose.x, pose.y, ghost.color, {
        facing: (pose.vx ?? 80) >= -5 ? 1 : -1,
        grounded: pose.grounded ?? true,
        vx: pose.vx ?? 160,
        vy: pose.vy ?? 0,
        t: this.elapsed + gi * 130,
      });
      // Floating namepill badge above rival
      const pillW = Math.max(38, ghost.name.length * 7 + 14);
      const pillX = pose.x + 11 - pillW / 2;
      const pillY = pose.y - 22;
      g.fillStyle(0x14101c, 0.86);
      g.fillRoundedRect(pillX, pillY, pillW, 15, 7);
      g.lineStyle(1.5, ghost.color, 0.95);
      g.strokeRoundedRect(pillX, pillY, pillW, 15, 7);
      const lbl = this.ensureGhostLabel(gi);
      lbl.setText(ghost.name).setPosition(pose.x + 11, pillY + 7.5).setVisible(this.hud.visible);
    }

    drawParticles(g, this.parts);

    // Player motion trail
    for (let i = 0; i < this.playerTrail.length; i += 1) {
      const pt = this.playerTrail[i];
      const alpha = ((i + 1) / this.playerTrail.length) * (this.dash > 0 ? 0.36 : 0.16);
      g.fillStyle(this.dash > 0 ? 0xffe066 : th.accent, alpha);
      g.fillCircle(pt.x + 11, pt.y + 18, 5 + i * 0.8);
    }

    const bodyX = this.dying > 0 ? this.rag.x : this.x;
    const bodyY = this.dying > 0 ? this.rag.y : this.y;
    this.drawCapsuleBean(g, bodyX, bodyY, th.accent, {
      facing: this.vx >= 0 ? 1 : -1,
      grounded: this.grounded,
      vx: this.vx,
      vy: this.vy,
      t: this.timeMs,
      dying: this.dying > 0,
      lean: this.dying > 0 ? this.rag.rot : this.vx * 0.0009,
      isPlayer: true,
    });
    fillVignette(g, this.map.width, this.map.height, 0.08);

    const posTag = `${this.formatOrdinal(this.rank)} / ${this.totalRunners}`;
    this.hud.setText(
      `POS ${posTag}  ·  ${this.map.name.toUpperCase()}\n${(this.timeMs / 1000).toFixed(2)}s   FALLS ${this.falls}`,
    );
    this.overlay.clear();
    if (this.hud.visible) {
      this.drawRaceProgressBar();
      this.overlay.fillStyle(0x161020, 0.78);
      this.overlay.fillRoundedRect(12, 56, 286, 52, 12);
      this.overlay.lineStyle(2, this.rank === 1 ? 0xffe066 : th.accent, 0.9);
      this.overlay.strokeRoundedRect(12, 56, 286, 52, 12);
      if (this.checkpointBannerTimer > 0) {
        const popAlpha = clamp(this.checkpointBannerTimer / 0.35, 0, 1);
        const floatY = 58 - (1 - clamp(this.checkpointBannerTimer / 1.35, 0, 1)) * 8;
        const badgeW = 148;
        const badgeH = 24;
        const badgeX = this.scale.width * 0.5 - badgeW * 0.5;
        const badgeY = floatY - badgeH * 0.5;
        this.overlay.fillStyle(0x091524, 0.88 * popAlpha);
        this.overlay.fillRoundedRect(badgeX, badgeY, badgeW, badgeH, 12);
        this.overlay.lineStyle(1.8, 0x38bdf8, 0.95 * popAlpha);
        this.overlay.strokeRoundedRect(badgeX, badgeY, badgeW, badgeH, 12);
        this.checkpointLabel.setPosition(this.scale.width * 0.5, floatY).setAlpha(popAlpha).setVisible(true);
      } else {
        this.checkpointLabel.setVisible(false);
      }
    } else {
      this.checkpointLabel.setVisible(false);
    }
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
        paused: this.paused,
        fps: this.game.loop.actualFps,
        longFrames: this.longFrames,
        tick: this.ticks,
        frozen: false,
        contentId: this.map.id,
      },
      {
        finishRun: () => this.win(),
        killPlayer: () => this.die(),
        setDrive: (v: number) => {
          this.touchMove = clamp(Number(v) || 0, -1, 1);
        },
        jump: () => {
          this.touchJump = true;
        },
        seedPeak: () => {
          this.running = true;
          this.started = this.time.now - 8400;
          this.timeMs = 8400;
          this.elapsed = 8400;
          const plat =
            this.map.solids.find((s) => (s.kind === "solid" || s.kind === "mover") && s.x > this.spawn.x + 650 && s.x < this.spawn.x + 1450) ??
            this.map.solids[1];
          this.x = plat ? plat.x + Math.min(80, plat.w * 0.4) : this.spawn.x + 920;
          this.y = plat ? plat.y - 32 : this.spawn.y - 40;
          this.vx = 260;
          this.vy = -120;
          this.checkpointIdx = 2;
          this.checkpointBannerTimer = 1.25;
          this.playerTrail = [
            { x: this.x - 42, y: this.y + 10 },
            { x: this.x - 28, y: this.y + 6 },
            { x: this.x - 14, y: this.y + 3 },
          ];
          this.camX = this.x;
          this.camY = this.y - 40;
          this.updateRaceRank();
          this.draw();
        },
        hideHud: () => {
          this.hud.setVisible(false);
          this.checkpointLabel.setVisible(false);
          this.ghostLabels.forEach((lbl) => lbl.setVisible(false));
        },
      },
    );
  }

  shutdown() {
    this.nativeKeys?.destroy();
    this.checkpointLabel?.destroy();
    this.ghostLabels.forEach((lbl) => lbl.destroy());
    this.ghostLabels = [];
    clearGwDebug();
  }
}

export function mountKnockoutCircuit(parent: HTMLElement, platform: PlatformSDK, mapIndex = 0) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: Math.max(320, parent.clientWidth || 1280),
    height: Math.max(240, parent.clientHeight || 720),
    backgroundColor: "#f4d48a",
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
