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
import { crowdControlManifest, readRunContext, type PlatformSDK } from "@gamesweb/game-sdk";
import { applyOp, buildCourse, opLabel, type Segment } from "../systems/course";

export class CrowdScene extends Phaser.Scene {
  private platform!: PlatformSDK;
  private juice = new Juice();
  private parts!: ParticlePool;
  private synth!: Synth;
  private gfx!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private native: GameKeyboard | null = null;
  private segs: Segment[] = [];
  private z = 0;
  private x = 0.5;
  private pack = 12;
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
    this.gfx = this.add.graphics();
    this.hud = this.add.text(16, 48, "", { fontFamily: "ui-sans-serif, system-ui", fontSize: "16px", color: "#ffe0d4" }).setScrollFactor(0).setDepth(21);
    this.native?.destroy();
    this.native = createGameKeyboard();
    this.game.canvas.tabIndex = 0;
    this.game.canvas.focus({ preventScroll: true });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      this.x = Phaser.Math.Clamp(p.x / this.scale.width, 0.08, 0.92);
    });
    this.platform.session.start();
    this.started = this.time.now;
    this.platform.events.emit({ name: "gameplay_started", props: { gameId: "crowd-control" } });
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
      this.x = Phaser.Math.Clamp(this.x + steer * dt * 1.4, 0.08, 0.92);
      const dash = native?.dash ? 1.45 : 1;
      this.z += this.speed * dt * dash;
      if (this.ticks % 3 === 0) this.ghost.push({ z: this.z, x: this.x });
      const seg = this.segs.find((s) => !this.hitSet.has(s.z) && Math.abs(s.z - this.z) < 18);
      if (seg) {
        this.hitSet.add(seg.z);
        this.touch(seg);
      }
    }
    this.parts.update(dt);
    this.draw();
    this.publishDebug();
  }

  private touch(seg: Segment) {
    const side: "left" | "right" = this.x < 0.5 ? "left" : "right";
    this.choices.push({ z: seg.z, side });
    if (seg.type === "gate" || seg.type === "finish") {
      const op = side === "left" ? seg.left : seg.right;
      this.pack = applyOp(this.pack, op);
      this.synth.tone(seg.type === "finish" ? 520 : 300 + this.pack, 0.06, "square", 0.04, 0.12);
      void this.platform.achievement.unlock("first-gate");
      if (op?.kind === "mul" && op.n >= 4) void this.platform.achievement.unlock("x4");
      pulseHaptic(7);
      if (seg.type === "finish") this.finish();
    } else if (seg.type === "enemy") {
      if ((seg.lane === "left" && side === "left") || (seg.lane === "right" && side === "right")) {
        this.pack = Math.max(0, this.pack - 8);
        this.hit += 1;
        this.synth.impact(0.4);
      }
    } else if (seg.type === "shortcut" && side === "left") {
      this.shortcut = true;
      this.speed += 40;
      void this.platform.achievement.unlock("shortcut");
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

  private draw() {
    const g = this.gfx;
    const w = this.scale.width;
    const h = this.scale.height;
    g.clear();
    g.fillStyle(0x1c100c, 1);
    g.fillRect(0, 0, w, h);
    g.fillStyle(0x2a1812, 1);
    g.fillRect(w * 0.18, 0, w * 0.64, h);
    g.lineStyle(2, 0xff7a59, 0.25);
    g.lineBetween(w / 2, 0, w / 2, h);
    for (const s of this.segs) {
      const y = h * 0.75 - (s.z - this.z) * 0.7;
      if (y < -40 || y > h + 40) continue;
      if (s.type === "gate" || s.type === "finish") {
        g.fillStyle(0x3a241c, 1);
        g.fillRoundedRect(w * 0.2, y - 18, w * 0.26, 36, 8);
        g.fillRoundedRect(w * 0.54, y - 18, w * 0.26, 36, 8);
        this.hud;
      } else if (s.type === "enemy") {
        g.fillStyle(0xff4d6d, 0.9);
        g.fillCircle(s.lane === "left" ? w * 0.33 : w * 0.67, y, 16);
      } else if (s.type === "shortcut") {
        g.fillStyle(0xffd166, 0.5);
        g.fillRect(w * 0.2, y - 8, 18, 16);
      }
    }
    for (const s of this.segs) {
      const y = h * 0.75 - (s.z - this.z) * 0.7;
      if (y < 40 || y > h - 40) continue;
      if (s.type === "gate" || s.type === "finish") {
        this.hud.setColor("#ffe0d4");
      }
    }
    const ghost = this.ghostTape.find((p) => p.z >= this.z);
    if (ghost) {
      g.fillStyle(0xffffff, 0.25);
      g.fillCircle(w * 0.2 + ghost.x * w * 0.6, h * 0.72, 10);
    }
    g.fillStyle(0xff7a59, 1);
    g.fillCircle(w * 0.2 + this.x * w * 0.6, h * 0.78, 14 + Math.min(18, this.pack * 0.12));
    const next = this.segs.find((s) => s.z > this.z);
    const hint = next && (next.type === "gate" || next.type === "finish") ? `${opLabel(next.left)}   ${opLabel(next.right)}` : "";
    this.hud.setText(`${this.pack}  pack\n${hint}`);
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
        hideHud: () => this.hud.setVisible(false),
      },
    );
  }

  shutdown() {
    this.native?.destroy();
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
