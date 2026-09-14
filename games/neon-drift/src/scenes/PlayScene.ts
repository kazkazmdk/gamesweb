import Phaser from "phaser";
import { FloatingTextPool, Juice, ParticlePool, Synth, clamp } from "@gamesweb/game-core";
import type { PlatformSDK } from "@gamesweb/game-sdk";
import { neonDriftManifest } from "@gamesweb/game-sdk";
import { DriftScore } from "../systems/scoring";
import { buildTrack, queryTrack, startPose, type TrackSample } from "../systems/track";
import { Car } from "../systems/vehicle";

type ResultKind = "crash" | "finish" | "time";

export class DriftPlayScene extends Phaser.Scene {
  private platform!: PlatformSDK;
  private car = new Car();
  private samples: TrackSample[] = [];
  private score = new DriftScore();
  private juice = new Juice();
  private parts = new ParticlePool(280);
  private floaters = new FloatingTextPool(20);
  private synth = new Synth();
  private gfx!: Phaser.GameObjects.Graphics;
  private overlay!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private paused = false;
  private ended = false;
  private lap = 0;
  private lastProgress = 0;
  private crossed = false;
  private runStart = 0;
  private reverse = false;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private touchSteer = 0;
  private touchThrottle = 1;
  private touchBrake = false;
  private camX = 0;
  private camY = 0;
  private marks: Array<{ x: number; y: number; a: number; life: number }> = [];
  private wallHits = 0;
  private cleanLap = true;
  private shownHint = true;
  private nearArmed = true;
  private lastSkid = 0;

  constructor() {
    super("neon-drift-play");
  }

  create() {
    this.platform = this.game.registry.get("platform") as PlatformSDK;
    this.reverse = Boolean(this.game.registry.get("dailyVariant"));
    this.samples = buildTrack(this.reverse);
    const pose = startPose(this.samples);
    this.car.reset(pose.x, pose.y, pose.angle);
    this.score.reset();
    this.ended = false;
    this.paused = false;
    this.lap = 0;
    this.lastProgress = 0.02;
    this.crossed = false;
    this.wallHits = 0;
    this.cleanLap = true;
    this.runStart = this.time.now;
    this.camX = pose.x;
    this.camY = pose.y;
    this.marks = [];
    this.cameras.main.setBackgroundColor("#0b0a0c");
    this.gfx = this.add.graphics();
    this.overlay = this.add.graphics().setScrollFactor(0).setDepth(20);
    this.hud = this.add
      .text(28, 22, "", {
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        fontSize: "18px",
        color: "#f3f1ec",
      })
      .setScrollFactor(0)
      .setDepth(21);
    this.hint = this.add
      .text(this.scale.width / 2, this.scale.height - 72, "WASD / ARROWS TO DRIVE", {
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        fontSize: "14px",
        color: "#f3f1ec",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(21)
      .setAlpha(0.85);

    const kb = this.input.keyboard!;
    this.keys = {
      up: kb.addKey("W"),
      up2: kb.addKey("UP"),
      down: kb.addKey("S"),
      down2: kb.addKey("DOWN"),
      left: kb.addKey("A"),
      left2: kb.addKey("LEFT"),
      right: kb.addKey("D"),
      right2: kb.addKey("RIGHT"),
      space: kb.addKey("SPACE"),
      r: kb.addKey("R"),
      esc: kb.addKey("ESC"),
    };

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      void this.synth.resume();
      this.touchSteer = p.x < this.scale.width * 0.5 ? -1 : 1;
      if (p.y > this.scale.height * 0.78 && p.x > this.scale.width * 0.38 && p.x < this.scale.width * 0.62) {
        this.touchBrake = true;
        this.touchSteer = 0;
      }
    });
    this.input.on("pointerup", () => {
      this.touchSteer = 0;
      this.touchBrake = false;
    });

    this.platform.session.start();
    this.platform.events.emit({ name: "gameplay_started", props: { gameId: "neon-drift" } });
    void this.synth.resume().then(() => {
      this.synth.startEngine();
      this.synth.startBed("drift");
    });

    this.game.events.on("platform-pause", this.onPause, this);
    this.game.events.on("platform-resume", this.onResume, this);
    this.scale.on("resize", this.layout, this);
    this.layout();
  }

  private layout = () => {
    this.hint.setPosition(this.scale.width / 2, this.scale.height - 72);
  };

  private onPause = () => {
    this.paused = true;
  };
  private onResume = () => {
    this.paused = false;
  };

  update(_: number, delta: number) {
    const dt = Math.min(0.033, delta / 1000);
    if (Phaser.Input.Keyboard.JustDown(this.keys.r)) {
      this.retry();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.esc)) {
      this.platform.pause.request();
    }
    if (this.paused || this.ended) {
      this.draw(0);
      return;
    }
    if (this.juice.isFrozen(this.time.now)) {
      this.draw(dt);
      return;
    }

    const left = this.keys.left.isDown || this.keys.left2.isDown || this.touchSteer < 0;
    const right = this.keys.right.isDown || this.keys.right2.isDown || this.touchSteer > 0;
    const accel = this.keys.up.isDown || this.keys.up2.isDown || this.input.pointer1.isDown;
    const brake = this.keys.down.isDown || this.keys.down2.isDown || this.touchBrake;
    this.car.steer = (Number(right) - Number(left)) as number;
    this.car.handbrake = this.keys.space.isDown;
    if (brake) this.car.throttle = -1;
    else if (accel || this.input.activePointer.isDown) this.car.throttle = 1;
    else this.car.throttle = this.input.activePointer.wasTouch ? 0.7 : 0;

    if (this.car.throttle !== 0 || this.car.steer !== 0) this.shownHint = false;

    this.car.step(dt);
    const q = queryTrack(this.samples, this.car.x, this.car.y);
    this.car.surface = q.surface;

    if (q.dist > q.half + 26) {
      this.car.bounce(-q.nx, -q.ny, 10);
      this.wallHits += 1;
      this.cleanLap = false;
      this.juice.screenShake(7, 120);
      this.juice.hitStop(40);
      this.synth.crash();
      this.parts.burst(this.car.x, this.car.y, 14, 0xf3f1ec, 180, 280);
      if (this.car.speed > 380) {
        this.finish("crash");
        return;
      }
    }

    const near = q.dist > q.half * 0.72 && q.dist < q.half && this.car.drifting;
    this.score.tick(dt, {
      drifting: this.car.drifting,
      speed: this.car.speed,
      slip: this.car.slip,
      near,
      boost: q.surface === "boost",
    });

    if (this.car.drifting) {
      void this.platform.achievement.unlock("first-slide");
      if (this.score.combo >= 5) void this.platform.achievement.unlock("combo-5");
    }
    if (near && this.nearArmed) {
      this.nearArmed = false;
      this.floaters.spawn(this.car.x, this.car.y - 30, "NEAR", "#e35aa0");
      void this.platform.achievement.unlock("near-miss");
      this.juice.cameraPunch(0.8);
    }
    if (!near) this.nearArmed = true;
    if (q.surface === "boost") void this.platform.achievement.unlock("boost-gate");
    if (q.surface === "asphalt" && this.car.speed > 200) void this.platform.achievement.unlock("grass-survive");

    if (this.car.drifting && this.car.speed > 160) {
      this.marks.push({ x: this.car.x, y: this.car.y, a: this.car.angle, life: 3.2 });
      if (this.marks.length > 220) this.marks.shift();
      this.parts.emit({
        x: this.car.x - Math.cos(this.car.angle) * 12,
        y: this.car.y - Math.sin(this.car.angle) * 12,
        vx: -this.car.vx * 0.12 + (Math.random() - 0.5) * 20,
        vy: -this.car.vy * 0.12 + (Math.random() - 0.5) * 20,
        life: 380,
        size: 3,
        color: 0xc9c4bf,
        drag: 0.94,
      });
      if (this.time.now - this.lastSkid > 70) {
        this.synth.skid(Math.min(1, Math.abs(this.car.slip) * 2));
        this.lastSkid = this.time.now;
      }
    }

    let dp = q.progress - this.lastProgress;
    if (dp < -0.5) dp += 1;
    if (dp > 0.5) dp -= 1;
    if (q.progress < 0.08 && this.lastProgress > 0.8 && !this.crossed) {
      this.lap += 1;
      this.crossed = true;
      if (this.cleanLap) void this.platform.achievement.unlock("no-crash-lap");
      this.cleanLap = true;
      this.synth.uiConfirm();
      if (this.lap >= 2) {
        this.finish("finish");
        return;
      }
    }
    if (q.progress > 0.2) this.crossed = false;
    this.lastProgress = q.progress;

    const targetX = this.car.x + this.car.vx * 0.18;
    const targetY = this.car.y + this.car.vy * 0.18;
    this.camX += (targetX - this.camX) * (1 - Math.exp(-dt * 6));
    this.camY += (targetY - this.camY) * (1 - Math.exp(-dt * 6));
    const shaken = this.juice.applyCamera({ x: this.camX, y: this.camY }, this.time.now);
    this.cameras.main.centerOn(shaken.x, shaken.y);

    this.parts.update(dt);
    this.floaters.update(dt);
    this.synth.engineRpm(clamp(this.car.speed / 640, 0, 1));

    if (this.time.now - this.runStart > 120000) {
      this.finish("time");
      return;
    }

    this.draw(dt);
    this.platform.events.emit({
      name: "hud",
      props: { score: Math.floor(this.score.display), combo: Math.floor(this.score.combo) },
    });
  }

  private draw(dt: number) {
    const g = this.gfx;
    g.clear();
    g.fillStyle(0x121114, 1);
    g.fillRect(0, 0, 3200, 2200);

    for (let i = 0; i < this.samples.length; i += 1) {
      const s = this.samples[i];
      const inner = this.samples[(i + 1) % this.samples.length];
      g.fillStyle(s.boost ? 0x5a2a44 : 0x2a2a2e, 1);
      const w = s.width * 0.5 + 18;
      g.fillTriangle(s.x + s.nx * w, s.y + s.ny * w, s.x - s.nx * w, s.y - s.ny * w, inner.x + inner.nx * w, inner.y + inner.ny * w);
      g.fillTriangle(s.x - s.nx * w, s.y - s.ny * w, inner.x - inner.nx * w, inner.y - inner.ny * w, inner.x + inner.nx * w, inner.y + inner.ny * w);
    }
    for (let i = 0; i < this.samples.length; i += 1) {
      const s = this.samples[i];
      const inner = this.samples[(i + 1) % this.samples.length];
      const w = s.width * 0.5;
      g.fillStyle(s.boost ? 0x3a2030 : 0x1a1a1d, 1);
      g.fillTriangle(s.x + s.nx * w, s.y + s.ny * w, s.x - s.nx * w, s.y - s.ny * w, inner.x + inner.nx * w, inner.y + inner.ny * w);
      g.fillTriangle(s.x - s.nx * w, s.y - s.ny * w, inner.x - inner.nx * w, inner.y - inner.ny * w, inner.x + inner.nx * w, inner.y + inner.ny * w);
    }

    g.lineStyle(2, 0xe35aa0, 0.18);
    for (let i = 0; i < this.samples.length; i += 8) {
      const s = this.samples[i];
      g.lineBetween(s.x + s.nx * (s.width * 0.5), s.y + s.ny * (s.width * 0.5), s.x - s.nx * (s.width * 0.5), s.y - s.ny * (s.width * 0.5));
    }

    for (const m of this.marks) {
      m.life -= dt;
      if (m.life <= 0) continue;
      g.fillStyle(0x2c2c30, Math.min(0.55, m.life * 0.2));
      g.fillCircle(m.x, m.y, 4);
    }

    for (const p of this.parts.items) {
      if (!p.active) continue;
      g.fillStyle(p.color, p.life / p.max);
      g.fillCircle(p.x, p.y, p.size);
    }

    const c = this.car;
    g.save();
    g.translateCanvas(c.x, c.y);
    g.rotateCanvas(c.angle);
    g.fillStyle(0x1a1a1c, 1);
    g.fillRoundedRect(-16, -9, 32, 18, 4);
    g.fillStyle(c.drifting ? 0xe35aa0 : 0xf3f1ec, 1);
    g.fillRoundedRect(6, -7, 12, 14, 3);
    g.fillStyle(0x111113, 1);
    g.fillRect(-12, -11, 7, 4);
    g.fillRect(-12, 7, 7, 4);
    g.restore();

    for (const t of this.floaters.items) {
      if (!t.active) continue;
      this.hud;
    }

    this.overlay.clear();
    const fa = this.juice.flashAlpha(dt);
    if (fa > 0) {
      this.overlay.fillStyle(0xffffff, fa);
      this.overlay.fillRect(0, 0, this.scale.width, this.scale.height);
    }

    const combo = Math.max(1, Math.floor(this.score.combo));
    const elapsed = ((this.time.now - this.runStart) / 1000).toFixed(1);
    this.hud.setText(
      `${Math.floor(this.score.display).toLocaleString()}\n${combo}x   lap ${this.lap}/2   ${elapsed}s`,
    );
    this.hint.setAlpha(this.shownHint ? 0.85 : 0);

    if (this.input.activePointer.wasTouch || this.sys.game.device.input.touch) {
      this.overlay.fillStyle(0xffffff, 0.04);
      this.overlay.fillRoundedRect(24, this.scale.height - 92, 88, 64, 14);
      this.overlay.fillRoundedRect(this.scale.width - 112, this.scale.height - 92, 88, 64, 14);
      this.overlay.fillStyle(0xe35aa0, 0.18);
      this.overlay.fillRoundedRect(this.scale.width / 2 - 46, this.scale.height - 86, 92, 52, 14);
    }
  }

  private finish(kind: ResultKind) {
    if (this.ended) return;
    this.ended = true;
    this.synth.stopEngine();
    const score = Math.floor(this.score.total);
    if (score >= 25000) void this.platform.achievement.unlock("score-25k");
    if (score >= 60000) void this.platform.achievement.unlock("score-60k");
    if (this.lap >= 2) void this.platform.achievement.unlock("two-laps");
    void this.platform.session.end({
      mode: this.reverse ? "daily" : "circuit",
      score,
      result: kind,
      metadata: {
        laps: this.lap,
        combo: Math.floor(this.score.combo),
        wallHits: this.wallHits,
        duration: this.time.now - this.runStart,
      },
    });
  }

  private retry() {
    this.synth.dispose();
    this.game.events.off("platform-pause", this.onPause, this);
    this.game.events.off("platform-resume", this.onResume, this);
    this.platform.events.emit({ name: "game_retry", props: { gameId: "neon-drift" } });
    this.scene.restart();
  }

  shutdown() {
    this.synth.dispose();
    this.game.events.off("platform-pause", this.onPause, this);
    this.game.events.off("platform-resume", this.onResume, this);
  }
}

export function mountNeonDrift(parent: HTMLElement, platform: PlatformSDK, dailyVariant = false) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#0b0a0c",
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [DriftPlayScene],
    disableContextMenu: true,
    banner: false,
    audio: { disableWebAudio: false },
    fps: { target: 60 },
    render: { antialias: true, roundPixels: false },
  });
  game.registry.set("platform", platform);
  game.registry.set("dailyVariant", dailyVariant);
  game.registry.set("manifest", neonDriftManifest);
  return game;
}
