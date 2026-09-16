import Phaser from "phaser";
import { clamp, Juice, ParticlePool, pulseHaptic, Synth, publishGwDebug, countLongFrame, clearGwDebug, createGameKeyboard, type GameKeyboard } from "@gamesweb/game-core";
import type { PlatformSDK } from "@gamesweb/game-sdk";
import { velocityRunManifest } from "@gamesweb/game-sdk";
import { COURSES, medalFor, nextMedalTarget, type Course, type Rect } from "../systems/courses";
import { aabb, MOVE, Runner } from "../systems/movement";
import {
  GhostRecorder,
  ghostEnabled,
  ghostPose,
  loadGhost,
  saveGhost,
  setGhostEnabled,
  type GhostTape,
} from "../systems/ghost";

function axis(v: number, half: number, world: number) {
  if (world <= half * 2) return world / 2;
  return clamp(v, half, world - half);
}

export class VelocityPlayScene extends Phaser.Scene {
  private platform!: PlatformSDK;
  private course!: Course;
  private courseIndex = 0;
  private runner = new Runner();
  private juice = new Juice();
  private parts!: ParticlePool;
  private synth!: Synth;
  private gfx!: Phaser.GameObjects.Graphics;
  private overlay!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private splitTxt!: Phaser.GameObjects.Text;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private paused = false;
  private ended = false;
  private dying = 0;
  private running = false;
  private startMs = 0;
  private timeMs = 0;
  private deaths = 0;
  private retries = 0;
  private spawn = { x: 100, y: 600 };
  private finish!: Rect;
  private camX = 0;
  private camY = 0;
  private camZ = 1;
  private touchMove = 0;
  private touchJump = false;
  private movePointerId = -1;
  private jumpPointerId = -1;
  private audioReady = false;
  private signaledReady = false;
  private longFrames = 0;
  private ticks = 0;
  private sessionDeaths = 0;
  private recorder = new GhostRecorder();
  private tape: GhostTape | null = null;
  private showGhost = true;
  private splitIndex = 0;
  private splits: number[] = [];
  private shownHint = true;
  private endedAt = 0;
  private nativeKeys: GameKeyboard | null = null;

  constructor() {
    super("velocity-run-play");
  }

  create() {
    this.platform = this.game.registry.get("platform") as PlatformSDK;
    this.courseIndex = Number(this.game.registry.get("courseIndex") ?? 0);
    this.course = COURSES[this.courseIndex] ?? COURSES[0];
    const start = this.course.solids.find((s) => s.kind === "start");
    this.finish = this.course.solids.find((s) => s.kind === "finish")!;
    this.spawn = { x: start?.x ?? 80, y: (start?.y ?? 620) - 4 };
    this.runner.reset(this.spawn.x, this.spawn.y);
    this.ended = false;
    this.paused = false;
    this.running = false;
    this.timeMs = 0;
    this.dying = 0;
    this.deaths = 0;
    this.sessionDeaths = 0;
    this.retries = 0;
    this.signaledReady = false;
    this.splitIndex = 0;
    this.splits = [];
    this.camX = this.spawn.x;
    this.camY = this.spawn.y;
    this.camZ = 1;
    this.recorder.reset();
    this.showGhost = ghostEnabled();
    this.tape = loadGhost(this.course.id);
    this.parts = new ParticlePool(this.sys.game.device.input.touch ? 120 : 200);
    this.synth = (this.game.registry.get("synth") as Synth | undefined) ?? new Synth();
    this.game.registry.set("synth", this.synth);
    this.synth.setSettings(this.platform.audio.getSettings());
    this.cameras.main.setBackgroundColor(this.course.theme.sky);
    this.gfx = this.add.graphics();
    this.overlay = this.add.graphics().setScrollFactor(0).setDepth(20);
    this.hud = this.add
      .text(24, 52, "", { fontFamily: "ui-sans-serif, system-ui", fontSize: "17px", color: "#e8fbff" })
      .setScrollFactor(0)
      .setDepth(21);
    this.splitTxt = this.add
      .text(this.scale.width / 2, 82, "", { fontFamily: "ui-sans-serif, system-ui", fontSize: "18px", color: "#8ff3ff" })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(21)
      .setAlpha(0);
    this.hint = this.add
      .text(this.scale.width / 2, this.scale.height - 70, this.sys.game.device.input.touch ? "STEER  ·  JUMP" : "A/D MOVE  ·  SPACE JUMP  ·  R RETRY", {
        fontFamily: "ui-sans-serif, system-ui",
        fontSize: "14px",
        color: "#e8fbff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(21);
    this.shownHint = typeof localStorage === "undefined" || localStorage.getItem("gw:velocity-tutorial") !== "1";
    this.hint.setAlpha(this.shownHint ? 0.85 : 0);

    const kb = this.input.keyboard!;
    this.keys = {
      left: kb.addKey("A"),
      left2: kb.addKey("LEFT"),
      left3: kb.addKey("Q"),
      right: kb.addKey("D"),
      right2: kb.addKey("RIGHT"),
      jump: kb.addKey("SPACE"),
      jump2: kb.addKey("UP"),
      down: kb.addKey("S"),
      down2: kb.addKey("DOWN"),
      r: kb.addKey("R"),
      esc: kb.addKey("ESC"),
      g: kb.addKey("G"),
      one: kb.addKey("ONE"),
      two: kb.addKey("TWO"),
      three: kb.addKey("THREE"),
    };
    this.nativeKeys?.destroy();
    this.nativeKeys = createGameKeyboard();
    this.game.canvas.tabIndex = 0;
    this.game.canvas.focus({ preventScroll: true });

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.ensureAudio();
      if (this.handleChromeTap(p.x, p.y)) return;
      if (!p.wasTouch) return;
      if (p.x < this.scale.width * 0.36) {
        this.touchMove = -1;
        this.movePointerId = p.id;
      } else if (p.x > this.scale.width * 0.64) {
        this.touchMove = 1;
        this.movePointerId = p.id;
      } else {
        this.touchJump = true;
        this.jumpPointerId = p.id;
      }
    });
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (p.id === this.movePointerId) {
        this.touchMove = 0;
        this.movePointerId = -1;
      }
      if (p.id === this.jumpPointerId) {
        this.touchJump = false;
        this.jumpPointerId = -1;
      }
    });

    this.platform.events.emit({ name: "gameplay_started", props: { gameId: "velocity-run", course: this.course.id } });
    this.fitCam(this.scale.width, this.scale.height);
    this.scale.on("resize", (gs: Phaser.Structs.Size) => {
      this.fitCam(gs.width, gs.height);
      this.hint.setPosition(this.scale.width / 2, this.scale.height - 70);
      this.splitTxt.setPosition(this.scale.width / 2, 82);
    });
    this.game.events.on("platform-pause", this.onPause, this);
    this.game.events.on("platform-resume", this.onResume, this);
  }

  private onPause = () => {
    this.paused = true;
  };
  private onResume = () => {
    this.paused = false;
  };

  private fitCam(w: number, h: number) {
    this.cameras.resize(w, h);
    this.cameras.main.setViewport(0, 0, w, h);
    this.cameras.main.setSize(w, h);
  }

  private ensureAudio() {
    if (this.audioReady) return;
    this.audioReady = true;
    void this.synth.resume().then(() => {
      this.synth.startBed("run");
    });
  }

  update(_: number, delta: number) {
    const dt = Math.min(0.033, delta / 1000);
    this.longFrames = countLongFrame(delta, this.longFrames);
    this.ticks += 1;
    if (!this.signaledReady) {
      this.signaledReady = true;
      this.platform.events.emit({ name: "game_ready", props: { gameId: "velocity-run" } });
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.r)) {
      if (!this.ended) this.retry();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.g)) {
      this.showGhost = !this.showGhost;
      setGhostEnabled(this.showGhost);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.one)) this.switchCourse(0);
    if (Phaser.Input.Keyboard.JustDown(this.keys.two)) this.switchCourse(1);
    if (Phaser.Input.Keyboard.JustDown(this.keys.three)) this.switchCourse(2);
    if (this.paused) {
      this.draw(dt);
      return;
    }

    if (this.dying > 0) {
      this.dying -= dt * 1000;
      this.parts.update(dt);
      this.draw(dt);
      if (this.dying <= 0) {
        this.runner.reset(this.spawn.x, this.spawn.y);
        this.running = false;
        this.timeMs = 0;
        this.deaths = 0;
        this.splitIndex = 0;
        this.splits = [];
        this.recorder.reset();
      }
      return;
    }

    const native = this.nativeKeys?.read();
    const move =
      Number(this.keys.right.isDown || this.keys.right2.isDown || Boolean(native?.right)) -
      Number(this.keys.left.isDown || this.keys.left2.isDown || this.keys.left3?.isDown || Boolean(native?.left)) || this.touchMove;
    const jumpDown =
      Phaser.Input.Keyboard.JustDown(this.keys.jump) || Phaser.Input.Keyboard.JustDown(this.keys.jump2) || Boolean(native?.jumpPressed) || this.touchJump;
    if (this.touchJump) this.touchJump = false;
    const jumpHeld = this.keys.jump.isDown || this.keys.jump2.isDown || Boolean(native?.jump);
    const jumpReleased = Phaser.Input.Keyboard.JustUp(this.keys.jump) || Phaser.Input.Keyboard.JustUp(this.keys.jump2);
    const down = this.keys.down.isDown || this.keys.down2.isDown || Boolean(native?.down);

    if (!this.running && (move !== 0 || jumpDown)) {
      this.running = true;
      this.startMs = this.time.now;
      this.platform.session.start();
      this.shownHint = false;
      try {
        localStorage.setItem("gw:velocity-tutorial", "1");
      } catch {
        /* noop */
      }
      this.hint.setAlpha(0);
      this.ensureAudio();
    }

    if (!this.ended) {
      const wasGround = this.runner.grounded;
      this.runner.grounded = false;
      if (wasGround) this.runner.coyote = this.time.now + MOVE.coyoteMs;
      this.runner.input(dt, move, jumpDown, jumpHeld, jumpReleased, down, this.time.now);
      this.collide();
      if (this.runner.grounded && !wasGround) {
        this.parts.burst(this.runner.x + 8, this.runner.y + 28, 6, this.course.theme.accent, 70, 200);
        this.synth.tone(220 + Math.random() * 30, 0.035, "triangle", 0.028, 0.08);
      }
      if (down && this.runner.vy > 80) void this.platform.achievement.unlock("fast-fall");
      if (this.running) this.timeMs = this.time.now - this.startMs;
      this.recorder.tick(dt, this.timeMs, this.runner.x, this.runner.y);
      this.hitCheckpoints();
      if (aabb(this.runner.x, this.runner.y, 16, 28, this.finish.x, this.finish.y, this.finish.w, this.finish.h)) {
        this.win();
      }
      if (this.runner.y > this.course.height + 40) this.die();
    }

    const look = this.runner.facing * (70 + Math.abs(this.runner.vx) * 0.18);
    const k = 1 - Math.exp(-dt * 6.2);
    this.camX += (this.runner.x + look - this.camX) * k;
    this.camY += (this.runner.y - 28 - this.camY) * (1 - Math.exp(-dt * 3.6));
    this.camX = axis(this.camX, this.scale.width / 2, this.course.width);
    this.camY = axis(this.camY, this.scale.height / 2, this.course.height);
    const speedT = Math.min(1, Math.abs(this.runner.vx) / 318);
    this.camZ += (1 - 0.06 * speedT - this.camZ) * (1 - Math.exp(-dt * 2.2));
    this.cameras.main.setZoom(this.camZ);
    const sh = this.juice.applyCamera({ x: this.camX, y: this.camY }, this.time.now);
    this.cameras.main.centerOn(sh.x, sh.y);
    this.parts.update(dt);
    this.draw(dt);
  }

  private collide() {
    const r = this.runner;
    for (const s of this.course.solids) {
      if (s.kind === "start" || s.kind === "finish" || s.kind === "checkpoint") continue;
      if (!aabb(r.x, r.y, r.w, r.h, s.x, s.y, s.w, s.h)) continue;
      if (s.kind === "spike" || s.kind === "hazard") {
        this.die();
        return;
      }
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      const sx = s.x + s.w / 2;
      const sy = s.y + s.h / 2;
      const dx = cx - sx;
      const dy = cy - sy;
      const px = r.w / 2 + s.w / 2 - Math.abs(dx);
      const py = r.h / 2 + s.h / 2 - Math.abs(dy);
      if (px < py) {
        r.x += dx > 0 ? px : -px;
        r.vx = 0;
      } else if (dy > 0) {
        r.y += py;
        r.bonk();
      } else if (r.vy >= 0) {
        r.land(s.y - r.h);
      }
    }
  }

  private hitCheckpoints() {
    const gates = this.course.solids.filter((s) => s.kind === "checkpoint");
    const gate = gates[this.splitIndex];
    if (!gate) return;
    if (!aabb(this.runner.x, this.runner.y, 16, 28, gate.x - 10, gate.y, gate.w + 20, gate.h)) return;
    this.splits.push(this.timeMs);
    const pb = this.tape?.splits[this.splitIndex];
    const d = pb !== undefined ? this.timeMs - pb : 0;
    const sign = d >= 0 ? "+" : "";
    this.splitTxt.setText(`CHECKPOINT ${this.splitIndex + 1}  ${pb === undefined ? "—" : `${sign}${(d / 1000).toFixed(2)}`}`);
    this.splitTxt.setColor(d <= 0 ? "#8dffc1" : "#ff8aa0");
    this.splitTxt.setAlpha(1);
    this.tweens.add({ targets: this.splitTxt, alpha: 0, delay: 1100, duration: 280 });
    this.synth.gateChime();
    this.splitIndex += 1;
  }

  private die() {
    if (this.ended || this.dying > 0) return;
    this.deaths += 1;
    this.sessionDeaths += 1;
    this.dying = 90;
    this.juice.hitStop(40);
    this.juice.screenShake(7, 90);
    this.juice.flash(0.22);
    this.parts.burst(this.runner.x + 8, this.runner.y + 12, 16, this.course.theme.accent, 240, 260);
    this.synth.impact(0.7);
    this.platform.events.emit({ name: "death", props: { gameId: "velocity-run", deaths: this.deaths } });
  }

  private win() {
    if (this.ended) return;
    this.ended = true;
    this.endedAt = this.time.now;
    const medal = medalFor(this.course, this.timeMs);
    const next = nextMedalTarget(this.course, this.timeMs);
    const prev = this.tape?.timeMs ?? 0;
    const pb = prev === 0 || this.timeMs < prev;
    if (pb) {
      saveGhost({
        courseId: this.course.id,
        timeMs: this.timeMs,
        splits: this.splits,
        samples: this.recorder.samples,
      });
      this.synth.personalBest();
      pulseHaptic([10, 30, 16]);
    } else this.synth.finishSting();
    void this.platform.achievement.unlock("first-finish");
    if (medal) void this.platform.achievement.unlock("bronze");
    if (medal === "gold" || medal === "platinum") void this.platform.achievement.unlock("gold");
    if (medal === "platinum") void this.platform.achievement.unlock("platinum");
    if (this.courseIndex === 0 && this.timeMs < 40000) void this.platform.achievement.unlock("sub-40");
    if (this.sessionDeaths === 0) void this.platform.achievement.unlock("no-death");
    this.markCourseCleared();
    if (pb && prev > 0) this.markSecondPb();
    void this.platform.quest.progress("velocity-run:gold", medal === "gold" || medal === "platinum" ? 1 : 0);
    if (this.courseIndex === 0 && this.timeMs < 65000) {
      void this.platform.quest.progress("velocity-run:course-1-under", 65000);
    }
    if (medal) {
      this.platform.events.emit({ name: "medal_earned", props: { gameId: "velocity-run", medal } });
    }
    this.platform.events.emit({ name: "finish", props: { gameId: "velocity-run", timeMs: this.timeMs } });
    const away = prev > 0 ? this.timeMs - prev : 0;
    const retryHint = pb
      ? "New personal best. One more for the ghost."
      : next
        ? `${next.name}: ${(next.target / 1000).toFixed(3)}s  You: ${(this.timeMs / 1000).toFixed(3)}s  +${(next.gap / 1000).toFixed(3)}`
        : away > 0
          ? `You were ${(away / 1000).toFixed(3)}s off PB.`
          : "Cleaner landings. Retry.";
    void this.platform.session.end({
      mode: this.course.id,
      score: Math.floor(this.timeMs),
      result: "finish",
      metadata: {
        medal: medal ?? "none",
        deaths: this.deaths,
        sessionDeaths: this.sessionDeaths,
        course: this.courseIndex,
        lowerIsBetter: true,
        pbDelta: prev > 0 ? this.timeMs - prev : 0,
        retryHint,
        nextMedal: next?.name ?? "",
        medalGap: next?.gap ?? 0,
        splits: this.splits.length,
      },
    });
  }

  private retry() {
    this.retries += 1;
    if (this.retries >= 10) void this.platform.achievement.unlock("retry-10");
    this.platform.events.emit({
      name: "game_retry",
      props: {
        gameId: "velocity-run",
        time_since_run_end_ms: this.ended ? Math.round(this.time.now - this.endedAt) : 0,
        retry_count_session: this.retries,
      },
    });
    this.game.events.off("platform-pause", this.onPause, this);
    this.game.events.off("platform-resume", this.onResume, this);
    this.scene.restart();
  }

  private switchCourse(i: number) {
    this.game.registry.set("courseIndex", i);
    try {
      localStorage.setItem("gw:velocity-course", String(i));
    } catch {
      /* noop */
    }
    this.retry();
  }

  private draw(dt: number) {
    const g = this.gfx;
    const th = this.course.theme;
    g.clear();
    g.fillStyle(th.bg, 1);
    g.fillRect(0, 0, this.course.width, this.course.height);
    g.fillStyle(th.accent, 0.04);
    for (let x = 0; x < this.course.width; x += 96) g.fillRect(x, 0, 2, this.course.height);

    for (const s of this.course.solids) {
      if (s.kind === "solid") {
        const col = s.route === "expert" ? 0x2a5060 : s.route === "fast" ? 0x1e4454 : th.ground;
        g.fillStyle(col, 1);
        g.fillRect(s.x, s.y, s.w, s.h);
        g.fillStyle(th.accent, s.route === "expert" ? 0.7 : 0.38);
        g.fillRect(s.x, s.y, s.w, 3);
      } else if (s.kind === "spike") {
        g.fillStyle(th.danger, 1);
        g.fillTriangle(s.x, s.y + s.h, s.x + s.w / 2, s.y, s.x + s.w, s.y + s.h);
      } else if (s.kind === "finish") {
        g.fillStyle(0x8ff3ff, 0.85);
        g.fillRect(s.x, s.y, s.w, s.h);
      } else if (s.kind === "checkpoint") {
        g.fillStyle(th.accent, 0.35);
        g.fillRect(s.x, s.y, 6, s.h);
      }
    }

    if (this.showGhost && this.tape && this.running) {
      const pose = ghostPose(this.tape.samples, this.timeMs);
      if (pose) {
        g.fillStyle(th.accent, 0.28);
        g.fillRoundedRect(pose.x, pose.y, 16, 28, 4);
      }
    }

    for (const p of this.parts.items) {
      if (!p.active) continue;
      g.fillStyle(p.color, p.life / p.max);
      g.fillCircle(p.x, p.y, p.size);
    }

    const r = this.runner;
    const w = r.w * r.stretch;
    const h = r.h * r.squash;
    const ox = r.x + (r.w - w) / 2;
    const oy = r.y + r.h - h;
    g.save();
    g.translateCanvas(ox + w / 2, oy + h / 2);
    g.rotateCanvas(r.lean);
    g.fillStyle(this.dying > 0 ? 0xffffff : th.accent, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 4);
    g.fillStyle(th.sky, 1);
    g.fillRect(r.facing > 0 ? 2 : -7, -6, 5, 5);
    g.restore();

    const t = (this.timeMs / 1000).toFixed(2);
    const medal = medalFor(this.course, this.timeMs);
    const next = nextMedalTarget(this.course, this.timeMs);
    this.hud.setText(
      `${this.course.name}\n${t}s${medal ? `  ${medal}` : next ? `  ${next.name} ${(next.target / 1000).toFixed(2)}` : ""}`,
    );

    this.overlay.clear();
    const fa = this.juice.flashAlpha(dt);
    if (fa > 0) {
      this.overlay.fillStyle(0xffffff, fa);
      this.overlay.fillRect(0, 0, this.scale.width, this.scale.height);
    }
    if (this.sys.game.device.input.touch) {
      this.overlay.fillStyle(0xffffff, 0.05);
      this.overlay.fillRoundedRect(16, this.scale.height * 0.28, this.scale.width * 0.3, this.scale.height * 0.5, 16);
      this.overlay.fillRoundedRect(this.scale.width - 16 - this.scale.width * 0.3, this.scale.height * 0.28, this.scale.width * 0.3, this.scale.height * 0.5, 16);
      this.overlay.fillStyle(th.accent, 0.18);
      this.overlay.fillRoundedRect(this.scale.width / 2 - 54, this.scale.height - 92, 108, 64, 16);
      this.overlay.fillStyle(this.showGhost ? th.accent : 0xffffff, this.showGhost ? 0.28 : 0.08);
      this.overlay.fillRoundedRect(this.scale.width - 86, 48, 70, 28, 8);
      for (let i = 0; i < 3; i += 1) {
        const active = i === this.courseIndex;
        this.overlay.fillStyle(active ? th.accent : 0xffffff, active ? 0.28 : 0.08);
        this.overlay.fillRoundedRect(16 + i * 54, 48, 48, 28, 8);
      }
    }
    this.publishDebug();
  }

  private handleChromeTap(x: number, y: number) {
    if (!this.sys.game.device.input.touch) return false;
    const w = this.scale.width;
    if (y >= 48 && y <= 76 && x >= w - 86 && x <= w - 16) {
      this.showGhost = !this.showGhost;
      setGhostEnabled(this.showGhost);
      return true;
    }
    for (let i = 0; i < 3; i += 1) {
      const left = 16 + i * 54;
      if (y >= 48 && y <= 76 && x >= left && x <= left + 48) {
        this.switchCourse(i);
        return true;
      }
    }
    return false;
  }

  private markCourseCleared() {
    try {
      const key = "gw:velocity-cleared";
      const got = new Set((localStorage.getItem(key) ?? "").split(",").filter(Boolean));
      got.add(this.course.id);
      localStorage.setItem(key, [...got].join(","));
      if (got.size >= COURSES.length) void this.platform.achievement.unlock("all-courses");
    } catch {
      /* noop */
    }
  }

  private markSecondPb() {
    try {
      const key = `gw:velocity-pb-count:${this.course.id}`;
      const n = Number(localStorage.getItem(key) ?? 0) + 1;
      localStorage.setItem(key, String(n));
      if (n >= 2) void this.platform.achievement.unlock("pb-twice");
    } catch {
      /* noop */
    }
  }

  private publishDebug() {
    publishGwDebug(
      {
        gameId: "velocity-run",
        ready: this.signaledReady,
        runState: this.ended ? "ended" : this.paused ? "paused" : "playing",
        playerX: this.runner.x,
        playerY: this.runner.y,
        score: Math.floor(this.timeMs),
        paused: this.paused,
        fps: this.game.loop.actualFps,
        longFrames: this.longFrames,
        deaths: this.deaths,
        sessionDeaths: this.sessionDeaths,
        timeMs: this.timeMs,
        courseId: this.course.id,
        tick: this.ticks,
        frozen: false,
      },
      {
        killPlayer: () => this.die(),
        finishRun: () => this.win(),
        jump: () => {
          this.touchJump = true;
        },
        hideHud: () => {
          this.hud.setVisible(false);
          this.overlay.setVisible(false);
        },
      },
    );
  }

  shutdown() {
    this.game.events.off("platform-pause", this.onPause, this);
    this.game.events.off("platform-resume", this.onResume, this);
    this.nativeKeys?.destroy();
    this.nativeKeys = null;
    clearGwDebug();
  }
}

export function mountVelocityRun(parent: HTMLElement, platform: PlatformSDK, courseIndex = 0) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: Math.max(320, parent.clientWidth || 1280),
    height: Math.max(240, parent.clientHeight || 720),
    backgroundColor: "#071018",
    scale: { mode: Phaser.Scale.RESIZE },
    scene: [VelocityPlayScene],
    disableContextMenu: true,
    banner: false,
    autoFocus: true,
    input: { keyboard: { target: typeof window !== "undefined" ? window : undefined } },
    fps: { target: 60 },
    render: { preserveDrawingBuffer: true },
  });
  game.registry.set("platform", platform);
  game.registry.set("courseIndex", courseIndex);
  game.registry.set("manifest", velocityRunManifest);
  (game as Phaser.Game & { restartRun: () => void }).restartRun = () => {
    game.scene.getScene("velocity-run-play")?.scene.restart();
  };
  game.events.once("destroy", () => {
    const synth = game.registry.get("synth") as Synth | undefined;
    synth?.dispose();
    clearGwDebug();
  });
  return game;
}
