import Phaser from "phaser";
import { Juice, ParticlePool, Synth } from "@gamesweb/game-core";
import type { PlatformSDK } from "@gamesweb/game-sdk";
import { velocityRunManifest } from "@gamesweb/game-sdk";
import { COURSES, medalFor, type Course, type Rect } from "../levels/courses";
import { aabb, Runner } from "../systems/movement";

export class VelocityPlayScene extends Phaser.Scene {
  private platform!: PlatformSDK;
  private course!: Course;
  private courseIndex = 0;
  private runner = new Runner();
  private juice = new Juice();
  private parts = new ParticlePool(180);
  private synth = new Synth();
  private gfx!: Phaser.GameObjects.Graphics;
  private overlay!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private paused = false;
  private ended = false;
  private running = false;
  private startMs = 0;
  private timeMs = 0;
  private deaths = 0;
  private retries = 0;
  private spawn = { x: 100, y: 600 };
  private finish!: Rect;
  private camX = 0;
  private camY = 0;
  private touchMove = 0;
  private touchJump = false;

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
    this.camX = this.spawn.x;
    this.camY = this.spawn.y;
    this.cameras.main.setBackgroundColor("#071018");
    this.gfx = this.add.graphics();
    this.overlay = this.add.graphics().setScrollFactor(0).setDepth(20);
    this.hud = this.add
      .text(24, 20, "", { fontFamily: "ui-sans-serif, system-ui", fontSize: "18px", color: "#e8fbff" })
      .setScrollFactor(0)
      .setDepth(21);
    this.hint = this.add
      .text(this.scale.width / 2, this.scale.height - 70, "A/D TO MOVE  ·  SPACE TO JUMP", {
        fontFamily: "ui-sans-serif, system-ui",
        fontSize: "14px",
        color: "#e8fbff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(21);

    const kb = this.input.keyboard!;
    this.keys = {
      left: kb.addKey("A"),
      left2: kb.addKey("LEFT"),
      right: kb.addKey("D"),
      right2: kb.addKey("RIGHT"),
      jump: kb.addKey("SPACE"),
      jump2: kb.addKey("UP"),
      down: kb.addKey("S"),
      down2: kb.addKey("DOWN"),
      r: kb.addKey("R"),
      esc: kb.addKey("ESC"),
      one: kb.addKey("ONE"),
      two: kb.addKey("TWO"),
      three: kb.addKey("THREE"),
    };

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      void this.synth.resume();
      if (p.y > this.scale.height * 0.62) {
        if (p.x < this.scale.width * 0.33) this.touchMove = -1;
        else if (p.x > this.scale.width * 0.66) this.touchMove = 1;
        else this.touchJump = true;
      } else {
        this.touchJump = true;
      }
    });
    this.input.on("pointerup", () => {
      this.touchMove = 0;
      this.touchJump = false;
    });

    this.platform.session.start();
    this.platform.events.emit({ name: "gameplay_started", props: { gameId: "velocity-run", course: this.course.id } });
    void this.synth.resume().then(() => this.synth.startBed("run"));
    this.game.events.on("platform-pause", () => (this.paused = true));
    this.game.events.on("platform-resume", () => (this.paused = false));
  }

  update(_: number, delta: number) {
    const dt = Math.min(0.033, delta / 1000);
    if (Phaser.Input.Keyboard.JustDown(this.keys.r) || (this.ended && Phaser.Input.Keyboard.JustDown(this.keys.jump))) {
      this.retry();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.one)) this.switchCourse(0);
    if (Phaser.Input.Keyboard.JustDown(this.keys.two)) this.switchCourse(1);
    if (Phaser.Input.Keyboard.JustDown(this.keys.three)) this.switchCourse(2);
    if (Phaser.Input.Keyboard.JustDown(this.keys.esc)) this.platform.pause.request();
    if (this.paused) {
      this.draw();
      return;
    }

    const move =
      Number(this.keys.right.isDown || this.keys.right2.isDown) -
      Number(this.keys.left.isDown || this.keys.left2.isDown) || this.touchMove;
    const jumpDown = Phaser.Input.Keyboard.JustDown(this.keys.jump) || Phaser.Input.Keyboard.JustDown(this.keys.jump2) || this.touchJump;
    if (this.touchJump) this.touchJump = false;
    const jumpHeld = this.keys.jump.isDown || this.keys.jump2.isDown;
    const jumpReleased = Phaser.Input.Keyboard.JustUp(this.keys.jump) || Phaser.Input.Keyboard.JustUp(this.keys.jump2);
    const down = this.keys.down.isDown || this.keys.down2.isDown;

    if (!this.running && (move !== 0 || jumpDown)) {
      this.running = true;
      this.startMs = this.time.now;
      this.hint.setAlpha(0);
    }

    if (!this.ended) {
      const wasGround = this.runner.grounded;
      this.runner.grounded = false;
      this.runner.input(dt, move, jumpDown, jumpHeld, jumpReleased, down, this.time.now);
      this.collide();
      if (this.runner.grounded && !wasGround && this.runner.vy >= 0) {
        this.parts.burst(this.runner.x + 8, this.runner.y + 28, 6, 0x8fdfff, 80, 220);
        this.synth.tone(240, 0.04, "triangle", 0.03);
      }
      if (!wasGround && !this.runner.grounded && this.runner.coyote === 0 && this.runner.vy > 0) {
        /* coyote already set on leave */
      }
      if (wasGround && !this.runner.grounded) this.runner.coyote = this.time.now + 100;

      if (down && this.runner.vy > 80) void this.platform.achievement.unlock("fast-fall");

      if (this.running) this.timeMs = this.time.now - this.startMs;

      if (aabb(this.runner.x, this.runner.y, 16, 28, this.finish.x, this.finish.y, this.finish.w, this.finish.h)) {
        this.win();
      }

      if (this.runner.y > this.course.height + 40) this.die();
    }

    const look = this.runner.facing * 90;
    this.camX += (this.runner.x + look - this.camX) * (1 - Math.exp(-dt * 5.5));
    this.camY += (this.runner.y - 40 - this.camY) * (1 - Math.exp(-dt * 3.2));
    const sh = this.juice.applyCamera({ x: this.camX, y: this.camY }, this.time.now);
    this.cameras.main.centerOn(sh.x, sh.y);
    this.parts.update(dt);
    this.draw();
  }

  private collide() {
    const r = this.runner;
    for (const s of this.course.solids) {
      if (s.kind === "start" || s.kind === "finish") continue;
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
      } else {
        r.land(s.y - r.h);
      }
    }
  }

  private die() {
    if (this.ended) return;
    this.deaths += 1;
    this.juice.hitStop(70);
    this.juice.screenShake(8, 140);
    this.parts.burst(this.runner.x + 8, this.runner.y + 12, 18, 0x3ec6e8, 220, 320);
    this.synth.hit(this.time.now);
    this.time.delayedCall(90, () => {
      this.runner.reset(this.spawn.x, this.spawn.y);
      this.running = false;
      this.timeMs = 0;
      this.hint.setAlpha(0.8);
    });
  }

  private win() {
    if (this.ended) return;
    this.ended = true;
    const medal = medalFor(this.course, this.timeMs);
    this.synth.levelUp();
    void this.platform.achievement.unlock("first-finish");
    if (medal === "bronze" || medal === "gold" || medal === "silver" || medal === "platinum") {
      void this.platform.achievement.unlock("bronze");
    }
    if (medal === "gold" || medal === "platinum") void this.platform.achievement.unlock("gold");
    if (medal === "platinum") void this.platform.achievement.unlock("platinum");
    if (this.courseIndex === 0 && this.timeMs < 40000) void this.platform.achievement.unlock("sub-40");
    if (this.deaths === 0) void this.platform.achievement.unlock("no-death");
    void this.platform.quest.progress("velocity-run:gold", medal === "gold" || medal === "platinum" ? 1 : 0);
    if (this.courseIndex === 0 && this.timeMs < 65000) {
      void this.platform.quest.progress("velocity-run:course-1-under", 65000);
    }
    const played = new Set<number>([this.courseIndex]);
    const prev = this.platform.player.get();
    void prev;
    void this.platform.session.end({
      mode: this.course.id,
      score: Math.floor(this.timeMs),
      result: "finish",
      metadata: {
        medal: medal ?? "none",
        deaths: this.deaths,
        course: this.courseIndex,
        lowerIsBetter: true,
      },
    });
  }

  private retry() {
    this.retries += 1;
    if (this.retries >= 10) void this.platform.achievement.unlock("retry-10");
    this.synth.dispose();
    this.platform.events.emit({ name: "game_retry", props: { gameId: "velocity-run" } });
    this.scene.restart();
  }

  private switchCourse(i: number) {
    this.game.registry.set("courseIndex", i);
    this.synth.dispose();
    this.scene.restart();
  }

  private draw() {
    const g = this.gfx;
    g.clear();
    g.fillStyle(0x0a1822, 1);
    g.fillRect(0, 0, this.course.width, this.course.height);
    g.fillStyle(0x102230, 0.5);
    for (let x = 0; x < this.course.width; x += 80) g.fillRect(x, 0, 1, this.course.height);

    for (const s of this.course.solids) {
      if (s.kind === "solid") {
        g.fillStyle(0x1b3a48, 1);
        g.fillRect(s.x, s.y, s.w, s.h);
        g.fillStyle(0x3ec6e8, 0.35);
        g.fillRect(s.x, s.y, s.w, 3);
      } else if (s.kind === "spike") {
        g.fillStyle(0xd96b6b, 1);
        g.fillTriangle(s.x, s.y + s.h, s.x + s.w / 2, s.y, s.x + s.w, s.y + s.h);
      } else if (s.kind === "finish") {
        g.fillStyle(0x8ff3ff, 0.8);
        g.fillRect(s.x, s.y, s.w, s.h);
      }
    }

    for (const p of this.parts.items) {
      if (!p.active) continue;
      g.fillStyle(p.color, p.life / p.max);
      g.fillCircle(p.x, p.y, p.size);
    }

    const r = this.runner;
    g.fillStyle(0x3ec6e8, 1);
    g.fillRoundedRect(r.x, r.y, r.w, r.h, 4);
    g.fillStyle(0x071018, 1);
    g.fillRect(r.x + (r.facing > 0 ? 9 : 2), r.y + 8, 5, 5);

    const t = (this.timeMs / 1000).toFixed(2);
    const medal = medalFor(this.course, this.timeMs);
    this.hud.setText(
      `${this.course.name}\n${t}s${medal ? `  ${medal}` : ""}\n1–3 change course`,
    );

    this.overlay.clear();
    if (this.sys.game.device.input.touch) {
      this.overlay.fillStyle(0xffffff, 0.05);
      this.overlay.fillRoundedRect(18, this.scale.height - 90, 90, 64, 12);
      this.overlay.fillRoundedRect(this.scale.width / 2 - 44, this.scale.height - 90, 88, 64, 12);
      this.overlay.fillRoundedRect(this.scale.width - 108, this.scale.height - 90, 90, 64, 12);
    }
  }

  shutdown() {
    this.synth.dispose();
  }
}

export function mountVelocityRun(parent: HTMLElement, platform: PlatformSDK, courseIndex = 0) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#071018",
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [VelocityPlayScene],
    disableContextMenu: true,
    banner: false,
    fps: { target: 60 },
  });
  game.registry.set("platform", platform);
  game.registry.set("courseIndex", courseIndex);
  game.registry.set("manifest", velocityRunManifest);
  return game;
}
