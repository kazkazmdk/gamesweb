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
  hashSeed,
  type GameKeyboard,
} from "@gamesweb/game-core";
import { swingVectorManifest, type PlatformSDK } from "@gamesweb/game-sdk";
import {
  COURSES,
  applyMagneticCushions,
  findNearestAnchor,
  medalFor,
  stepSwing,
  type AnchorNode,
  type PilotState,
  type SwingCourse,
} from "../systems/grapple";

const CYAN = 0x38bdf8;
const GOLD = 0xfacc15;
const MAGENTA = 0xe879f9;
const GREEN = 0x4ade80;

type Rival = {
  name: string;
  seconds: number;
  color: number;
  phase: number;
  x: number;
  y: number;
  anchor: AnchorNode;
};

type AfterImage = { x: number; y: number; angle: number; color: number };

const RIVALS: Array<Omit<Rival, "x" | "y" | "anchor">> = [
  { name: "ARC", seconds: 21, color: 0xf472b6, phase: 0.4 },
  { name: "VOLT", seconds: 25, color: 0xa3e635, phase: 1.7 },
  { name: "ECHO", seconds: 30, color: 0xc084fc, phase: 2.9 },
];

function cloneCourse(course: SwingCourse): SwingCourse {
  return {
    ...course,
    medals: { ...course.medals },
    anchors: course.anchors.map((anchor) => ({ ...anchor })),
    rings: course.rings.map((ring) => ({ ...ring, hit: false })),
    hazards: course.hazards.map((hazard) => ({ ...hazard })),
  };
}

function ordinal(rank: number) {
  if (rank === 1) return "1ST";
  if (rank === 2) return "2ND";
  if (rank === 3) return "3RD";
  return `${rank}TH`;
}

function drawCapsule(g: Phaser.GameObjects.Graphics, x: number, y: number, angle: number, color: number, alpha: number) {
  g.save();
  g.translateCanvas(x, y);
  g.rotateCanvas(angle);
  g.fillStyle(0x02070c, alpha * 0.9);
  g.fillRoundedRect(-23, -10, 42, 20, 10);
  g.fillStyle(color, alpha);
  g.fillRoundedRect(-21, -8, 34, 16, 8);
  g.fillStyle(0xe0f2fe, alpha * 0.95);
  g.fillRoundedRect(-6, -5, 13, 9, 4);
  g.fillStyle(GOLD, alpha);
  g.fillTriangle(12, -6, 30, 0, 12, 6);
  g.fillStyle(0xffffff, alpha * 0.55);
  g.fillTriangle(14, -3, 22, 0, 14, 3);
  g.fillStyle(CYAN, alpha * 0.85);
  g.fillTriangle(-20, -4, -33, 0, -20, 4);
  g.restore();
}

export class SwingVectorPlayScene extends Phaser.Scene {
  private platform!: PlatformSDK;
  private course!: SwingCourse;
  private courseIndex = 0;
  private pilot!: PilotState;
  private rivals: Rival[] = [];
  private juice = new Juice();
  private parts!: ParticlePool;
  private synth!: Synth;
  private gfx!: Phaser.GameObjects.Graphics;
  private overlay!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;
  private lockText!: Phaser.GameObjects.Text;
  private resultText!: Phaser.GameObjects.Text;
  private youTag!: Phaser.GameObjects.Text;
  private rivalTags: Phaser.GameObjects.Text[] = [];
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private nativeKeys: GameKeyboard | null = null;
  private paused = false;
  private ended = false;
  private running = false;
  private sessionOpen = false;
  private startMs = 0;
  private timeMs = 0;
  private falls = 0;
  private ringsHit = 0;
  private sonicSnaps = 0;
  private anchorsUsed = new Set<number>();
  private holding = false;
  private holdLatch: boolean | null = null;
  private pointerDown = false;
  private pointerX = 0;
  private signaledReady = false;
  private longFrames = 0;
  private ticks = 0;
  private rank = 1;
  private camX = 0;
  private camY = 0;
  private audioReady = false;
  private hudHidden = false;
  private seed = "swing";
  private bestMs = 0;
  private afterImages: AfterImage[] = [];
  private showcaseUntil = 0;
  private bannerLock = false;
  private bannerT = 0;
  private burst: { x: number; y: number; life: number } | null = null;
  private lockAnchor: AnchorNode | null = null;

  constructor() {
    super("swing-vector-play");
  }

  create() {
    this.platform = this.game.registry.get("platform") as PlatformSDK;
    this.courseIndex = Number(this.game.registry.get("courseIndex") ?? 0);
    const source = COURSES[this.courseIndex] ?? COURSES[0];
    this.courseIndex = Math.max(0, COURSES.indexOf(source));
    this.course = cloneCourse(source);
    this.seed = this.readSeed();
    this.bestMs = this.loadBest();
    this.resetPilot();
    this.rivals = RIVALS.map((rival) => ({
      ...rival,
      x: 120,
      y: this.pilot.y,
      anchor: this.course.anchors[0] ?? { id: 0, x: 200, y: 140, r: 26 },
    }));
    this.paused = false;
    this.ended = false;
    this.running = false;
    this.sessionOpen = false;
    this.timeMs = 0;
    this.falls = 0;
    this.ringsHit = 0;
    this.sonicSnaps = 0;
    this.anchorsUsed = new Set();
    this.holding = false;
    this.holdLatch = null;
    this.signaledReady = false;
    this.longFrames = 0;
    this.ticks = 0;
    this.rank = 1;
    this.hudHidden = false;
    this.afterImages = [];
    this.showcaseUntil = 0;
    this.bannerLock = false;
    this.bannerT = 0;
    this.burst = null;
    this.lockAnchor = null;
    this.camX = 0;
    this.camY = 0;

    this.parts = new ParticlePool(this.sys.game.device.input.touch ? 140 : 220);
    this.synth = (this.game.registry.get("synth") as Synth | undefined) ?? new Synth();
    this.game.registry.set("synth", this.synth);
    this.synth.setSettings(this.platform.audio.getSettings());
    this.cameras.main.setBackgroundColor("#07131e");
    this.gfx = this.add.graphics();
    this.overlay = this.add.graphics().setScrollFactor(0).setDepth(20);
    this.hud = this.add
      .text(22, 86, "", { fontFamily: "ui-sans-serif, system-ui", fontSize: "16px", color: "#e0f2fe", lineSpacing: 4 })
      .setScrollFactor(0)
      .setDepth(22);
    this.hint = this.add
      .text(this.scale.width / 2, this.scale.height - 28, "", {
        fontFamily: "ui-sans-serif, system-ui",
        fontSize: "13px",
        color: "#7dd3fc",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(22);
    this.banner = this.add
      .text(this.scale.width / 2, 179, "", {
        fontFamily: "ui-sans-serif, system-ui",
        fontSize: "15px",
        color: "#facc15",
        fontStyle: "700",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(24);
    this.lockText = this.add
      .text(0, 0, "TARGET LOCK", {
        fontFamily: "ui-sans-serif, system-ui",
        fontSize: "11px",
        color: "#7dd3fc",
        fontStyle: "700",
      })
      .setOrigin(0.5)
      .setDepth(8);
    this.resultText = this.add
      .text(this.scale.width / 2, this.scale.height * 0.42, "", {
        fontFamily: "ui-sans-serif, system-ui",
        fontSize: "28px",
        color: "#f8fafc",
        align: "center",
        fontStyle: "700",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(25)
      .setVisible(false);
    this.youTag = this.add
      .text(0, 0, "YOU", { fontFamily: "ui-sans-serif, system-ui", fontSize: "10px", color: "#facc15", fontStyle: "700" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(23);
    this.rivalTags = RIVALS.map((rival) =>
      this.add
        .text(0, 0, rival.name, { fontFamily: "ui-sans-serif, system-ui", fontSize: "11px", color: "#f8fafc", fontStyle: "700" })
        .setOrigin(0.5)
        .setDepth(7),
    );

    const kb = this.input.keyboard;
    if (kb) {
      this.keys = {
        left: kb.addKey("A"),
        left2: kb.addKey("LEFT"),
        right: kb.addKey("D"),
        right2: kb.addKey("RIGHT"),
        jump: kb.addKey("SPACE"),
        up: kb.addKey("UP"),
        w: kb.addKey("W"),
        r: kb.addKey("R"),
        esc: kb.addKey("ESC"),
        one: kb.addKey("ONE"),
        two: kb.addKey("TWO"),
        three: kb.addKey("THREE"),
      };
    }
    this.nativeKeys?.destroy();
    this.nativeKeys = createGameKeyboard();
    this.game.canvas.tabIndex = 0;
    this.game.canvas.focus({ preventScroll: true });
    this.input.addPointer(2);

    this.scale.on("resize", () => {
      this.hint.setPosition(this.scale.width / 2, this.scale.height - 28);
      this.banner.setPosition(this.scale.width / 2, 179);
      this.resultText.setPosition(this.scale.width / 2, this.scale.height * 0.42);
    });
    this.game.events.on("platform-pause", this.onPause, this);
    this.game.events.on("platform-resume", this.onResume, this);
    this.platform.events.emit({ name: "gameplay_started", props: { gameId: "swing-vector", course: this.course.id } });
    this.layoutRivals(0);
    this.focusCamera(true);
    this.draw();
  }

  private onPause = () => {
    this.paused = true;
  };
  private onResume = () => {
    this.paused = false;
  };

  private readSeed() {
    try {
      const seed = this.platform.run?.context().seed;
      if (seed) return seed;
    } catch {
      /* noop */
    }
    return `${this.course.id}-${(hashSeed(this.course.id) % 999983).toString(16)}`;
  }

  private loadBest() {
    try {
      return Number(localStorage.getItem(`gw:swing-best:${this.course.id}`) ?? 0) || 0;
    } catch {
      return 0;
    }
  }

  private resetPilot() {
    const mid = (this.course.ceilingY + this.course.floorY) * 0.42;
    this.pilot = {
      x: 96,
      y: mid,
      vx: 150,
      vy: 0,
      attachedId: null,
      ropeLen: 0,
      angleAccum: 0,
      prevAngle: 0,
      slingshotReady: false,
      boostTimer: 0,
    };
  }

  private openSession() {
    if (this.sessionOpen) return;
    this.sessionOpen = true;
    this.platform.session.start();
  }

  private ensureAudio() {
    if (this.audioReady) return;
    this.audioReady = true;
    void this.synth.resume().then(() => this.synth.startBed("run"));
  }

  update(_time: number, delta: number) {
    const dt = Math.min(0.033, delta / 1000);
    this.longFrames = countLongFrame(delta, this.longFrames);
    this.ticks += 1;
    if (!this.signaledReady) {
      this.signaledReady = true;
      this.platform.events.emit({ name: "game_ready", props: { gameId: "swing-vector" } });
    }
    const native = this.nativeKeys?.read();
    if (native?.retryPressed || (this.keys && Phaser.Input.Keyboard.JustDown(this.keys.r))) {
      this.restartCourse();
      return;
    }
    if (native?.onePressed || (this.keys && Phaser.Input.Keyboard.JustDown(this.keys.one))) this.switchCourse(0);
    else if (native?.twoPressed || (this.keys && Phaser.Input.Keyboard.JustDown(this.keys.two))) this.switchCourse(1);
    else if (native?.threePressed || (this.keys && Phaser.Input.Keyboard.JustDown(this.keys.three))) this.switchCourse(2);
    if (this.keys && Phaser.Input.Keyboard.JustDown(this.keys.esc)) this.paused = !this.paused;

    this.readPointer();
    const now = this.time.now;
    const showcasing = now < this.showcaseUntil;
    if (!showcasing && !this.ended && !this.paused) {
      const air = this.readAir(native);
      const jumpHeld =
        (this.keys?.jump.isDown ?? false) ||
        (this.keys?.up.isDown ?? false) ||
        (this.keys?.w.isDown ?? false) ||
        Boolean(native?.jump || native?.up) ||
        this.pointerDown;
      this.holding = this.holdLatch ?? jumpHeld;
      if (!this.running && (this.holding || air !== 0)) {
        this.running = true;
        this.startMs = now;
        this.bannerLock = false;
        this.openSession();
        this.ensureAudio();
      }
      if (this.running) {
        this.timeMs = now - this.startMs;
        this.simulate(dt, air);
      }
    } else if (showcasing) {
      this.holding = true;
    }

    if (this.bannerT > 0) this.bannerT = Math.max(0, this.bannerT - dt);
    if (this.burst) {
      this.burst.life -= dt;
      if (this.burst.life <= 0) this.burst = null;
    }
    this.parts.update(dt);
    this.layoutRivals(this.timeMs / 1000);
    if (showcasing) this.rank = 1;
    if (!showcasing && this.running) this.rememberPose();
    this.focusCamera(false);
    this.draw();
    this.publishDebug();
  }

  private readPointer() {
    const pointers = [this.input.pointer1, this.input.pointer2];
    const active = pointers.find((pointer) => pointer?.isDown);
    this.pointerDown = Boolean(active);
    if (active) this.pointerX = active.x;
  }

  private readAir(native: ReturnType<GameKeyboard["read"]> | undefined) {
    const left = (this.keys?.left.isDown ?? false) || (this.keys?.left2.isDown ?? false) || Boolean(native?.left);
    const right = (this.keys?.right.isDown ?? false) || (this.keys?.right2.isDown ?? false) || Boolean(native?.right);
    let air = Number(right) - Number(left);
    if (air === 0 && this.pointerDown) {
      if (this.pointerX < this.scale.width * 0.2) air = -1;
      else if (this.pointerX > this.scale.width * 0.8) air = 1;
    }
    return clamp(air, -1, 1);
  }

  private simulate(dt: number, air: number) {
    const previousId = this.pilot.attachedId;
    const anchor = this.holding ? this.lockedOrNearest() : null;
    const result = stepSwing(this.pilot, anchor, dt, this.holding, air);
    if (this.pilot.attachedId != null && this.pilot.attachedId !== previousId) {
      this.anchorsUsed.add(this.pilot.attachedId);
      this.synth.tone(620, 0.05, "square", 0.035, 0.04);
      pulseHaptic(8);
    }
    if (result.released) {
      this.synth.boostWhoosh();
      if (result.sonicSnap) {
        this.sonicSnaps += 1;
        this.juice.flash(0.22);
        this.juice.screenShake(8, 140);
        this.juice.hitStop(28);
        this.synth.levelUp();
        pulseHaptic([12, 24, 16]);
        this.bannerT = 0.85;
        this.banner.setText("SONIC SNAP");
        this.parts.burst(this.pilot.x, this.pilot.y, 18, GOLD, 260, 360);
      }
    }
    if (this.pilot.attachedId == null) {
      const bounce = applyMagneticCushions(this.pilot, this.course.ceilingY, this.course.floorY);
      if (bounce) {
        this.parts.burst(this.pilot.x, this.pilot.y, 8, bounce === "floor" ? GOLD : CYAN, 140, 240);
        if (result.speed > 480) this.juice.cameraPunch(0.35);
      }
    }
    this.collectRings();
    if (this.pilotHitsHazard() || this.pilot.y > this.course.floorY + 90 || this.pilot.y < this.course.ceilingY - 80) {
      this.respawnFall();
      return;
    }
    if (this.pilot.x >= this.course.length) this.win();
  }

  private lockedOrNearest() {
    if (this.pilot.attachedId != null) {
      return this.course.anchors.find((anchor) => anchor.id === this.pilot.attachedId) ?? null;
    }
    return findNearestAnchor(this.pilot.x, this.pilot.y, this.course.anchors);
  }

  private collectRings() {
    for (const ring of this.course.rings) {
      if (ring.hit) continue;
      if (Math.hypot(this.pilot.x - ring.x, this.pilot.y - ring.y) > ring.r + 16) continue;
      ring.hit = true;
      this.pilot.vx += 140;
      this.ringsHit += 1;
      this.parts.burst(ring.x, ring.y, 24, GOLD, 300, 480);
      this.parts.burst(ring.x, ring.y, 16, GREEN, 220, 420);
      this.burst = { x: ring.x, y: ring.y, life: 0.45 };
      this.synth.pickup();
      this.juice.flash(0.08);
      pulseHaptic(10);
    }
  }

  private pilotHitsHazard() {
    const body = 12;
    return this.course.hazards.some(
      (hazard) =>
        this.pilot.x > hazard.x - body &&
        this.pilot.x < hazard.x + hazard.w + body &&
        this.pilot.y > hazard.y - body &&
        this.pilot.y < hazard.y + hazard.h + body,
    );
  }

  private respawnFall() {
    if (this.ended) return;
    this.falls += 1;
    this.showcaseUntil = 0;
    this.bannerLock = false;
    this.holdLatch = null;
    this.holding = false;
    this.juice.screenShake(9, 160);
    this.juice.flash(0.18);
    this.parts.burst(this.pilot.x, this.pilot.y, 20, MAGENTA, 240, 320);
    this.synth.crash(0.75);
    pulseHaptic(18);
    const safe = [...this.course.anchors].reverse().find((anchor) => anchor.x < this.pilot.x - 80) ?? this.course.anchors[0];
    this.pilot.x = Math.max(88, (safe?.x ?? 120) - 16);
    this.pilot.y = (safe?.y ?? 160) + 168;
    this.pilot.vx = 170;
    this.pilot.vy = -16;
    this.pilot.attachedId = null;
    this.pilot.ropeLen = 0;
    this.pilot.angleAccum = 0;
    this.pilot.prevAngle = 0;
    this.pilot.slingshotReady = false;
    this.afterImages = [];
    this.platform.events.emit({ name: "fall", props: { gameId: "swing-vector", falls: this.falls } });
  }

  private win() {
    if (this.ended) return;
    this.ended = true;
    this.showcaseUntil = 0;
    this.bannerLock = false;
    this.running = true;
    this.holding = false;
    this.holdLatch = null;
    this.juice.flash(0.16);
    this.synth.finishSting();
    pulseHaptic([10, 30, 18]);
    const medal = medalFor(this.course, this.timeMs);
    if (this.bestMs === 0 || this.timeMs < this.bestMs) {
      this.bestMs = this.timeMs;
      try {
        localStorage.setItem(`gw:swing-best:${this.course.id}`, String(Math.round(this.timeMs)));
      } catch {
        /* noop */
      }
      this.synth.personalBest();
    }
    void this.platform.achievement.unlock("first-swing");
    if (this.sonicSnaps > 0) void this.platform.achievement.unlock("sonic-snap");
    if (this.falls === 0) void this.platform.achievement.unlock("clean-canyon");
    if (this.course.id === "canyon-1" && this.timeMs < 24000) void this.platform.achievement.unlock("sub-24");
    this.platform.events.emit({
      name: "finish",
      props: { gameId: "swing-vector", timeMs: Math.round(this.timeMs), medal: medal ?? "none" },
    });
    const headline = medal ? medal.toUpperCase() : "FINISH";
    this.resultText.setText(`${this.course.name.toUpperCase()}  ·  ${headline}\n${(this.timeMs / 1000).toFixed(2)}s`);
    this.openSession();
    void this.platform.session.end({
      mode: this.course.id,
      score: Math.max(6500, Math.round(this.timeMs)),
      result: "finish",
      metadata: {
        anchorsUsed: this.anchorsUsed.size,
        ringsHit: this.ringsHit,
        sonicSnaps: this.sonicSnaps,
        falls: this.falls,
        courseId: this.course.id,
        seed: this.seed,
      },
    });
  }

  private layoutRivals(timeSec: number) {
    const span = Math.max(1, this.course.length - 160);
    for (const rival of this.rivals) {
      const along = 110 + clamp(timeSec / rival.seconds, 0, 1) * span;
      let anchor = this.course.anchors[0];
      let best = Infinity;
      for (const candidate of this.course.anchors) {
        const distance = Math.abs(candidate.x - along);
        if (distance < best) {
          best = distance;
          anchor = candidate;
        }
      }
      if (!anchor) continue;
      const swing = Math.sin(timeSec * 2.5 + rival.phase);
      const angle = swing * 0.95;
      const rope = 172;
      rival.anchor = anchor;
      rival.x = along * 0.62 + (anchor.x + Math.sin(angle) * rope) * 0.38;
      rival.y = clamp(anchor.y + Math.cos(angle) * rope, this.course.ceilingY + 36, this.course.floorY - 90);
    }
    let ahead = 0;
    for (const rival of this.rivals) if (rival.x > this.pilot.x + 10) ahead += 1;
    this.rank = ahead + 1;
  }

  private rememberPose() {
    const angle = Math.atan2(this.pilot.vy, this.pilot.vx);
    this.afterImages.push({
      x: this.pilot.x,
      y: this.pilot.y,
      angle,
      color: this.ticks % 2 === 0 ? CYAN : MAGENTA,
    });
    while (this.afterImages.length > 7) this.afterImages.shift();
  }

  private focusCamera(snap: boolean) {
    const width = this.scale.width;
    const height = this.scale.height;
    const look = clamp(this.pilot.vx * 0.16, -30, 240);
    const desiredX = this.pilot.x + look - width * 0.38;
    const desiredY = this.pilot.y - height * 0.46;
    const maxX = Math.max(0, this.course.length + 220 - width);
    const maxY = Math.max(0, this.course.floorY + 48 - height);
    if (snap) {
      this.camX = desiredX;
      this.camY = desiredY;
    } else {
      this.camX += (desiredX - this.camX) * 0.14;
      this.camY += (desiredY - this.camY) * 0.12;
    }
    this.camX = clamp(this.camX, 0, maxX);
    this.camY = clamp(this.camY, -30, maxY);
    const shaken = this.juice.applyCamera({ x: this.camX, y: this.camY }, this.time.now);
    this.cameras.main.setScroll(shaken.x, shaken.y);
  }

  private draw() {
    const g = this.gfx;
    g.clear();
    const sx = this.cameras.main.scrollX;
    const sy = this.cameras.main.scrollY;
    const width = this.scale.width;
    const height = this.scale.height;
    const time = this.time.now / 1000;
    this.drawCanyon(g, sx, sy, width, height, time);
    this.drawGrids(g, sx, width);
    this.drawHazards(g, time);
    this.drawRings(g, time);
    this.drawFinish(g, time);
    this.drawAnchors(g, time);
    this.drawRivals(g, time);
    this.drawCable(g, time);
    this.drawBurst(g);
    const speed = Math.hypot(this.pilot.vx, this.pilot.vy);
    const angle = Math.atan2(this.pilot.vy, this.pilot.vx || 1);
    this.drawAfterImages(g);
    if (speed > 420 || this.pilot.boostTimer > 0) this.drawSpeedCone(g, angle, speed);
    drawParticles(g, this.parts);
    drawCapsule(g, this.pilot.x, this.pilot.y, angle, this.pilot.slingshotReady ? GOLD : 0xe0f2fe, 1);
    this.drawHud(speed);
  }

  private drawCanyon(g: Phaser.GameObjects.Graphics, sx: number, sy: number, width: number, height: number, time: number) {
    g.fillStyle(0x07131e, 1);
    g.fillRect(sx - 8, sy - 8, width + 16, height * 0.36);
    g.fillStyle(0x0d2236, 1);
    g.fillRect(sx - 8, sy + height * 0.34, width + 16, height * 0.36);
    g.fillStyle(0x050b12, 1);
    g.fillRect(sx - 8, sy + height * 0.66, width + 16, height * 0.38);
    g.lineStyle(22, 0x7dd3fc, 0.045);
    for (let i = 0; i < 6; i += 1) {
      const beam = sx * 0.35 + i * 260 + Math.sin(time * 0.3 + i) * 20;
      const x = sx + ((beam - sx) % (width + 320)) - 80;
      g.lineBetween(x, sy - 10, x + height * 0.42, sy + height + 10);
    }
    this.drawRidge(g, sx, sy, width, height, 0.18, 0x123044, 0.95, sy + height * 0.58, 46, 28);
    this.drawRidge(g, sx, sy, width, height, 0.38, 0x0d2236, 1, sy + height * 0.72, 34, 22);
    this.drawRidge(g, sx, sy, width, height, 0.62, 0x071018, 1, this.course.floorY - 18, 16, 18);
    g.fillStyle(0x38bdf8, 0.05);
    g.fillRect(sx, this.course.ceilingY - 8, width, 28);
    g.fillStyle(0xfacc15, 0.05);
    g.fillRect(sx, this.course.floorY - 16, width, 28);
  }

  private drawRidge(
    g: Phaser.GameObjects.Graphics,
    sx: number,
    sy: number,
    width: number,
    height: number,
    parallax: number,
    color: number,
    alpha: number,
    base: number,
    amp: number,
    step: number,
  ) {
    g.fillStyle(color, alpha);
    g.beginPath();
    g.moveTo(sx - 4, sy + height + 4);
    for (let x = sx - 8; x <= sx + width + 8; x += step) {
      const world = x + sx * parallax;
      const y = base + Math.sin(world * 0.012) * amp + Math.sin(world * 0.005 + 1.4) * amp * 0.45;
      g.lineTo(x, y);
    }
    g.lineTo(sx + width + 4, sy + height + 4);
    g.closePath();
    g.fillPath();
  }

  private drawGrids(g: Phaser.GameObjects.Graphics, sx: number, width: number) {
    const x0 = Math.floor(sx / 42) * 42;
    g.lineStyle(1.5, CYAN, 0.35);
    g.lineBetween(sx, this.course.ceilingY + 16, sx + width, this.course.ceilingY + 16);
    g.lineStyle(1, CYAN, 0.2);
    for (let x = x0; x < sx + width; x += 42) g.lineBetween(x, this.course.ceilingY, x, this.course.ceilingY + 16);
    g.lineStyle(2, GOLD, 0.28);
    g.lineBetween(sx, this.course.floorY, sx + width, this.course.floorY);
    g.lineStyle(1, GOLD, 0.16);
    for (let x = x0; x < sx + width; x += 28) g.lineBetween(x, this.course.floorY - 10, x, this.course.floorY + 8);
  }

  private drawHazards(g: Phaser.GameObjects.Graphics, time: number) {
    for (const hazard of this.course.hazards) {
      const pulse = 0.75 + Math.sin(time * 6 + hazard.x * 0.01) * 0.2;
      g.fillStyle(0xfb7185, 0.18 * pulse);
      g.fillRoundedRect(hazard.x - 4, hazard.y - 4, hazard.w + 8, hazard.h + 8, 6);
      g.fillStyle(0x9f1239, 0.95);
      g.fillRoundedRect(hazard.x, hazard.y, hazard.w, hazard.h, 4);
      g.fillStyle(0xffe4e6, 0.75);
      if (hazard.w > hazard.h) {
        for (let x = hazard.x + 8; x < hazard.x + hazard.w - 8; x += 16) {
          g.fillTriangle(x, hazard.y + 3, x + 6, hazard.y + hazard.h - 3, x + 12, hazard.y + 3);
        }
      } else {
        g.fillRect(hazard.x + hazard.w * 0.35, hazard.y + 6, Math.max(3, hazard.w * 0.25), hazard.h - 12);
      }
    }
  }

  private drawRings(g: Phaser.GameObjects.Graphics, time: number) {
    for (const ring of this.course.rings) {
      const spin = time * 2.2 + ring.id;
      if (ring.hit) {
        g.lineStyle(1.5, GOLD, 0.3);
        g.strokeCircle(ring.x, ring.y, ring.r * 0.45);
        continue;
      }
      g.lineStyle(7, GREEN, 0.22);
      g.strokeCircle(ring.x, ring.y, ring.r);
      g.lineStyle(2.4, GOLD, 0.95);
      g.strokeCircle(ring.x, ring.y, ring.r - 7);
      g.lineStyle(2, GREEN, 0.9);
      for (let i = 0; i < 8; i += 1) {
        const angle = spin + (i / 8) * Math.PI * 2;
        g.lineBetween(
          ring.x + Math.cos(angle) * (ring.r - 2),
          ring.y + Math.sin(angle) * (ring.r - 2),
          ring.x + Math.cos(angle) * (ring.r + 9),
          ring.y + Math.sin(angle) * (ring.r + 9),
        );
      }
      g.fillStyle(GOLD, 0.08);
      g.fillCircle(ring.x, ring.y, ring.r - 12);
    }
  }

  private drawFinish(g: Phaser.GameObjects.Graphics, time: number) {
    const x = this.course.length;
    const top = this.course.ceilingY + 28;
    const bottom = this.course.floorY - 8;
    g.fillStyle(CYAN, 0.08 + Math.sin(time * 4) * 0.03);
    g.fillRect(x - 18, top, 36, bottom - top);
    g.fillStyle(0x07131e, 1);
    g.fillRoundedRect(x - 16, top - 16, 18, bottom - top + 20, 4);
    g.fillRoundedRect(x + 28, top - 16, 18, bottom - top + 20, 4);
    g.fillStyle(GOLD, 1);
    g.fillRoundedRect(x - 20, top - 20, 66, 22, 4);
    for (let col = 0; col < 8; col += 1) {
      for (let row = 0; row < 2; row += 1) {
        g.fillStyle((col + row) % 2 === 0 ? 0xf8fafc : 0x111827, 1);
        g.fillRect(x - 16 + col * 7, top - 16 + row * 8, 7, 8);
      }
    }
  }

  private drawAnchors(g: Phaser.GameObjects.Graphics, time: number) {
    const nearest = this.pilot.attachedId != null
      ? this.course.anchors.find((anchor) => anchor.id === this.pilot.attachedId) ?? null
      : findNearestAnchor(this.pilot.x, this.pilot.y, this.course.anchors);
    this.lockAnchor = nearest;
    for (const anchor of this.course.anchors) {
      const locked = nearest?.id === anchor.id;
      const pulse = 0.65 + Math.sin(time * 3 + anchor.id) * 0.25;
      g.fillStyle(locked ? GOLD : CYAN, 0.08 * pulse);
      g.fillCircle(anchor.x, anchor.y, anchor.r + 48);
      g.lineStyle(2, CYAN, locked ? 0.7 : 0.28);
      g.strokeCircle(anchor.x, anchor.y, anchor.r + 26 + Math.sin(time * 4 + anchor.id) * 3);
      g.fillStyle(0x082033, 1);
      g.fillRoundedRect(anchor.x - 7, anchor.y, 14, 58, 4);
      g.fillStyle(0x155e75, 1);
      g.fillRoundedRect(anchor.x - 4, anchor.y + 6, 8, 46, 3);
      g.save();
      g.translateCanvas(anchor.x, anchor.y);
      g.rotateCanvas(time * 1.7 + anchor.id);
      g.fillStyle(GOLD, 1);
      g.fillRoundedRect(-anchor.r, -3.5, anchor.r * 2, 7, 3);
      g.fillStyle(CYAN, 1);
      g.fillRoundedRect(-3.5, -anchor.r, 7, anchor.r * 2, 3);
      g.restore();
      g.fillStyle(0xffffff, 0.95);
      g.fillCircle(anchor.x, anchor.y, 4.5);
      if (!locked) continue;
      const reach = anchor.r + 24;
      const color = this.pilot.slingshotReady ? GOLD : CYAN;
      g.lineStyle(2.2, color, 0.95);
      const corners = [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ] as const;
      for (const [sx, sy] of corners) {
        const cx = anchor.x + sx * reach;
        const cy = anchor.y + sy * reach;
        g.lineBetween(cx, cy, cx - sx * 12, cy);
        g.lineBetween(cx, cy, cx, cy - sy * 12);
      }
      g.strokeCircle(anchor.x, anchor.y, 11 + Math.sin(time * 8) * 1.5);
    }
  }

  private drawRivals(g: Phaser.GameObjects.Graphics, time: number) {
    this.rivalTags.forEach((tag, index) => {
      const rival = this.rivals[index];
      if (!rival || this.hudHidden) {
        tag.setVisible(false);
        return;
      }
      g.lineStyle(2, rival.color, 0.75);
      g.lineBetween(rival.anchor.x, rival.anchor.y, rival.x, rival.y);
      g.lineStyle(5, rival.color, 0.15);
      g.lineBetween(rival.anchor.x, rival.anchor.y, rival.x, rival.y);
      const angle = Math.sin(time * 3 + rival.phase);
      drawCapsule(g, rival.x, rival.y, angle * 0.4 + 0.2, rival.color, 0.92);
      tag.setPosition(rival.x, rival.y - 28).setVisible(true);
      tag.setColor("#f8fafc");
    });
  }

  private drawCable(g: Phaser.GameObjects.Graphics, time: number) {
    if (this.pilot.attachedId == null) return;
    const anchor = this.course.anchors.find((item) => item.id === this.pilot.attachedId);
    if (!anchor) return;
    const charged = this.pilot.slingshotReady;
    const color = charged ? GOLD : CYAN;
    const theta = Math.atan2(this.pilot.x - anchor.x, this.pilot.y - anchor.y);
    const radius = Math.max(this.pilot.ropeLen, 40);
    g.lineStyle(1.4, color, 0.45);
    const steps = 16;
    for (let i = 0; i < steps; i += 2) {
      const a0 = theta - 1.15 + (i / steps) * 2.3;
      const a1 = a0 + 2.3 / steps * 0.55;
      g.lineBetween(
        anchor.x + Math.sin(a0) * radius,
        anchor.y + Math.cos(a0) * radius,
        anchor.x + Math.sin(a1) * radius,
        anchor.y + Math.cos(a1) * radius,
      );
    }
    g.lineStyle(8, color, charged ? 0.28 : 0.16);
    g.lineBetween(anchor.x, anchor.y, this.pilot.x, this.pilot.y);
    g.lineStyle(2.6, color, 0.96);
    g.lineBetween(anchor.x, anchor.y, this.pilot.x, this.pilot.y);
    g.lineStyle(1, 0xffffff, 0.8);
    g.lineBetween(anchor.x, anchor.y, this.pilot.x, this.pilot.y);
    if (charged && this.ticks % 3 === 0) {
      const t = 0.35 + Math.sin(time * 9) * 0.2;
      this.parts.emit({
        x: anchor.x + (this.pilot.x - anchor.x) * t,
        y: anchor.y + (this.pilot.y - anchor.y) * t,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 40,
        life: 220,
        size: 2,
        color: GOLD,
      });
    }
  }

  private drawBurst(g: Phaser.GameObjects.Graphics) {
    if (!this.burst) return;
    const life = clamp(this.burst.life / 0.45, 0, 1);
    const radius = 18 + (1 - life) * 54;
    g.lineStyle(3, GOLD, life);
    g.strokeCircle(this.burst.x, this.burst.y, radius);
    g.lineStyle(2, GREEN, life * 0.8);
    g.strokeCircle(this.burst.x, this.burst.y, radius * 0.65);
  }

  private drawAfterImages(g: Phaser.GameObjects.Graphics) {
    const count = this.afterImages.length;
    for (let i = 0; i < count; i += 1) {
      const ghost = this.afterImages[i];
      if (!ghost) continue;
      drawCapsule(g, ghost.x, ghost.y, ghost.angle, ghost.color, ((i + 1) / count) * 0.38);
    }
  }

  private drawSpeedCone(g: Phaser.GameObjects.Graphics, angle: number, speed: number) {
    const alpha = clamp((speed - 380) / 500, 0.15, 0.4);
    g.save();
    g.translateCanvas(this.pilot.x, this.pilot.y);
    g.rotateCanvas(angle);
    g.fillStyle(this.pilot.boostTimer > 0 ? GOLD : CYAN, alpha);
    g.fillTriangle(-18, -12, -78, 0, -18, 12);
    g.fillStyle(MAGENTA, alpha * 0.45);
    g.fillTriangle(-10, -7, -52, 0, -10, 7);
    g.restore();
  }

  private drawHud(speed: number) {
    const touch = this.sys.game.device.input.touch;
    const medal = this.ended ? medalFor(this.course, this.timeMs) : null;
    const liveBanner =
      this.pilot.slingshotReady && this.pilot.attachedId != null
        ? `SONIC SNAP CHARGED · POS ${ordinal(this.rank)} / 4`
        : "";
    if (this.ended) this.bannerLock = false;
    if (!this.hudHidden && !this.ended && this.bannerLock) {
      this.banner.setText("SONIC SNAP CHARGED · POS 1ST / 4").setVisible(true);
    } else if (!this.hudHidden && !this.ended && this.bannerT > 0 && this.banner.text === "SONIC SNAP") {
      this.banner.setVisible(true);
    } else if (!this.hudHidden && !this.ended && liveBanner) {
      this.banner.setText(liveBanner).setVisible(true);
    } else {
      this.banner.setVisible(false);
    }
    const best = this.bestMs > 0 ? `   PB ${(this.bestMs / 1000).toFixed(2)}s` : "";
    const medalLabel = medal ? `   ${medal.toUpperCase()}` : "";
    this.hud.setText(
      `${this.course.name.toUpperCase()}   ${this.course.subtitle}\n${(this.timeMs / 1000).toFixed(2)}s   POS ${ordinal(this.rank)} / 4   ${Math.round(speed)} PX/S${medalLabel}${best}\nRINGS ${this.ringsHit}   SNAPS ${this.sonicSnaps}   FALLS ${this.falls}`,
    );
    this.hint.setText(touch ? "HOLD TO GRAPPLE   ·   EDGES STEER" : "HOLD SPACE / CLICK TO GRAPPLE   ·   A D AIR   ·   1 2 3 CANYON   ·   R RETRY");
    this.hud.setVisible(!this.hudHidden);
    this.hint.setVisible(!this.hudHidden && !this.running);
    this.resultText.setVisible(!this.hudHidden && this.ended);
    if (this.lockAnchor && !this.hudHidden) {
      this.lockText
        .setPosition(this.lockAnchor.x, this.lockAnchor.y - 52)
        .setVisible(true)
        .setColor(this.pilot.slingshotReady ? "#facc15" : "#7dd3fc");
    } else {
      this.lockText.setVisible(false);
    }

    this.overlay.clear();
    if (!this.hudHidden) {
      this.drawRaceProgressBar();
      const panelW = Math.min(460, this.scale.width - 28);
      this.overlay.fillStyle(0x07131e, 0.72);
      this.overlay.fillRoundedRect(14, 78, panelW, 74, 12);
      this.overlay.lineStyle(1.6, this.rank === 1 ? GOLD : CYAN, 0.9);
      this.overlay.strokeRoundedRect(14, 78, panelW, 74, 12);
      if (this.banner.visible) {
        const pillW = Math.min(460, this.scale.width - 28);
        const pillX = this.scale.width * 0.5 - pillW * 0.5;
        this.overlay.fillStyle(0x07131e, 0.9);
        this.overlay.fillRoundedRect(pillX, 164, pillW, 30, 15);
        this.overlay.lineStyle(1.6, GOLD, 0.95);
        this.overlay.strokeRoundedRect(pillX, 164, pillW, 30, 15);
      }
      if (touch) {
        this.overlay.fillStyle(0xffffff, 0.04);
        this.overlay.fillRoundedRect(8, this.scale.height * 0.28, this.scale.width * 0.16, this.scale.height * 0.48, 16);
        this.overlay.fillRoundedRect(this.scale.width * 0.84 - 8, this.scale.height * 0.28, this.scale.width * 0.16, this.scale.height * 0.48, 16);
      }
    } else {
      this.youTag.setVisible(false);
    }
    const flash = this.juice.flashAlpha(0.016);
    if (flash) {
      this.overlay.fillStyle(0xffffff, flash);
      this.overlay.fillRect(0, 0, this.scale.width, this.scale.height);
    }
  }

  private drawRaceProgressBar() {
    const o = this.overlay;
    const width = this.scale.width;
    const barW = Math.min(460, width - 36);
    const barH = 24;
    const barX = width * 0.5 - barW * 0.5;
    const barY = 14;
    o.fillStyle(0x07131e, 0.88);
    o.fillRoundedRect(barX, barY, barW, barH, 12);
    o.lineStyle(1.7, this.rank === 1 ? GOLD : CYAN, 0.95);
    o.strokeRoundedRect(barX, barY, barW, barH, 12);
    const trackLeft = barX + 16;
    const trackRight = barX + barW - 28;
    const trackSpan = Math.max(1, trackRight - trackLeft);
    const midY = barY + barH * 0.5;
    const norm = (x: number) => clamp(x / this.course.length, 0, 1);
    const playerU = norm(this.pilot.x);
    o.fillStyle(0xffffff, 0.14);
    o.fillRoundedRect(trackLeft, midY - 2, trackSpan, 4, 2);
    o.fillStyle(this.rank === 1 ? GOLD : CYAN, 0.7);
    o.fillRoundedRect(trackLeft, midY - 2, Math.max(4, trackSpan * playerU), 4, 2);
    for (const anchor of this.course.anchors) {
      const tick = trackLeft + norm(anchor.x) * trackSpan;
      o.fillStyle(0x7dd3fc, 0.45);
      o.fillRect(tick, midY - 5, 2, 10);
    }
    const flagX = trackRight + 8;
    o.fillStyle(GOLD, 0.95);
    o.fillRect(flagX - 2, barY + 5, 2, 14);
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        o.fillStyle((row + col) % 2 === 0 ? 0xf8fafc : 0x111827, 1);
        o.fillRect(flagX + col * 3.2, barY + 5 + row * 4, 3.2, 4);
      }
    }
    for (const rival of this.rivals) {
      const rx = trackLeft + norm(rival.x) * trackSpan;
      o.fillStyle(0x02070c, 0.9);
      o.fillCircle(rx, midY, 5.2);
      o.fillStyle(rival.color, 1);
      o.fillCircle(rx, midY, 3.6);
    }
    const px = trackLeft + playerU * trackSpan;
    o.fillStyle(0x02070c, 0.95);
    o.fillCircle(px, midY, 7);
    o.fillStyle(GOLD, 1);
    o.fillCircle(px, midY, 5.2);
    o.fillStyle(CYAN, 1);
    o.fillCircle(px, midY, 2.2);
    if (this.rank === 1) {
      o.fillStyle(GOLD, 1);
      o.fillTriangle(px - 5, midY - 6, px, midY - 12, px + 5, midY - 6);
    }
    this.youTag.setPosition(px, barY - 2).setOrigin(0.5, 1).setVisible(true);
  }

  private stageMidSwing() {
    const anchor = this.course.anchors.reduce((best, candidate) =>
      Math.abs(candidate.x - 1280) < Math.abs(best.x - 1280) ? candidate : best,
    );
    this.ended = false;
    this.paused = false;
    this.running = true;
    this.bannerLock = true;
    this.bannerT = 0;
    this.hudHidden = false;
    this.timeMs = 4200;
    this.startMs = this.time.now - 4200;
    this.openSession();
    this.pilot.x = 1280;
    this.pilot.y = anchor.y + 214;
    this.pilot.vx = 640;
    this.pilot.vy = -120;
    this.pilot.attachedId = anchor.id;
    this.pilot.ropeLen = Math.hypot(this.pilot.x - anchor.x, this.pilot.y - anchor.y);
    this.pilot.angleAccum = Math.PI * 1.5;
    this.pilot.prevAngle = Math.atan2(this.pilot.x - anchor.x, this.pilot.y - anchor.y);
    this.pilot.slingshotReady = true;
    this.pilot.boostTimer = 0.65;
    this.holding = true;
    this.holdLatch = null;
    this.showcaseUntil = this.time.now + 1800;
    this.rank = 1;
    this.afterImages = Array.from({ length: 7 }, (_, index) => ({
      x: 1280 - (7 - index) * 18,
      y: this.pilot.y + (7 - index) * 3.5,
      angle: -0.18,
      color: index % 2 === 0 ? CYAN : MAGENTA,
    }));
    const ring = this.course.rings.reduce((best, candidate) =>
      Math.abs(candidate.x - 1280) < Math.abs(best.x - 1280) ? candidate : best,
    );
    ring.hit = true;
    this.burst = { x: ring.x, y: ring.y, life: 0.7 };
    this.parts.burst(ring.x, ring.y, 28, GOLD, 340, 560);
    this.parts.burst(ring.x, ring.y, 18, GREEN, 240, 480);
    this.banner.setText("SONIC SNAP CHARGED · POS 1ST / 4").setVisible(true);
    this.hint.setVisible(false);
    this.focusCamera(true);
    this.layoutRivals(this.timeMs / 1000);
    this.draw();
    this.publishDebug();
  }

  private restartCourse() {
    this.scene.restart();
  }

  private switchCourse(index: number) {
    if (index < 0 || index >= COURSES.length || index === this.courseIndex) return;
    this.game.registry.set("courseIndex", index);
    this.scene.restart();
  }

  private publishDebug() {
    publishGwDebug(
      {
        gameId: "swing-vector",
        ready: this.signaledReady,
        runState: this.ended ? "ended" : this.paused ? "paused" : "playing",
        playerX: this.pilot.x,
        playerY: this.pilot.y,
        score: Math.floor(this.timeMs),
        paused: this.paused,
        fps: this.game.loop.actualFps,
        longFrames: this.longFrames,
        tick: this.ticks,
        frozen: false,
        contentId: this.course.id,
      },
      {
        finishRun: () => this.win(),
        killPlayer: () => this.respawnFall(),
        jump: () => {
          this.holding = !this.holding;
          this.holdLatch = this.holding;
          this.showcaseUntil = 0;
        },
        seedPeak: () => this.stageMidSwing(),
        hideHud: () => {
          this.hudHidden = true;
          this.hud.setVisible(false);
          this.hint.setVisible(false);
          this.banner.setVisible(false);
          this.lockText.setVisible(false);
          this.resultText.setVisible(false);
          this.youTag.setVisible(false);
          this.rivalTags.forEach((tag) => tag.setVisible(false));
        },
      },
    );
  }

  shutdown() {
    this.game.events.off("platform-pause", this.onPause, this);
    this.game.events.off("platform-resume", this.onResume, this);
    this.nativeKeys?.destroy();
    this.nativeKeys = null;
    this.rivalTags.forEach((tag) => tag.destroy());
    clearGwDebug();
  }
}

export function mountSwingVector(parent: HTMLElement, platform: PlatformSDK, courseIndex = 0) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: Math.max(320, parent.clientWidth || 1280),
    height: Math.max(240, parent.clientHeight || 720),
    backgroundColor: "#07131e",
    scale: { mode: Phaser.Scale.RESIZE },
    scene: [SwingVectorPlayScene],
    disableContextMenu: true,
    banner: false,
    autoFocus: true,
    input: { keyboard: { target: typeof window !== "undefined" ? window : undefined }, activePointers: 3 },
    fps: { target: 60 },
    render: { preserveDrawingBuffer: true },
  });
  game.registry.set("platform", platform);
  game.registry.set("courseIndex", courseIndex);
  game.registry.set("manifest", swingVectorManifest);
  (game as Phaser.Game & { restartRun: () => void }).restartRun = () => {
    game.scene.getScene("swing-vector-play")?.scene.restart();
  };
  game.events.once("destroy", () => {
    (game.registry.get("synth") as Synth | undefined)?.dispose();
    clearGwDebug();
  });
  return game;
}
