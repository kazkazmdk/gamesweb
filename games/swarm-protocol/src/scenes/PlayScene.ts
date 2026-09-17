import Phaser from "phaser";
import { clamp, FloatingTextPool, Juice, ParticlePool, pulseHaptic, Synth, publishGwDebug, countLongFrame, clearGwDebug, createGameKeyboard, seededRng, fillBackdrop, fillVignette, type GameKeyboard } from "@gamesweb/game-core";
import type { PlatformSDK } from "@gamesweb/game-sdk";
import { readRunContext, swarmProtocolManifest, utcDayKey } from "@gamesweb/game-sdk";
import {
  applyUpgrade,
  BASE_BUILD,
  chainDamage,
  critMul,
  desiredCount,
  emptyEnemy,
  executionMul,
  fireRateNow,
  KIND,
  magnetRange,
  phaseFor,
  pickKind,
  pickUpgrades,
  recommendBuild,
  spawnEnemy,
  xpToLevel,
  setSimRng,
  resetSimRng,
  simRand,
  type Build,
  type Bullet,
  type Enemy,
  type Orb,
  type Trail,
  type UpgradeDef,
  type UpgradeId,
} from "../systems/sim";

const ARENA = 1400;
const BOSS_AT = 390;

export class SwarmPlayScene extends Phaser.Scene {
  private platform!: PlatformSDK;
  private juice = new Juice();
  private parts!: ParticlePool;
  private floaters = new FloatingTextPool(24);
  private synth!: Synth;
  private gfx!: Phaser.GameObjects.Graphics;
  private overlay!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private cards: Phaser.GameObjects.Text[] = [];
  private px = ARENA / 2;
  private py = ARENA / 2;
  private vx = 0;
  private vy = 0;
  private hp = 100;
  private maxHp = 100;
  private iFrames = 0;
  private dashCd = 0;
  private dashing = 0;
  private build: Build = { ...BASE_BUILD };
  private owned: UpgradeId[] = [];
  private enemies: Enemy[] = [];
  private bullets: Bullet[] = [];
  private orbs: Orb[] = [];
  private trails: Trail[] = [];
  private fireAcc = 0;
  private shotN = 0;
  private xp = 0;
  private level = 1;
  private kills = 0;
  private damageDone = 0;
  private started = 0;
  private paused = false;
  private choosing: UpgradeDef[] | null = null;
  private dead = false;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private nativeKeys: GameKeyboard | null = null;
  private camX = ARENA / 2;
  private camY = ARENA / 2;
  private stick = { x: 0, y: 0, originX: 0, originY: 0, active: false, pointerId: -1 };
  private cardHits: Array<{ x: number; y: number; w: number; h: number }> = [];
  private signaledReady = false;
  private longFrames = 0;
  private ticks = 0;
  private shieldA = 0;
  private pulseT = 0;
  private elites = 0;
  private audioReady = false;
  private bossSpawned = false;
  private bossDown = false;
  private victorious = false;
  private victoryT = 0;
  private endless = false;
  private seed = "";
  private lastEliteWarn = 0;
  private retries = 0;
  private endedAt = 0;
  private quality: "high" | "low" = "high";
  private fpsAcc = 0;
  private frames = 0;

  constructor() {
    super("swarm-play");
  }

  create() {
    this.platform = this.game.registry.get("platform") as PlatformSDK;
    this.parts = new ParticlePool(this.sys.game.device.input.touch ? 180 : 280);
    this.synth = (this.game.registry.get("synth") as Synth | undefined) ?? new Synth();
    this.game.registry.set("synth", this.synth);
    this.synth.setSettings(this.platform.audio.getSettings());
    this.resetRun();
    const ctx = readRunContext();
    this.endless = Boolean(this.game.registry.get("endless")) || Boolean(ctx.endless);
    this.seed = ctx.seed ?? ctx.challengeCode ?? (ctx.daily ? utcDayKey() : "");
    if (this.seed) setSimRng(seededRng(this.seed));
    else resetSimRng();
    this.cameras.main.setBackgroundColor("#120c10");
    this.gfx = this.add.graphics();
    this.overlay = this.add.graphics().setScrollFactor(0).setDepth(20);
    this.hud = this.add
      .text(22, 74, "", { fontFamily: "ui-sans-serif, system-ui", fontSize: "16px", color: "#f7ebe3" })
      .setScrollFactor(0)
      .setDepth(21);
    this.cards = [0, 1, 2].map((i) =>
      this.add
        .text(0, 0, "", { fontFamily: "ui-sans-serif, system-ui", fontSize: "15px", color: "#f7ebe3", wordWrap: { width: 190 } })
        .setScrollFactor(0)
        .setDepth(22)
        .setAlpha(0),
    );
    const kb = this.input.keyboard!;
    this.keys = {
      up: kb.addKey("W"),
      up2: kb.addKey("UP"),
      up3: kb.addKey("Z"),
      down: kb.addKey("S"),
      down2: kb.addKey("DOWN"),
      left: kb.addKey("A"),
      left2: kb.addKey("LEFT"),
      left3: kb.addKey("Q"),
      right: kb.addKey("D"),
      right2: kb.addKey("RIGHT"),
      dash: kb.addKey("SHIFT"),
      r: kb.addKey("R"),
      esc: kb.addKey("ESC"),
      one: kb.addKey("ONE"),
      two: kb.addKey("TWO"),
      three: kb.addKey("THREE"),
    };
    this.nativeKeys?.destroy();
    this.nativeKeys = createGameKeyboard();
    this.game.canvas.tabIndex = 0;
    this.game.canvas.focus({ preventScroll: true });
    if (!this.enemies.length) {
      for (let i = 0; i < 110; i += 1) this.enemies.push(emptyEnemy());
      for (let i = 0; i < 140; i += 1) {
        this.bullets.push({
          active: false,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          life: 0,
          damage: 0,
          r: 4,
          chain: 0,
          pierce: 0,
          split: 0,
          over: false,
          hostile: false,
        });
      }
      for (let i = 0; i < 140; i += 1) this.orbs.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, value: 1 });
    }

    this.input.addPointer(3);
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.ensureAudio();
      if (this.choosing) {
        const hit = this.cardHits.findIndex((c) => p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h);
        if (hit >= 0) this.take(hit);
        return;
      }
      if (p.wasTouch) {
        if (p.x > this.scale.width * 0.72) this.tryDash();
        else if (!this.stick.active) {
          this.stick.active = true;
          this.stick.pointerId = p.id;
          this.stick.originX = p.x;
          this.stick.originY = p.y;
        }
      }
    });
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (this.choosing) {
        const hit = this.cardHits.findIndex((c) => p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h);
        if (hit >= 0) this.take(hit);
      }
      if (p.id !== this.stick.pointerId) return;
      this.stick.active = false;
      this.stick.pointerId = -1;
      this.stick.x = 0;
      this.stick.y = 0;
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!this.stick.active || p.id !== this.stick.pointerId) return;
      const dx = p.x - this.stick.originX;
      const dy = p.y - this.stick.originY;
      const m = Math.hypot(dx, dy) || 1;
      const cap = 54;
      this.stick.x = (dx / m) * Math.min(1, m / cap);
      this.stick.y = (dy / m) * Math.min(1, m / cap);
    });

    this.platform.session.start();
    this.platform.events.emit({ name: "gameplay_started", props: { gameId: "swarm-protocol" } });
    this.fitCam(this.scale.width, this.scale.height);
    this.scale.on("resize", (gs: Phaser.Structs.Size) => this.fitCam(gs.width, gs.height));
    this.game.events.on("platform-pause", () => (this.paused = true));
    this.game.events.on("platform-resume", () => (this.paused = false));
    this.game.events.on("continue-endless", () => this.continueEndless());
    this.started = this.time.now;
  }

  private resetRun() {
    this.px = ARENA / 2;
    this.py = ARENA / 2;
    this.vx = 0;
    this.vy = 0;
    this.hp = 100;
    this.maxHp = 100;
    this.build = { ...BASE_BUILD };
    this.owned = [];
    this.xp = 0;
    this.level = 1;
    this.kills = 0;
    this.damageDone = 0;
    this.dead = false;
    this.choosing = null;
    this.elites = 0;
    this.bossSpawned = this.endless;
    this.bossDown = this.endless;
    this.shotN = 0;
    this.trails = [];
    for (const e of this.enemies) e.active = false;
    for (const b of this.bullets) b.active = false;
    for (const o of this.orbs) o.active = false;
  }

  private fitCam(w: number, h: number) {
    this.cameras.resize(w, h);
    this.cameras.main.setViewport(0, 0, w, h);
    this.cameras.main.setSize(w, h);
    this.cameras.main.setZoom(Math.max(w / ARENA, h / ARENA) * 1.05);
  }

  private ensureAudio() {
    if (this.audioReady) return;
    this.audioReady = true;
    void this.synth.resume().then(() => this.synth.startBed("swarm"));
  }

  update(_: number, delta: number) {
    const dt = Math.min(0.033, delta / 1000);
    this.frames += 1;
    this.fpsAcc += delta;
    if (this.fpsAcc > 1000) {
      const fps = this.frames / (this.fpsAcc / 1000);
      this.quality = fps < 46 ? "low" : this.sys.game.device.input.touch ? "low" : "high";
      this.fpsAcc = 0;
      this.frames = 0;
    }
    this.longFrames = countLongFrame(delta, this.longFrames);
    this.ticks += 1;
    if (!this.signaledReady) {
      this.signaledReady = true;
      this.platform.events.emit({ name: "game_ready", props: { gameId: "swarm-protocol" } });
    }
    const native = this.nativeKeys?.read();
    if (this.dead && (Phaser.Input.Keyboard.JustDown(this.keys.r) || native?.retryPressed)) {
      this.retry();
      return;
    }
    if (this.paused && !this.choosing) {
      this.draw(dt);
      return;
    }
    if (this.choosing) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.one) || native?.onePressed) this.take(0);
      if (Phaser.Input.Keyboard.JustDown(this.keys.two) || native?.twoPressed) this.take(1);
      if (Phaser.Input.Keyboard.JustDown(this.keys.three) || native?.threePressed) this.take(2);
      this.draw(dt);
      return;
    }
    if (this.victorious) {
      this.victoryT -= dt * 1000;
      this.parts.update(dt * 0.35);
      this.floaters.update(dt);
      this.draw(dt);
      if (this.victoryT <= 0) this.finishVictory();
      return;
    }
    if (this.dead) {
      this.draw(dt);
      return;
    }

    let mx =
      Number(this.keys.right.isDown || this.keys.right2.isDown || Boolean(native?.right)) -
      Number(this.keys.left.isDown || this.keys.left2.isDown || this.keys.left3?.isDown || Boolean(native?.left));
    let my =
      Number(this.keys.down.isDown || this.keys.down2.isDown || Boolean(native?.down)) -
      Number(this.keys.up.isDown || this.keys.up2.isDown || this.keys.up3?.isDown || Boolean(native?.up));
    if ((this.stick.x || this.stick.y) && !(native?.up || native?.down || native?.left || native?.right)) {
      mx = this.stick.x;
      my = this.stick.y;
    }
    const mag = Math.hypot(mx, my);
    const speed = this.build.move * (this.dashing > 0 ? 2.45 : 1);
    if (mag > 0.05) {
      this.vx = (mx / mag) * speed;
      this.vy = (my / mag) * speed;
      this.ensureAudio();
    } else {
      this.vx = 0;
      this.vy = 0;
    }
    this.px = clamp(this.px + this.vx * dt, 40, ARENA - 40);
    this.py = clamp(this.py + this.vy * dt, 40, ARENA - 40);

    if (Phaser.Input.Keyboard.JustDown(this.keys.dash) || native?.dashPressed) this.tryDash();
    this.dashCd = Math.max(0, this.dashCd - dt * 1000);
    this.dashing = Math.max(0, this.dashing - dt * 1000);
    this.iFrames = Math.max(0, this.iFrames - dt * 1000);
    this.shieldA += dt * (1.6 + this.build.orbital);
    this.pulseT += dt;

    if (this.build.dashBurn && this.dashing > 0) {
      this.trails.push({ x: this.px, y: this.py, life: 0.45 + this.build.dashBurn * 0.1, r: 16 });
      if (this.trails.length > 40) this.trails.shift();
    }
    for (const t of this.trails) t.life -= dt;

    this.spawnWave(dt);
    this.fire(dt);
    this.stepEnemies(dt);
    this.stepBullets(dt);
    this.stepOrbs(dt);
    this.stepPulse(dt);
    this.stepTrails(dt);

    this.camX += (this.px - this.camX) * (1 - Math.exp(-dt * 8));
    this.camY += (this.py - this.camY) * (1 - Math.exp(-dt * 8));
    const hw = this.scale.width / (2 * this.cameras.main.zoom);
    const hh = this.scale.height / (2 * this.cameras.main.zoom);
    if (ARENA > hw * 2) this.camX = clamp(this.camX, hw, ARENA - hw);
    if (ARENA > hh * 2) this.camY = clamp(this.camY, hh, ARENA - hh);
    const sh = this.juice.applyCamera({ x: this.camX, y: this.camY }, this.time.now);
    this.cameras.main.centerOn(sh.x, sh.y);
    this.parts.update(dt);
    this.floaters.update(dt);
    this.draw(dt);
  }

  private tryDash() {
    if (this.dashCd > 0 || this.dead || this.choosing) return;
    this.dashing = 180;
    this.iFrames = 180;
    this.dashCd = this.build.dashCd;
    this.juice.cameraPunch(0.55);
    this.synth.noiseBurst(0.09, 0.045, 620);
  }

  private spawnWave(dt: number) {
    const elapsed = (this.time.now - this.started) / 1000;
    const live = this.enemies.reduce((n, e) => n + (e.active && e.kind !== "boss" && e.kind !== "warden" ? 1 : 0), 0);
    const want = desiredCount(elapsed);
    if (!this.bossSpawned && elapsed >= BOSS_AT) {
      const slot = this.enemies.find((e) => !e.active);
      if (slot) {
        spawnEnemy(slot, this.endless ? "warden" : "boss", ARENA / 2, 120, 1);
        this.bossSpawned = true;
        this.synth.levelUp();
        this.juice.flash(0.2);
        this.floaters.spawn(this.px, this.py - 40, this.endless ? "WARDEN" : "PROTOCOL CORE", "#ffd4a8");
      }
    }
    if (live >= want) return;
    if (simRand() > dt * (2.2 + elapsed * 0.01)) return;
    const slot = this.enemies.find((e) => !e.active);
    if (!slot) return;
    const kind = pickKind(elapsed, elapsed > 90);
    if (kind === "elite" && this.time.now - this.lastEliteWarn > 4000) {
      this.lastEliteWarn = this.time.now;
      this.synth.tone(140, 0.16, "sawtooth", 0.05, 0.1);
    }
    const a = simRand() * Math.PI * 2;
    const dist = 540 + simRand() * 160;
    const scale = 1 + Math.min(1.4, elapsed / 240);
    spawnEnemy(slot, kind, this.px + Math.cos(a) * dist, this.py + Math.sin(a) * dist, scale);
    slot.x = clamp(slot.x, 30, ARENA - 30);
    slot.y = clamp(slot.y, 30, ARENA - 30);
  }

  private fire(dt: number) {
    const rate = fireRateNow(this.build, this.hp, this.maxHp);
    this.fireAcc += dt * rate;
    const target = this.nearest(this.px, this.py);
    if (!target || this.fireAcc < 1) return;
    this.fireAcc -= 1;
    this.shotN += 1;
    const over = this.build.overcharge > 0 && this.shotN % 5 === 0;
    const base = Math.atan2(target.y - this.py, target.x - this.px);
    const n = this.build.projectiles;
    for (let i = 0; i < n; i += 1) {
      const b = this.bullets.find((x) => !x.active);
      if (!b) break;
      const spread = (i - (n - 1) / 2) * (0.14 + this.build.spread * 0.04);
      const a = base + spread;
      b.active = true;
      b.hostile = false;
      b.x = this.px;
      b.y = this.py;
      const spd = (over ? 580 : 530) + this.build.rail * 80;
      b.vx = Math.cos(a) * spd;
      b.vy = Math.sin(a) * spd;
      b.life = 760 + this.build.rail * 120;
      b.damage = this.build.damage * critMul(this.build) * (over ? 1.8 + this.build.overcharge * 0.2 : 1);
      b.r = over ? 8 : this.build.rail > 0 ? 3 : 4;
      b.chain = this.build.chain;
      b.pierce = this.build.pierce;
      b.split = this.build.split;
      b.over = over;
    }
    if (this.build.twin > 0) {
      for (const side of [-1, 1]) {
        const b = this.bullets.find((x) => !x.active);
        if (!b) break;
        const a = base + side * 0.55;
        b.active = true;
        b.hostile = false;
        b.x = this.px;
        b.y = this.py;
        b.vx = Math.cos(a) * 480;
        b.vy = Math.sin(a) * 480;
        b.life = 520;
        b.damage = this.build.damage * 0.55 * this.build.twin;
        b.r = 3;
        b.chain = 0;
        b.pierce = 0;
        b.split = 0;
        b.over = false;
      }
    }
    const pitch = 400 + this.build.projectiles * 18 + (over ? 80 : 0) + this.build.rail * 40;
    this.synth.tone(pitch, 0.035, this.build.rail ? "sawtooth" : "square", over ? 0.04 : 0.022, 0.12);
  }

  private nearest(x: number, y: number, ignore?: Enemy) {
    let best: Enemy | null = null;
    let d = 1e9;
    for (const e of this.enemies) {
      if (!e.active || e === ignore) continue;
      const dd = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (dd < d) {
        d = dd;
        best = e;
      }
    }
    return best;
  }

  private stepEnemies(dt: number) {
    for (const e of this.enemies) {
      if (!e.active) continue;
      e.flash = Math.max(0, e.flash - dt);
      if (e.kind === "boss" || e.kind === "warden") this.stepBoss(e, dt);
      else if (e.kind === "spitter") this.stepSpitter(e, dt);
      else if (e.kind === "elite") this.stepElite(e, dt);
      else if (e.kind === "tank") {
        const a = Math.atan2(this.py - e.y, this.px - e.x);
        e.x += Math.cos(a) * e.speed * dt;
        e.y += Math.sin(a) * e.speed * dt;
      } else {
        const a = Math.atan2(this.py - e.y, this.px - e.x);
        e.x += Math.cos(a) * e.speed * dt;
        e.y += Math.sin(a) * e.speed * dt;
      }

      const drones = Math.max(3, this.build.orbital);
      for (let i = 0; i < drones; i += 1) {
        const sa = this.shieldA + (i * Math.PI * 2) / drones;
        const sx = this.px + Math.cos(sa) * 48;
        const sy = this.py + Math.sin(sa) * 48;
        if ((e.x - sx) ** 2 + (e.y - sy) ** 2 < (e.r + 12) ** 2) {
          this.hurtEnemy(e, this.build.damage * 0.4, false);
        }
      }

      const d2 = (e.x - this.px) ** 2 + (e.y - this.py) ** 2;
      if (d2 < (e.r + 14) ** 2) {
        if (this.dashing > 0) {
          this.hurtEnemy(e, this.build.damage * 1.45, true);
        } else if (this.iFrames <= 0) {
          this.hurtPlayer(e.damage);
        }
      }
    }
  }

  private stepSpitter(e: Enemy, dt: number) {
    const dist = Math.hypot(this.px - e.x, this.py - e.y);
    const a = Math.atan2(this.py - e.y, this.px - e.x);
    if (dist < 240) {
      e.x -= Math.cos(a) * e.speed * 0.45 * dt;
      e.y -= Math.sin(a) * e.speed * 0.45 * dt;
    } else {
      e.x += Math.cos(a) * e.speed * dt;
      e.y += Math.sin(a) * e.speed * dt;
    }
    e.telegraph += dt;
    if (e.telegraph > 1.05) {
      e.telegraph = 0;
      this.spit(e, a, 230);
    }
  }

  private stepElite(e: Enemy, dt: number) {
    e.patternT += dt;
    const a = Math.atan2(this.py - e.y, this.px - e.x);
    if (e.patternT < 0.7) {
      e.telegraph = e.patternT / 0.7;
    } else if (e.patternT < 1.05) {
      e.x += Math.cos(a) * e.speed * 3.2 * dt;
      e.y += Math.sin(a) * e.speed * 3.2 * dt;
    } else {
      e.patternT = 0;
      e.telegraph = 0;
    }
  }

  private stepBoss(e: Enemy, dt: number) {
    e.patternT += dt;
    const a = Math.atan2(this.py - e.y, this.px - e.x);
    if (e.pattern === 0) {
      e.telegraph = Math.min(1, e.patternT / 0.85);
      if (e.patternT > 0.85 && e.patternT < 1.35) {
        e.x += Math.cos(a) * 220 * dt;
        e.y += Math.sin(a) * 220 * dt;
      }
      if (e.patternT > 1.8) {
        e.pattern = 1;
        e.patternT = 0;
        e.telegraph = 0;
      }
    } else if (e.pattern === 1) {
      e.telegraph = Math.min(1, e.patternT / 0.7);
      if (e.patternT > 0.7 && e.patternT < 0.78) {
        for (let i = 0; i < 8; i += 1) this.spit(e, (i / 8) * Math.PI * 2, 180);
      }
      if (e.patternT > 1.6) {
        e.pattern = 2;
        e.patternT = 0;
        e.telegraph = 0;
      }
    } else {
      e.x += Math.cos(a) * e.speed * dt;
      e.y += Math.sin(a) * e.speed * dt;
      if (e.patternT > 1.4) {
        e.pattern = 0;
        e.patternT = 0;
      }
    }
  }

  private spit(e: Enemy, a: number, speed: number) {
    const b = this.bullets.find((x) => !x.active);
    if (!b) return;
    b.active = true;
    b.hostile = true;
    b.x = e.x;
    b.y = e.y;
    b.vx = Math.cos(a) * speed;
    b.vy = Math.sin(a) * speed;
    b.life = 1400;
    b.damage = e.damage * 0.7;
    b.r = e.kind === "boss" ? 7 : 5;
    b.chain = 0;
    b.pierce = 0;
    b.split = 0;
    b.over = false;
  }

  private stepBullets(dt: number) {
    for (const b of this.bullets) {
      if (!b.active) continue;
      b.life -= dt * 1000;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.life <= 0) {
        b.active = false;
        continue;
      }
      if (b.hostile) {
        if ((b.x - this.px) ** 2 + (b.y - this.py) ** 2 < 18 * 18 && this.iFrames <= 0) {
          this.hurtPlayer(b.damage);
          b.active = false;
        }
        continue;
      }
      for (const e of this.enemies) {
        if (!e.active) continue;
        if ((e.x - b.x) ** 2 + (e.y - b.y) ** 2 < (e.r + b.r) ** 2) {
          this.hurtEnemy(e, b.damage * executionMul(this.build, e.hp, e.max), false, b.over);
          if (b.split > 0) {
            this.fork(b, e);
            b.split = 0;
          }
          if (b.chain > 0) {
            const n = this.nearest(e.x, e.y, e);
            if (n) {
              b.x = e.x;
              b.y = e.y;
              const a = Math.atan2(n.y - e.y, n.x - e.x);
              b.vx = Math.cos(a) * 500;
              b.vy = Math.sin(a) * 500;
              b.damage = chainDamage(b.damage, b.chain - 1, this.build.chain);
              b.chain -= 1;
              b.life = 380;
            } else b.active = false;
          } else if (b.pierce > 0) {
            b.pierce -= 1;
            b.damage *= 0.7;
          } else b.active = false;
          break;
        }
      }
    }
  }

  private fork(b: Bullet, e: Enemy) {
    for (const ang of [-0.5, 0.5]) {
      const slot = this.bullets.find((x) => !x.active);
      if (!slot) break;
      const a = Math.atan2(b.vy, b.vx) + ang;
      slot.active = true;
      slot.hostile = false;
      slot.x = e.x;
      slot.y = e.y;
      slot.vx = Math.cos(a) * 480;
      slot.vy = Math.sin(a) * 480;
      slot.life = 420;
      slot.damage = b.damage * 0.55;
      slot.r = 3.5;
      slot.chain = 0;
      slot.pierce = 0;
      slot.split = 0;
      slot.over = false;
    }
  }

  private stepPulse(dt: number) {
    if (this.build.pulse <= 0) return;
    if (this.pulseT < 1.6 / this.build.pulse) return;
    this.pulseT = 0;
    const r = 70 + this.build.pulse * 12;
    for (const e of this.enemies) {
      if (!e.active) continue;
      if ((e.x - this.px) ** 2 + (e.y - this.py) ** 2 < (r + e.r) ** 2) {
        this.hurtEnemy(e, this.build.damage * 0.55, false);
      }
    }
    if (this.quality === "high") this.parts.burst(this.px, this.py, 8, 0xf07a3a, 80, 180);
  }

  private stepTrails(dt: number) {
    for (const t of this.trails) {
      if (t.life <= 0) continue;
      for (const e of this.enemies) {
        if (!e.active) continue;
        if ((e.x - t.x) ** 2 + (e.y - t.y) ** 2 < (e.r + t.r) ** 2) {
          this.hurtEnemy(e, this.build.damage * 1.6 * dt, false);
        }
      }
    }
  }

  private hurtPlayer(dmg: number) {
    this.hp -= dmg;
    this.iFrames = 380;
    this.juice.screenShake(5, 80);
    this.juice.flash(0.18);
    this.synth.hit(this.time.now);
    if (this.build.nova > 0) {
      const r = 58 + this.build.nova * 16;
      for (const e of this.enemies) {
        if (!e.active) continue;
        if ((e.x - this.px) ** 2 + (e.y - this.py) ** 2 < (r + e.r) ** 2) {
          this.hurtEnemy(e, this.build.damage * 1.1 * this.build.nova, false);
        }
      }
    }
    if (this.hp < 28) this.synth.tone(90, 0.08, "sine", 0.03, 0.05);
    if (this.hp <= 0) this.die();
  }

  private hurtEnemy(e: Enemy, dmg: number, fromDash: boolean, crit = false) {
    if (!e.active) return;
    e.hp -= dmg;
    e.flash = 0.07;
    this.damageDone += dmg;
    this.juice.hitStop(fromDash ? 36 : crit ? 28 : 14);
    if (this.quality === "high") this.parts.burst(e.x, e.y, crit ? 7 : 4, KIND[e.kind].color, 90, 200);
    if (e.hp <= 0) this.kill(e, fromDash);
  }

  private kill(e: Enemy, fromDash = false) {
    e.active = false;
    this.kills += 1;
    this.parts.burst(e.x, e.y, e.kind === "boss" || e.kind === "elite" ? 18 : 10, KIND[e.kind].color, 170, 280);
    this.synth.tone(160 + Math.random() * 90, 0.05, "sawtooth", 0.03, 0.22);
    if (fromDash && this.dashing > 0) void this.platform.achievement.unlock("dash-kill");
    const orb = this.orbs.find((o) => !o.active);
    if (orb) {
      orb.active = true;
      orb.x = e.x;
      orb.y = e.y;
      orb.vx = (Math.random() - 0.5) * 40;
      orb.vy = (Math.random() - 0.5) * 40;
      orb.value = e.xp;
    }
    if (e.split) {
      void this.platform.achievement.unlock("splitter");
      for (let i = 0; i < 2; i += 1) {
        const slot = this.enemies.find((x) => !x.active);
        if (!slot) break;
        spawnEnemy(slot, "dart", e.x + (i ? 12 : -12), e.y, 0.7);
      }
    }
    if (e.kind === "elite") {
      this.elites += 1;
      void this.platform.achievement.unlock("elite");
    }
    if (this.build.lifesteal > 0) this.hp = Math.min(this.maxHp, this.hp + 2 * this.build.lifesteal);
    if (e.kind === "boss" || e.kind === "warden") {
      this.bossDown = true;
      pulseHaptic([20, 40, 30]);
      this.platform.events.emit({ name: "boss_defeated", props: { gameId: "swarm-protocol" } });
      this.synth.personalBest();
      this.victorious = true;
      this.victoryT = 1400;
      this.juice.flash(0.35);
      this.juice.hitStop(180);
      this.floaters.spawn(this.px, this.py - 48, "CORE DOWN", "#ffd4a8");
      return;
    }
    if (this.kills >= 10) void this.platform.achievement.unlock("first-blood");
    if (this.kills >= 200) void this.platform.achievement.unlock("kills-200");
  }

  private stepOrbs(dt: number) {
    const pullR = magnetRange(this.build);
    for (const o of this.orbs) {
      if (!o.active) continue;
      const a = Math.atan2(this.py - o.y, this.px - o.x);
      const d = Math.hypot(this.px - o.x, this.py - o.y);
      const pull = d < pullR ? 320 + this.build.magnet * 80 : 36;
      o.vx += Math.cos(a) * pull * dt;
      o.vy += Math.sin(a) * pull * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.vx *= 0.9;
      o.vy *= 0.9;
      if (d < 22) {
        o.active = false;
        this.xp += o.value;
        this.synth.pickup();
        const need = xpToLevel(this.level);
        if (this.xp >= need) {
          this.xp -= need;
          this.level += 1;
          this.choosing = pickUpgrades(this.owned);
          this.synth.levelUp();
          this.juice.flash(0.12);
          if (this.level >= 8) void this.platform.achievement.unlock("level-8");
        }
      }
    }
  }

  private take(i: number) {
    if (!this.choosing) return;
    const u = this.choosing[i];
    if (!u) return;
    applyUpgrade(this.build, u.id);
    this.owned.push(u.id);
    if (u.id === "orbital") void this.platform.achievement.unlock("shield");
    if (u.id === "chain") void this.platform.achievement.unlock("chain");
    if (u.id === "shield-wall") {
      this.maxHp += 22;
      this.hp += 22;
    }
    this.platform.events.emit({ name: "upgrade_selected", props: { gameId: "swarm-protocol", upgrade: u.id, level: this.level } });
    this.choosing = null;
  }

  private die() {
    if (this.dead) return;
    this.dead = true;
    this.endedAt = this.time.now;
    const survive = this.time.now - this.started;
    if (survive >= 120000) void this.platform.achievement.unlock("survive-2");
    if (survive >= 300000) void this.platform.achievement.unlock("survive-5");
    this.synth.crash(0.9);
    const pbKey = "gw:swarm-pb-ms";
    let pb = 0;
    try {
      pb = Number(localStorage.getItem(pbKey) ?? 0);
      if (survive > pb) localStorage.setItem(pbKey, String(survive));
    } catch {
      /* noop */
    }
    const top = this.owned[this.owned.length - 1];
    const topName = top ? (this.owned.filter((id) => id === top).length > 1 ? top : top) : "none";
    void topName;
    const counts = new Map<string, number>();
    for (const id of this.owned) counts.set(id, (counts.get(id) ?? 0) + 1);
    let bestId = "";
    let bestN = 0;
    for (const [id, n] of counts) {
      if (n > bestN) {
        bestId = id;
        bestN = n;
      }
    }
    const hintParts = [`Survived ${(survive / 1000).toFixed(0)}s${pb ? ` — PB ${(Math.max(pb, survive) / 1000).toFixed(0)}s` : ""}`];
    const rec = recommendBuild(this.owned);
    if (rec) hintParts.push(rec);
    void this.platform.session.end({
      mode: "survival",
      score: Math.floor(this.kills * 12 + survive / 20 + this.damageDone + (this.bossDown ? 4000 : 0)),
      result: this.bossDown ? "finish" : "death",
      metadata: {
        kills: this.kills,
        surviveMs: survive,
        level: this.level,
        damage: Math.floor(this.damageDone),
        elites: this.elites,
        boss: this.bossDown,
        pbDelta: pb ? survive - pb : survive,
        retryHint: hintParts.join(" · ").slice(0, 118),
        buildHint: (rec || (bestId ? `Core: ${bestId}` : "Build something weirder.")).slice(0, 118),
        seed: this.seed,
        continueEndless: this.bossDown && !this.endless,
      },
    });
  }

  private finishVictory() {
    this.victorious = false;
    this.die();
  }

  private continueEndless() {
    if (!this.bossDown) return;
    this.dead = false;
    this.victorious = false;
    this.endless = true;
    this.game.registry.set("endless", true);
    this.endedAt = 0;
    this.platform.session.start();
  }

  private retry() {
    this.retries += 1;
    this.platform.events.emit({
      name: "game_retry",
      props: {
        gameId: "swarm-protocol",
        time_since_run_end_ms: this.dead ? Math.round(this.time.now - this.endedAt) : 0,
        retry_count_session: this.retries,
      },
    });
    this.scene.restart();
  }

  private draw(dt: number) {
    const g = this.gfx;
    g.clear();
    const fracture = this.endless || this.bossDown;
    fillBackdrop(
      g,
      ARENA,
      ARENA,
      fracture
        ? {
            top: 0x24140c,
            mid: 0x180c08,
            bottom: 0x0c0604,
            grain: 0.05,
            blobs: [
              { color: 0xff6a3a, x: 0.3, y: 0.2, r: 260, alpha: 0.12, parallax: 0.03 },
              { color: 0x6a2010, x: 0.8, y: 0.7, r: 300, alpha: 0.1, parallax: 0.04 },
            ],
          }
        : {
            top: 0x1c1014,
            mid: 0x140c10,
            bottom: 0x0c080a,
            grain: 0.035,
            blobs: [
              { color: 0xf07a3a, x: 0.28, y: 0.22, r: 220, alpha: 0.1, parallax: 0.02 },
              { color: 0x6a2a48, x: 0.74, y: 0.68, r: 260, alpha: 0.09, parallax: 0.03 },
              { color: 0xffc58a, x: 0.56, y: 0.18, r: 140, alpha: 0.05, parallax: 0.04 },
            ],
          },
      { x: this.camX, y: this.camY },
    );
    if (fracture) {
      g.fillStyle(0x3a1810, 0.55);
      g.fillTriangle(80, 200, 240, 80, 300, 340);
      g.fillTriangle(980, 1100, 1200, 860, 1320, 1280);
    } else {
      g.fillStyle(0x2a1620, 0.45);
      g.fillRect(60, 60, 80, ARENA - 120);
      g.fillRect(ARENA - 140, 60, 80, ARENA - 120);
    }
    g.lineStyle(2, 0xf07a3a, 0.18);
    g.strokeRect(20, 20, ARENA - 40, ARENA - 40);
    g.lineStyle(1, 0xffffff, 0.025);
    for (let i = 0; i < ARENA; i += 80) {
      g.lineBetween(i, 0, i, ARENA);
      g.lineBetween(0, i, ARENA, i);
    }

    for (const t of this.trails) {
      if (t.life <= 0) continue;
      g.fillStyle(0xf07a3a, t.life * 0.45);
      g.fillCircle(t.x, t.y, t.r);
    }
    for (const o of this.orbs) {
      if (!o.active) continue;
      g.fillStyle(0xffc58a, 0.9);
      g.fillCircle(o.x, o.y, 4);
    }
    for (const b of this.bullets) {
      if (!b.active) continue;
      g.fillStyle(b.hostile ? 0xc45c3a : b.over ? 0xffe0c0 : 0xf7ebe3, 1);
      g.fillCircle(b.x, b.y, b.r);
    }
    for (const e of this.enemies) {
      if (!e.active) continue;
      if (e.telegraph > 0.05) {
        g.lineStyle(2, 0xff8a6a, 0.35 + e.telegraph * 0.4);
        g.strokeCircle(e.x, e.y, e.r + 10 + e.telegraph * 18);
      }
      const col = e.flash > 0 ? 0xffffff : KIND[e.kind].color;
      g.fillStyle(col, 1);
      if (e.kind === "dart") g.fillTriangle(e.x + e.r, e.y, e.x - e.r * 0.7, e.y - e.r * 0.6, e.x - e.r * 0.7, e.y + e.r * 0.6);
      else if (e.kind === "tank") {
        g.fillRoundedRect(e.x - e.r, e.y - e.r * 0.7, e.r * 2, e.r * 1.4, 4);
        g.fillStyle(0x120c10, 0.4);
        g.fillRect(e.x - e.r + 4, e.y - 4, e.r * 2 - 8, 8);
      } else if (e.kind === "spitter") {
        g.fillCircle(e.x, e.y, e.r);
        g.fillStyle(0xff8a4a, 0.8);
        g.fillCircle(e.x, e.y - e.r * 0.2, e.r * 0.35);
      } else if (e.kind === "splitter") {
        g.fillTriangle(e.x, e.y - e.r, e.x + e.r, e.y + e.r * 0.6, e.x - e.r, e.y + e.r * 0.6);
        g.fillCircle(e.x, e.y, e.r * 0.35);
      } else if (e.kind === "swarmling") g.fillCircle(e.x, e.y, e.r);
      else if (e.kind === "chaser") {
        g.fillCircle(e.x, e.y, e.r);
        g.fillStyle(0x120c10, 0.5);
        g.fillCircle(e.x + 3, e.y - 2, 3);
      } else if (e.kind === "warden") {
        g.fillRoundedRect(e.x - e.r, e.y - e.r, e.r * 2, e.r * 2, 8);
        g.fillStyle(0xffe0c0, 0.7);
        g.fillRect(e.x - 6, e.y - e.r - 8, 12, 10);
      } else g.fillCircle(e.x, e.y, e.r);
      if (e.kind === "boss" || e.kind === "elite" || e.kind === "warden") {
        g.fillStyle(0x120c10, 0.8);
        g.fillRect(e.x - e.r, e.y - e.r - 8, e.r * 2, 4);
        g.fillStyle(0xf07a3a, 1);
        g.fillRect(e.x - e.r, e.y - e.r - 8, e.r * 2 * Math.max(0, e.hp / e.max), 4);
      }
    }
    for (const p of this.parts.items) {
      if (!p.active) continue;
      g.fillStyle(p.color, p.life / p.max);
      g.fillCircle(p.x, p.y, p.size);
    }

    const drones = Math.max(3, this.build.orbital);
    for (let i = 0; i < drones; i += 1) {
      const sa = this.shieldA + (i * Math.PI * 2) / drones;
      g.fillStyle(0xf7ebe3, 0.92);
      g.fillCircle(this.px + Math.cos(sa) * 48, this.py + Math.sin(sa) * 48, 6);
      g.fillStyle(0xf07a3a, 0.55);
      g.fillCircle(this.px + Math.cos(sa) * 48, this.py + Math.sin(sa) * 48, 2.4);
    }

    const heading = Math.atan2(this.vy, this.vx);
    g.save();
    g.translateCanvas(this.px, this.py);
    g.rotateCanvas(Math.hypot(this.vx, this.vy) > 8 ? heading : 0);
    g.fillStyle(this.iFrames > 0 ? 0xffffff : 0xf07a3a, 1);
    g.fillTriangle(16, 0, -10, -9, -10, 9);
    g.fillStyle(0xffe8d4, this.hp / this.maxHp > 0.35 ? 0.9 : 0.35);
    g.fillCircle(0, 0, 5);
    if (this.dashing > 0) {
      g.fillStyle(0xffffff, 0.35);
      g.fillTriangle(-16, 0, -28, -6, -28, 6);
    }
    g.restore();
    if (this.build.nova + this.build.shieldWall > 0) {
      g.lineStyle(2, 0xffc58a, 0.35);
      g.strokeCircle(this.px, this.py, 20 + this.build.shieldWall * 4);
    }

    const survive = (this.time.now - this.started) / 1000;
    const need = xpToLevel(this.level);
    const phase = phaseFor(survive);
    this.hud.setText(
      `${survive.toFixed(0)}s   lv ${this.level}   ${this.kills} down\nHP ${Math.max(0, Math.ceil(this.hp))}   ${phase}${this.bossSpawned ? (this.bossDown ? "  core down" : "  CORE") : ""}`,
    );
    void need;

    fillVignette(g, ARENA, ARENA, 0.32);
    this.overlay.clear();
    const fa = this.juice.flashAlpha(dt);
    if (fa) {
      this.overlay.fillStyle(0xffffff, fa);
      this.overlay.fillRect(0, 0, this.scale.width, this.scale.height);
    }
    this.overlay.fillStyle(0xc45c3a, 0.85);
    this.overlay.fillRect(22, 118, Math.max(0, (this.hp / this.maxHp) * 120), 6);

    if (this.sys.game.device.input.touch) {
      this.overlay.fillStyle(0xffffff, 0.06);
      this.overlay.fillCircle(86, this.scale.height - 86, 54);
      this.overlay.fillStyle(0xf07a3a, 0.22);
      this.overlay.fillCircle(this.scale.width - 72, this.scale.height - 86, 42);
      if (this.stick.active) {
        this.overlay.fillStyle(0xffffff, 0.35);
        this.overlay.fillCircle(this.stick.originX + this.stick.x * 48, this.stick.originY + this.stick.y * 48, 10);
      }
    }

    if (this.choosing) {
      this.overlay.fillStyle(0x000000, 0.5);
      this.overlay.fillRect(0, 0, this.scale.width, this.scale.height);
      const count = this.choosing.length;
      const gap = 12;
      const cardW = Math.min(210, Math.max(148, (this.scale.width - 40 - gap * (count - 1)) / count));
      const cardH = Math.min(210, Math.max(176, this.scale.height * 0.32));
      const total = count * cardW + (count - 1) * gap;
      const left = (this.scale.width - total) / 2;
      const top = this.scale.height / 2 - cardH / 2;
      this.cardHits = [];
      this.choosing.forEach((u, i) => {
        const x = left + i * (cardW + gap);
        const y = top;
        this.cardHits.push({ x, y, w: cardW, h: cardH });
        this.overlay.fillStyle(0x1a120f, 0.96);
        this.overlay.fillRoundedRect(x, y, cardW, cardH, 14);
        this.overlay.lineStyle(2, 0xf07a3a, 0.75);
        this.overlay.strokeRoundedRect(x, y, cardW, cardH, 14);
        const owned = this.owned.filter((id) => id === u.id).length;
        const syn = recommendBuild([...this.owned, u.id]);
        this.cards[i]
          .setText(`${u.name}\n${u.desc}\nlv ${owned + 1}${syn ? `\n${syn}` : ""}`)
          .setPosition(x + 16, y + 18)
          .setWordWrapWidth(cardW - 28)
          .setAlpha(1);
      });
    } else {
      this.cardHits = [];
      this.cards.forEach((c) => c.setAlpha(0));
    }
    this.publishDebug();
  }

  private publishDebug() {
    publishGwDebug(
      {
        gameId: "swarm-protocol",
        ready: this.signaledReady,
        runState: this.dead ? "ended" : this.choosing ? "choosing" : this.paused ? "paused" : "playing",
        playerX: this.px,
        playerY: this.py,
        score: this.kills,
        paused: this.paused,
        fps: this.game.loop.actualFps,
        longFrames: this.longFrames,
        kills: this.kills,
        level: this.level,
        tick: this.ticks,
        frozen: false,
      },
      {
        pickUpgrade: (i) => this.take(i),
        grantXp: (amount) => {
          this.xp += amount;
          const need = xpToLevel(this.level);
          if (this.xp >= need) {
            this.xp -= need;
            this.level += 1;
            this.choosing = pickUpgrades(this.owned);
          }
        },
        killPlayer: () => this.die(),
        finishRun: () => {
          this.bossDown = true;
          this.finishVictory();
        },
        hideHud: () => {
          this.hud.setVisible(false);
          this.overlay.setVisible(false);
        },
      },
    );
  }

  shutdown() {
    this.nativeKeys?.destroy();
    this.nativeKeys = null;
    clearGwDebug();
  }
}

export function mountSwarmProtocol(parent: HTMLElement, platform: PlatformSDK) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: Math.max(320, parent.clientWidth || 1280),
    height: Math.max(240, parent.clientHeight || 720),
    backgroundColor: "#120c10",
    scale: { mode: Phaser.Scale.RESIZE },
    scene: [SwarmPlayScene],
    disableContextMenu: true,
    banner: false,
    autoFocus: true,
    input: { keyboard: { target: typeof window !== "undefined" ? window : undefined }, activePointers: 4 },
    fps: { target: 60 },
    render: { preserveDrawingBuffer: true },
  });
  game.registry.set("platform", platform);
  game.registry.set("manifest", swarmProtocolManifest);
  (game as Phaser.Game & { restartRun: () => void }).restartRun = () => {
    game.scene.getScene("swarm-play")?.scene.restart();
  };
  game.events.once("destroy", () => {
    const synth = game.registry.get("synth") as Synth | undefined;
    synth?.dispose();
    clearGwDebug();
  });
  return game;
}
