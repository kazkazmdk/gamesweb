import Phaser from "phaser";
import { clamp, FloatingTextPool, Juice, ParticlePool, pulseHaptic, Synth } from "@gamesweb/game-core";
import type { PlatformSDK } from "@gamesweb/game-sdk";
import { swarmProtocolManifest } from "@gamesweb/game-sdk";
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
  private camX = ARENA / 2;
  private camY = ARENA / 2;
  private stick = { x: 0, y: 0, originX: 0, originY: 0, active: false };
  private shieldA = 0;
  private pulseT = 0;
  private elites = 0;
  private audioReady = false;
  private bossSpawned = false;
  private bossDown = false;
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
    this.cameras.main.setBackgroundColor("#120c10");
    this.gfx = this.add.graphics();
    this.overlay = this.add.graphics().setScrollFactor(0).setDepth(20);
    this.hud = this.add
      .text(22, 52, "", { fontFamily: "ui-sans-serif, system-ui", fontSize: "16px", color: "#f7ebe3" })
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
      down: kb.addKey("S"),
      down2: kb.addKey("DOWN"),
      left: kb.addKey("A"),
      left2: kb.addKey("LEFT"),
      right: kb.addKey("D"),
      right2: kb.addKey("RIGHT"),
      dash: kb.addKey("SHIFT"),
      r: kb.addKey("R"),
      esc: kb.addKey("ESC"),
      one: kb.addKey("ONE"),
      two: kb.addKey("TWO"),
      three: kb.addKey("THREE"),
    };
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

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.ensureAudio();
      if (this.choosing) {
        const i = Math.floor((p.x - (this.scale.width / 2 - 330)) / 230);
        if (i >= 0 && i < 3) this.take(i);
        return;
      }
      if (p.wasTouch) {
        if (p.x > this.scale.width * 0.72) this.tryDash();
        else {
          this.stick.active = true;
          this.stick.originX = p.x;
          this.stick.originY = p.y;
        }
      }
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!this.stick.active) return;
      const dx = p.x - this.stick.originX;
      const dy = p.y - this.stick.originY;
      const m = Math.hypot(dx, dy) || 1;
      const cap = 54;
      this.stick.x = (dx / m) * Math.min(1, m / cap);
      this.stick.y = (dy / m) * Math.min(1, m / cap);
    });
    this.input.on("pointerup", () => {
      this.stick.active = false;
      this.stick.x = 0;
      this.stick.y = 0;
    });

    this.platform.session.start();
    this.platform.events.emit({ name: "gameplay_started", props: { gameId: "swarm-protocol" } });
    this.fitCam(this.scale.width, this.scale.height);
    this.scale.on("resize", (gs: Phaser.Structs.Size) => this.fitCam(gs.width, gs.height));
    this.game.events.on("platform-pause", () => (this.paused = true));
    this.game.events.on("platform-resume", () => (this.paused = false));
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
    this.bossSpawned = false;
    this.bossDown = false;
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
    if (this.dead && Phaser.Input.Keyboard.JustDown(this.keys.r)) {
      this.retry();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.esc)) this.platform.pause.request();
    if (this.paused && !this.choosing) {
      this.draw(dt);
      return;
    }
    if (this.choosing) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.one)) this.take(0);
      if (Phaser.Input.Keyboard.JustDown(this.keys.two)) this.take(1);
      if (Phaser.Input.Keyboard.JustDown(this.keys.three)) this.take(2);
      this.draw(dt);
      return;
    }
    if (this.dead) {
      this.draw(dt);
      return;
    }

    let mx =
      Number(this.keys.right.isDown || this.keys.right2.isDown) -
      Number(this.keys.left.isDown || this.keys.left2.isDown);
    let my =
      Number(this.keys.down.isDown || this.keys.down2.isDown) -
      Number(this.keys.up.isDown || this.keys.up2.isDown);
    if (this.stick.x || this.stick.y) {
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

    if (Phaser.Input.Keyboard.JustDown(this.keys.dash)) this.tryDash();
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
    const live = this.enemies.reduce((n, e) => n + (e.active && e.kind !== "boss" ? 1 : 0), 0);
    const want = desiredCount(elapsed);
    if (!this.bossSpawned && elapsed >= BOSS_AT) {
      const slot = this.enemies.find((e) => !e.active);
      if (slot) {
        spawnEnemy(slot, "boss", ARENA / 2, 120, 1);
        this.bossSpawned = true;
        this.synth.levelUp();
        this.juice.flash(0.2);
        this.floaters.spawn(this.px, this.py - 40, "PROTOCOL CORE", "#ffd4a8");
      }
    }
    if (live >= want) return;
    if (Math.random() > dt * (2.2 + elapsed * 0.01)) return;
    const slot = this.enemies.find((e) => !e.active);
    if (!slot) return;
    const kind = pickKind(elapsed, elapsed > 90);
    if (kind === "elite" && this.time.now - this.lastEliteWarn > 4000) {
      this.lastEliteWarn = this.time.now;
      this.synth.tone(140, 0.16, "sawtooth", 0.05, 0.1);
    }
    const a = Math.random() * Math.PI * 2;
    const dist = 540 + Math.random() * 160;
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
      const spread = (i - (n - 1) / 2) * 0.14;
      const a = base + spread;
      b.active = true;
      b.hostile = false;
      b.x = this.px;
      b.y = this.py;
      b.vx = Math.cos(a) * (over ? 580 : 530);
      b.vy = Math.sin(a) * (over ? 580 : 530);
      b.life = 760;
      b.damage = this.build.damage * critMul(this.build) * (over ? 1.8 + this.build.overcharge * 0.2 : 1);
      b.r = over ? 8 : 4;
      b.chain = this.build.chain;
      b.pierce = this.build.pierce;
      b.split = this.build.split;
      b.over = over;
    }
    const pitch = 400 + this.build.projectiles * 18 + (over ? 80 : 0);
    this.synth.tone(pitch, 0.035, "square", over ? 0.04 : 0.022, 0.12);
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
      if (e.kind === "boss") this.stepBoss(e, dt);
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

      if (this.build.orbital > 0) {
        for (let i = 0; i < this.build.orbital; i += 1) {
          const sa = this.shieldA + (i * Math.PI * 2) / this.build.orbital;
          const sx = this.px + Math.cos(sa) * 48;
          const sy = this.py + Math.sin(sa) * 48;
          if ((e.x - sx) ** 2 + (e.y - sy) ** 2 < (e.r + 12) ** 2) {
            this.hurtEnemy(e, this.build.damage * 0.4, false);
          }
        }
      }

      const d2 = (e.x - this.px) ** 2 + (e.y - this.py) ** 2;
      if (d2 < (e.r + 14) ** 2) {
        if (this.dashing > 0) {
          this.hurtEnemy(e, this.build.damage * 1.45, true);
          void this.platform.achievement.unlock("dash-kill");
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
    if (e.hp <= 0) this.kill(e);
  }

  private kill(e: Enemy) {
    e.active = false;
    this.kills += 1;
    this.parts.burst(e.x, e.y, e.kind === "boss" || e.kind === "elite" ? 18 : 10, KIND[e.kind].color, 170, 280);
    this.synth.tone(160 + Math.random() * 90, 0.05, "sawtooth", 0.03, 0.22);
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
    if (e.kind === "boss") {
      this.bossDown = true;
      pulseHaptic([20, 40, 30]);
      this.platform.events.emit({ name: "boss_defeated", props: { gameId: "swarm-protocol" } });
      this.synth.personalBest();
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
      },
    });
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
    g.fillStyle(0x161014, 1);
    g.fillRect(0, 0, ARENA, ARENA);
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
      g.fillStyle(e.flash > 0 ? 0xffffff : KIND[e.kind].color, 1);
      if (e.kind === "tank" || e.kind === "elite" || e.kind === "boss") g.fillCircle(e.x, e.y, e.r);
      else if (e.kind === "dart") g.fillTriangle(e.x, e.y - e.r, e.x + e.r, e.y + e.r * 0.7, e.x - e.r, e.y + e.r * 0.7);
      else if (e.kind === "spitter") g.fillRoundedRect(e.x - e.r, e.y - e.r * 0.7, e.r * 2, e.r * 1.4, 4);
      else g.fillCircle(e.x, e.y, e.r);
      if (e.kind === "boss" || e.kind === "elite") {
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

    if (this.build.orbital) {
      for (let i = 0; i < this.build.orbital; i += 1) {
        const sa = this.shieldA + (i * Math.PI * 2) / this.build.orbital;
        g.fillStyle(0xf7ebe3, 0.9);
        g.fillCircle(this.px + Math.cos(sa) * 48, this.py + Math.sin(sa) * 48, 6);
      }
    }

    g.fillStyle(this.iFrames > 0 ? 0xffffff : 0xf07a3a, 1);
    g.fillCircle(this.px, this.py, 12);
    g.fillStyle(0x140e0c, 1);
    g.fillCircle(this.px, this.py, 5);

    const survive = (this.time.now - this.started) / 1000;
    const need = xpToLevel(this.level);
    const phase = phaseFor(survive);
    this.hud.setText(
      `${survive.toFixed(0)}s   lv ${this.level}   ${this.kills} down\nHP ${Math.max(0, Math.ceil(this.hp))}   ${phase}${this.bossSpawned ? (this.bossDown ? "  core down" : "  CORE") : ""}`,
    );
    void need;

    this.overlay.clear();
    const fa = this.juice.flashAlpha(dt);
    if (fa) {
      this.overlay.fillStyle(0xffffff, fa);
      this.overlay.fillRect(0, 0, this.scale.width, this.scale.height);
    }
    this.overlay.fillStyle(0xc45c3a, 0.85);
    this.overlay.fillRect(22, 96, Math.max(0, (this.hp / this.maxHp) * 120), 6);

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
      this.choosing.forEach((u, i) => {
        const x = this.scale.width / 2 - 330 + i * 230;
        const y = this.scale.height / 2 - 80;
        this.overlay.fillStyle(0x1a120f, 0.96);
        this.overlay.fillRoundedRect(x, y, 210, 168, 14);
        this.overlay.lineStyle(2, 0xf07a3a, 0.75);
        this.overlay.strokeRoundedRect(x, y, 210, 168, 14);
        const owned = this.owned.filter((id) => id === u.id).length;
        this.cards[i]
          .setText(`${i + 1}  ${u.name}\n${u.desc}\nlv ${owned + 1}`)
          .setPosition(x + 16, y + 18)
          .setAlpha(1);
      });
    } else {
      this.cards.forEach((c) => c.setAlpha(0));
    }
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
    fps: { target: 60 },
  });
  game.registry.set("platform", platform);
  game.registry.set("manifest", swarmProtocolManifest);
  (game as Phaser.Game & { restartRun: () => void }).restartRun = () => {
    game.scene.getScene("swarm-play")?.scene.restart();
  };
  game.events.once("destroy", () => {
    const synth = game.registry.get("synth") as Synth | undefined;
    synth?.dispose();
  });
  return game;
}
