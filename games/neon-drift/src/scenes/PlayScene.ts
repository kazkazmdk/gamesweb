import Phaser from "phaser";
import { clamp, FloatingTextPool, Juice, ParticlePool, pulseHaptic, Synth, publishGwDebug, countLongFrame, clearGwDebug } from "@gamesweb/game-core";
import type { PlatformSDK } from "@gamesweb/game-sdk";
import { neonDriftManifest } from "@gamesweb/game-sdk";
import { CAMERA, NEON, VEHICLE } from "../config";
import { createCam, stepCamera, type Cam } from "../systems/camera";
import {
  ghostEnabled,
  GhostRecorder,
  ghostPose,
  loadGhost,
  saveGhost,
  setGhostEnabled,
  type GhostTape,
} from "../systems/ghost";
import { readDriveInput } from "../systems/input";
import { DriftScore } from "../systems/scoring";
import {
  buildTrack,
  loadTrackIndex,
  queryTrack,
  saveTrackIndex,
  startPose,
  TRACKS,
  type TrackDef,
  type TrackSample,
} from "../systems/track";
import { Car } from "../systems/vehicle";
import { drawCar, drawGhost, drawHudChrome, drawMarks, drawWorld, type Mark } from "./render";

type ResultKind = "crash" | "finish" | "time";

export class DriftPlayScene extends Phaser.Scene {
  private platform!: PlatformSDK;
  private car = new Car();
  private def!: TrackDef;
  private samples: TrackSample[] = [];
  private score = new DriftScore();
  private juice = new Juice();
  private parts!: ParticlePool;
  private floaters = new FloatingTextPool(18);
  private synth!: Synth;
  private gfx!: Phaser.GameObjects.Graphics;
  private overlay!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private deltaTxt!: Phaser.GameObjects.Text;
  private floaterGfx: Phaser.GameObjects.Text[] = [];
  private paused = false;
  private ended = false;
  private lap = 0;
  private lastProgress = 0;
  private crossed = false;
  private runStart = 0;
  private reverse = false;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private cam!: Cam;
  private marks: Mark[] = [];
  private wallHits = 0;
  private cleanLap = true;
  private shownHint = true;
  private nearArmed = true;
  private audioReady = false;
  private showGhost = true;
  private recorder = new GhostRecorder();
  private tape: GhostTape | null = null;
  private retries = 0;
  private endedAt = 0;
  private lastComboFloor = 1;
  private fpsAcc = 0;
  private frames = 0;
  private quality: "high" | "low" = "high";
  private debug = false;
  private sectorHits = 0;
  private lastBoost = false;
  private streakClean = true;
  private signaledReady = false;
  private longFrames = 0;
  private onGrass = false;
  private testDrive: { throttle: number; steer: number } | null = null;
  private boardMode = "foundation";

  constructor() {
    super("neon-drift-play");
  }

  create() {
    this.platform = this.game.registry.get("platform") as PlatformSDK;
    this.reverse = Boolean(this.game.registry.get("dailyVariant"));
    const idx = this.reverse ? 0 : Number(this.game.registry.get("trackIndex") ?? loadTrackIndex());
    this.def = TRACKS[idx] ?? TRACKS[0];
    this.samples = buildTrack(this.def, this.reverse);
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
    this.streakClean = true;
    this.runStart = this.time.now;
    this.cam = createCam(pose.x, pose.y);
    this.marks = [];
    this.recorder.reset();
    this.showGhost = ghostEnabled();
    this.boardMode = this.reverse ? "daily" : this.def.id;
    this.tape = loadGhost(this.def.id, this.boardMode);
    this.signaledReady = false;
    this.onGrass = false;
    this.debug = this.game.registry.get("debug") === true && process.env.NODE_ENV !== "production";
    const mobile = this.sys.game.device.input.touch;
    this.parts = new ParticlePool(mobile ? 140 : 260);
    this.quality = mobile ? "low" : "high";
    this.synth = (this.game.registry.get("synth") as Synth | undefined) ?? new Synth();
    this.game.registry.set("synth", this.synth);
    const settings = this.platform.audio.getSettings();
    this.synth.setSettings(settings);

    this.cameras.main.setBackgroundColor(this.def.theme.sky);
    this.gfx = this.add.graphics();
    this.overlay = this.add.graphics().setScrollFactor(0).setDepth(20);
    this.hud = this.add
      .text(24, 52, "", { fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: "17px", color: "#f3f1ec" })
      .setScrollFactor(0)
      .setDepth(21);
    this.deltaTxt = this.add
      .text(this.scale.width / 2, 86, "", {
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        fontSize: "18px",
        color: "#f3f1ec",
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(21)
      .setAlpha(0);
    this.hint = this.add
      .text(this.scale.width / 2, this.scale.height - 78, this.hintCopy(), {
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        fontSize: "14px",
        color: "#f3f1ec",
        align: "center",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(21)
      .setAlpha(this.shouldTutorial() ? 0.9 : 0);
    this.shownHint = this.shouldTutorial();
    this.floaterGfx = [];
    for (let i = 0; i < 10; i += 1) {
      this.floaterGfx.push(
        this.add
          .text(0, 0, "", { fontFamily: "ui-sans-serif, system-ui", fontSize: "13px", color: "#e35aa0" })
          .setOrigin(0.5)
          .setDepth(18)
          .setAlpha(0),
      );
    }

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
      g: kb.addKey("G"),
      one: kb.addKey("ONE"),
      two: kb.addKey("TWO"),
      three: kb.addKey("THREE"),
    };

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.ensureAudio();
      this.handleChromeTap(p.x, p.y);
    });
    this.platform.session.start();
    this.platform.events.emit({ name: "gameplay_started", props: { gameId: "neon-drift", track: this.def.id } });
    this.fitCam(this.scale.width, this.scale.height);
    this.scale.on("resize", (gs: Phaser.Structs.Size) => {
      this.fitCam(gs.width, gs.height);
      this.hint.setPosition(this.scale.width / 2, this.scale.height - 78);
      this.deltaTxt.setPosition(this.scale.width / 2, 86);
    });
    this.game.events.on("platform-pause", this.onPause, this);
    this.game.events.on("platform-resume", this.onResume, this);
  }

  private hintCopy() {
    const touch = this.sys.game.device.input.touch;
    return touch ? "STEER  ·  HOLD BRAKE TO SLIDE  ·  R RESTART" : "STEER  ·  SPACE TO DRIFT  ·  R RESTART";
  }

  private shouldTutorial() {
    if (typeof localStorage === "undefined") return true;
    return localStorage.getItem(NEON.tutorialKey) !== "1";
  }

  private fitCam(w: number, h: number) {
    this.cameras.resize(w, h);
    this.cameras.main.setViewport(0, 0, w, h);
    this.cameras.main.setSize(w, h);
    this.cameras.main.setZoom(this.cam?.zoom ?? CAMERA.zoomSlow);
  }

  private ensureAudio() {
    if (this.audioReady) return;
    this.audioReady = true;
    void this.synth.resume().then(() => {
      this.synth.startEngine();
      if (!this.game.registry.get("bedOn")) {
        this.synth.startBed("drift");
        this.game.registry.set("bedOn", true);
      }
    });
  }

  private onPause = () => {
    this.paused = true;
  };
  private onResume = () => {
    this.paused = false;
  };

  update(_: number, delta: number) {
    const dt = Math.min(0.033, delta / 1000);
    this.frames += 1;
    this.fpsAcc += delta;
    if (this.fpsAcc > 1000) {
      const fps = this.frames / (this.fpsAcc / 1000);
      if (fps < 46) this.quality = "low";
      else if (fps > 56) this.quality = this.sys.game.device.input.touch ? "low" : "high";
      this.fpsAcc = 0;
      this.frames = 0;
    }
    if (!this.signaledReady) {
      this.signaledReady = true;
      this.platform.events.emit({ name: "game_ready", props: { gameId: "neon-drift" } });
      this.publishDebug(delta);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.r)) {
      if (!this.ended) this.retry();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.g)) {
      this.showGhost = !this.showGhost;
      setGhostEnabled(this.showGhost);
    }
    if (!this.reverse) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.one)) this.switchTrack(0);
      if (Phaser.Input.Keyboard.JustDown(this.keys.two)) this.switchTrack(1);
      if (Phaser.Input.Keyboard.JustDown(this.keys.three)) this.switchTrack(2);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.esc)) this.platform.pause.request();
    if (this.paused || this.ended) {
      this.draw(0);
      this.publishDebug(delta);
      return;
    }
    if (!this.testDrive && this.juice.isFrozen(this.time.now)) {
      this.draw(dt);
      this.publishDebug(delta);
      return;
    }

    const drive = readDriveInput(this.keys, this.input, this.scale.width, this.scale.height);
    this.car.steer = this.testDrive?.steer ?? drive.steer;
    this.car.throttle = this.testDrive?.throttle ?? drive.throttle;
    this.car.handbrake = this.testDrive ? false : drive.handbrake;
    this.car.assist = drive.touch && !this.testDrive ? VEHICLE.touchSteerAssist : 0;

    if (this.car.throttle !== 0 || this.car.steer !== 0 || this.car.handbrake) {
      if (this.shownHint) {
        this.shownHint = false;
        try {
          localStorage.setItem(NEON.tutorialKey, "1");
        } catch {
          /* noop */
        }
      }
      this.ensureAudio();
    }

    this.car.step(dt);
    const q = queryTrack(this.samples, this.car.x, this.car.y);
    this.car.surface = q.surface;

    if (q.dist > q.half + 24) {
      const impactN = clamp(this.car.speed / VEHICLE.maxSpeed, 0.2, 1);
      this.car.bounce(-q.nx, -q.ny, 10);
      this.wallHits += 1;
      this.cleanLap = false;
      this.streakClean = false;
      this.juice.screenShake(5 + impactN * 6, 90);
      this.juice.hitStop(28);
      this.synth.impact(impactN);
      this.parts.burst(this.car.x, this.car.y, this.quality === "high" ? 12 : 8, 0xf3f1ec, 160, 240);
      if (this.car.speed > 390) {
        this.finish("crash");
        return;
      }
    }

    const near = q.dist > q.half * 0.7 && q.dist < q.half && this.car.drifting;
    this.score.tick(dt, {
      drifting: this.car.drifting,
      speed: this.car.speed,
      slip: this.car.slip,
      near,
      boost: q.surface === "boost",
    });

    if (this.car.drifting) void this.platform.achievement.unlock("first-slide");
    if (this.score.combo >= 5) void this.platform.achievement.unlock("combo-5");
    if (near && this.nearArmed) {
      this.nearArmed = false;
      this.score.nearMisses += 1;
      this.floaters.spawn(this.car.x, this.car.y - 28, "NEAR", "#e35aa0");
      void this.platform.achievement.unlock("near-miss");
      this.juice.cameraPunch(0.7);
    }
    if (!near) this.nearArmed = true;
    if (q.surface === "boost" && !this.lastBoost) {
      this.synth.boostWhoosh();
      this.score.perfectGates += 1;
      void this.platform.achievement.unlock("boost-gate");
    }
    this.lastBoost = q.surface === "boost";
    if (q.surface === "grass") this.onGrass = true;
    if (this.onGrass && q.surface === "asphalt" && this.car.speed > 200) {
      void this.platform.achievement.unlock("grass-survive");
      this.onGrass = false;
    }

    const comboFloor = Math.floor(this.score.combo);
    if (comboFloor > this.lastComboFloor) {
      this.synth.comboSting(comboFloor);
      this.floaters.spawn(this.car.x, this.car.y - 36, `${comboFloor}x`, "#f3f1ec");
    }
    this.lastComboFloor = comboFloor;

    if (this.car.driftAmount > 0.12 && this.car.speed > 110) {
      this.marks.push({
        x: this.car.x,
        y: this.car.y,
        a: this.car.angle,
        life: 2.6 + this.car.driftAmount,
        slip: this.car.driftAmount,
      });
      if (this.marks.length > (this.quality === "high" ? 260 : 110)) this.marks.shift();
      if (this.quality === "high" || this.frames % 2 === 0) {
        this.parts.emit({
          x: this.car.x - Math.cos(this.car.angle) * 14,
          y: this.car.y - Math.sin(this.car.angle) * 14,
          vx: -this.car.vx * 0.1 + (Math.random() - 0.5) * 18,
          vy: -this.car.vy * 0.1 + (Math.random() - 0.5) * 18,
          life: 280 + this.car.driftAmount * 120,
          size: 2 + this.car.driftAmount * 3,
          color: 0xc9c4bf,
          drag: 0.93,
        });
      }
    }

    if (this.car.speed > 280 && this.quality === "high") {
      const side = Math.atan2(this.car.vy, this.car.vx) + Math.PI / 2;
      this.parts.emit({
        x: this.car.x + Math.cos(side) * (8 + Math.random() * 18),
        y: this.car.y + Math.sin(side) * (8 + Math.random() * 18),
        vx: -this.car.vx * 0.2,
        vy: -this.car.vy * 0.2,
        life: 180,
        size: 1.4,
        color: this.def.theme.accent,
        drag: 0.9,
      });
    }

    this.synth.setSkid(this.car.driftAmount * Math.min(1, this.car.speed / 420));
    this.synth.engineRpm(clamp(this.car.speed / VEHICLE.maxSpeed, 0, 1), Math.max(0, this.car.throttle));

    let dp = q.progress - this.lastProgress;
    if (dp < -0.5) dp += 1;
    if (dp > 0.5) dp -= 1;
    const sector = q.nearest.sector;
    if (sector !== this.score.lastSector && dp > 0) {
      const snap = this.score.closeSector(this.score.lastSector);
      if (this.streakClean) this.score.cleanSectors += 1;
      this.streakClean = true;
      this.showSectorDelta(this.score.lastSector, snap.score);
      this.score.lastSector = sector;
      this.sectorHits += 1;
    }
    if (q.progress < 0.08 && this.lastProgress > 0.8 && !this.crossed) {
      this.lap += 1;
      this.crossed = true;
      if (this.cleanLap) void this.platform.achievement.unlock("no-crash-lap");
      this.cleanLap = true;
      this.synth.gateChime();
      if (this.lap >= NEON.lapsToFinish) {
        this.finish("finish");
        return;
      }
    }
    if (q.progress > 0.2) this.crossed = false;
    this.lastProgress = q.progress;

    const elapsed = this.time.now - this.runStart;
    this.recorder.tick(dt, elapsed, this.car.x, this.car.y, this.car.angle);

    stepCamera(this.cam, this.car, dt, this.scale.width, this.scale.height, this.def.worldW, this.def.worldH);
    const shaken = this.juice.applyCamera({ x: this.cam.x, y: this.cam.y }, this.time.now);
    this.cameras.main.setZoom(this.cam.zoom);
    this.cameras.main.setRotation(this.cam.yaw);
    this.cameras.main.centerOn(shaken.x, shaken.y);

    this.parts.update(dt);
    this.floaters.update(dt);

    if (elapsed > NEON.runTimeoutMs) {
      this.finish("time");
      return;
    }

    this.draw(dt);
    this.publishDebug(delta);
  }

  private showSectorDelta(index: number, gained: number) {
    const pb = this.tape?.sectors[index] ?? 0;
    const d = gained - pb;
    const sign = d >= 0 ? "+" : "";
    this.deltaTxt.setText(`SECTOR ${index + 1}  ${sign}${Math.round(d).toLocaleString()}`);
    this.deltaTxt.setColor(d >= 0 ? "#8dffc1" : "#ff8aa0");
    this.deltaTxt.setAlpha(1);
    this.tweens.add({ targets: this.deltaTxt, alpha: 0, delay: 1400, duration: 420 });
    this.synth.gateChime();
  }

  private draw(dt: number) {
    drawWorld(this.gfx, this.def, this.samples, this.quality);
    drawMarks(this.gfx, this.marks, dt);
    if (this.showGhost && this.tape) {
      drawGhost(this.gfx, ghostPose(this.tape.samples, this.time.now - this.runStart), this.def.theme.accent);
    }
    for (const p of this.parts.items) {
      if (!p.active) continue;
      this.gfx.fillStyle(p.color, p.life / p.max);
      this.gfx.fillCircle(p.x, p.y, p.size);
    }
    drawCar(this.gfx, this.car, this.def.theme.accent);

    this.floaterGfx.forEach((label, i) => {
      const t = this.floaters.items[i];
      if (!t?.active) {
        label.setAlpha(0);
        return;
      }
      label.setText(t.text).setPosition(t.x, t.y).setAlpha(Math.min(1, t.life / 400));
      label.setColor(t.color);
    });

    const combo = Math.max(1, Math.floor(this.score.combo));
    const elapsed = ((this.time.now - this.runStart) / 1000).toFixed(1);
    const live = this.score.currentDrift > 8 ? `   +${Math.floor(this.score.currentDrift)}` : "";
    const dbg = this.debug
      ? `\n${(1000 / Math.max(1, this.game.loop.actualFps)).toFixed?.(0) ?? ""} ${this.game.loop.actualFps | 0}fps  slip ${(this.car.slip * 57.3).toFixed(0)}°  ${this.car.driftAmount.toFixed(2)}`
      : "";
    this.hud.setText(
      `${Math.floor(this.score.display).toLocaleString()}${live}\n${combo}x   lap ${this.lap}/${NEON.lapsToFinish}   ${elapsed}s\n${this.def.name}${dbg}`,
    );
    this.hint.setAlpha(this.shownHint ? 0.88 : 0);
    drawHudChrome(
      this.overlay,
      this.scale.width,
      this.scale.height,
      this.sys.game.device.input.touch,
      this.juice.flashAlpha(dt),
    );
    this.drawMobileChrome();
  }

  private drawMobileChrome() {
    if (!this.sys.game.device.input.touch || this.reverse) return;
    const w = this.scale.width;
    this.overlay.fillStyle(this.showGhost ? 0xe35aa0 : 0xffffff, this.showGhost ? 0.28 : 0.08);
    this.overlay.fillRoundedRect(w - 86, 48, 70, 28, 8);
    this.overlay.fillStyle(0xffffff, 0.1);
    for (let i = 0; i < 3; i += 1) {
      const active = (TRACKS[i]?.id ?? "") === this.def.id;
      this.overlay.fillStyle(active ? 0xe35aa0 : 0xffffff, active ? 0.28 : 0.08);
      this.overlay.fillRoundedRect(16 + i * 54, 48, 48, 28, 8);
    }
  }

  private handleChromeTap(x: number, y: number) {
    if (!this.sys.game.device.input.touch) return;
    const w = this.scale.width;
    if (y >= 48 && y <= 76 && x >= w - 86 && x <= w - 16) {
      this.showGhost = !this.showGhost;
      setGhostEnabled(this.showGhost);
      return;
    }
    if (this.reverse) return;
    for (let i = 0; i < 3; i += 1) {
      const left = 16 + i * 54;
      if (y >= 48 && y <= 76 && x >= left && x <= left + 48) {
        this.switchTrack(i);
        return;
      }
    }
  }

  private publishDebug(delta: number) {
    this.longFrames = countLongFrame(delta, this.longFrames);
    publishGwDebug(
      {
        gameId: "neon-drift",
        ready: this.signaledReady,
        runState: this.ended ? "ended" : this.paused ? "paused" : "playing",
        playerX: this.car.x,
        playerY: this.car.y,
        playerAngle: this.car.angle,
        score: Math.floor(this.score.display),
        paused: this.paused,
        fps: this.game.loop.actualFps,
        longFrames: this.longFrames,
        combo: Math.floor(this.score.combo),
        trackId: this.def.id,
        speed: this.car.speed,
        throttle: this.testDrive?.throttle ?? this.car.throttle,
        frozen: this.juice.isFrozen(this.time.now),
      },
      {
        finishRun: () => this.finish("finish"),
        setDrive: (throttle: number, steer: number) => {
          this.paused = false;
          this.testDrive = { throttle, steer };
        },
      },
    );
  }

  private finish(kind: ResultKind) {
    if (this.ended) return;
    this.ended = true;
    this.endedAt = this.time.now;
    this.synth.setSkid(0);
    this.score.bestDrift = Math.max(this.score.bestDrift, this.score.currentDrift);
    const score = Math.floor(this.score.total);
    const prev = this.tape?.score ?? 0;
    const pb = kind !== "crash" && score > prev;
    if (pb) {
      saveGhost(
        {
          trackId: this.def.id,
          score,
          duration: this.time.now - this.runStart,
          sectors: this.score.sectorScore,
          samples: this.recorder.samples,
        },
        this.boardMode,
      );
      this.synth.personalBest();
      pulseHaptic([12, 40, 18]);
    } else if (kind === "finish") this.synth.finishSting();
    else this.synth.crash(this.car.speed / VEHICLE.maxSpeed);

    if (score >= 25000) void this.platform.achievement.unlock("score-25k");
    if (score >= 60000) void this.platform.achievement.unlock("score-60k");
    if (this.lap >= 2) void this.platform.achievement.unlock("two-laps");
    if (this.reverse && kind === "finish") void this.platform.achievement.unlock("daily-drift");

    const away = Math.max(0, prev - score);
    const retryHint =
      pb && prev > 0
        ? "New personal best. Can you beat it?"
        : away > 0 && away < Math.max(1800, prev * 0.12)
          ? `You were ${away.toLocaleString()} points away.`
          : kind === "crash"
            ? "The wall ate the combo. Retry the line."
            : "Hold the slide longer. Retry.";

    this.platform.events.emit({
      name: kind === "crash" ? "death" : "finish",
      props: { gameId: "neon-drift", score, track: this.def.id },
    });

    void this.platform.session.end({
      mode: this.boardMode,
      score,
      result: kind,
      metadata: {
        laps: this.lap,
        combo: Math.floor(this.score.bestCombo),
        wallHits: this.wallHits,
        duration: this.time.now - this.runStart,
        bestCombo: Math.floor(this.score.bestCombo),
        bestDrift: Math.floor(this.score.bestDrift),
        pbDelta: score - prev,
        cleanSectors: this.score.cleanSectors,
        trackId: this.def.id,
        retryHint,
        driftTime: Math.round(this.score.driftTime * 10) / 10,
        crashes: this.wallHits,
      },
    });
  }

  private retry() {
    this.retries += 1;
    this.platform.events.emit({
      name: "game_retry",
      props: {
        gameId: "neon-drift",
        time_since_run_end_ms: this.ended ? Math.round(this.time.now - this.endedAt) : 0,
        retry_count_session: this.retries,
      },
    });
    this.game.events.off("platform-pause", this.onPause, this);
    this.game.events.off("platform-resume", this.onResume, this);
    this.scene.restart();
  }

  private switchTrack(i: number) {
    this.game.registry.set("trackIndex", i);
    saveTrackIndex(i);
    this.retry();
  }

  shutdown() {
    this.game.events.off("platform-pause", this.onPause, this);
    this.game.events.off("platform-resume", this.onResume, this);
    clearGwDebug();
  }
}

export function mountNeonDrift(
  parent: HTMLElement,
  platform: PlatformSDK,
  dailyVariant = false,
  trackIndex?: number,
) {
  const mobile = typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: Math.max(320, parent.clientWidth || 1280),
    height: Math.max(240, parent.clientHeight || 720),
    backgroundColor: "#0b0a0c",
    scale: { mode: Phaser.Scale.RESIZE },
    scene: [DriftPlayScene],
    disableContextMenu: true,
    banner: false,
    audio: { disableWebAudio: false },
    fps: { target: 60 },
    render: {
      antialias: !mobile,
      roundPixels: false,
      pixelArt: false,
    },
  });
  game.registry.set("platform", platform);
  game.registry.set("dailyVariant", dailyVariant);
  game.registry.set("trackIndex", dailyVariant ? 0 : trackIndex ?? loadTrackIndex());
  game.registry.set("manifest", neonDriftManifest);
  game.registry.set("debug", process.env.NODE_ENV !== "production");
  (game as Phaser.Game & { restartRun: () => void }).restartRun = () => {
    const sc = game.scene.getScene("neon-drift-play");
    sc?.scene.restart();
  };
  game.events.once("destroy", () => {
    const synth = game.registry.get("synth") as Synth | undefined;
    synth?.dispose();
    clearGwDebug();
  });
  return game;
}
