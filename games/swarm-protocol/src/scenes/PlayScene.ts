import Phaser from "phaser";
import { FloatingTextPool, Juice, ParticlePool, Synth, clamp } from "@gamesweb/game-core";
import type { PlatformSDK } from "@gamesweb/game-sdk";
import { swarmProtocolManifest } from "@gamesweb/game-sdk";
import {
  applyUpgrade,
  BASE_BUILD,
  KIND,
  pickUpgrades,
  spawnEnemy,
  xpToLevel,
  type Build,
  type Bullet,
  type Enemy,
  type EnemyKind,
  type Orb,
  type UpgradeDef,
  type UpgradeId,
} from "../systems/sim";

const ARENA = 1400;

export class SwarmPlayScene extends Phaser.Scene {
  private platform!: PlatformSDK;
  private juice = new Juice();
  private parts = new ParticlePool(320);
  private floaters = new FloatingTextPool(28);
  private synth = new Synth();
  private gfx!: Phaser.GameObjects.Graphics;
  private overlay!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
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
  private enemies: Enemy[] = [];
  private bullets: Bullet[] = [];
  private orbs: Orb[] = [];
  private fireAcc = 0;
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
  private stick = { x: 0, y: 0 };
  private shieldA = 0;
  private wave = 1;
  private lastSpawn = 0;
  private elites = 0;

  constructor() {
    super("swarm-play");
  }

  create() {
    this.platform = this.game.registry.get("platform") as PlatformSDK;
    this.resetRun();
    this.cameras.main.setBackgroundColor("#140e0c");
    this.gfx = this.add.graphics();
    this.overlay = this.add.graphics().setScrollFactor(0).setDepth(20);
    this.hud = this.add
      .text(22, 18, "", { fontFamily: "ui-sans-serif, system-ui", fontSize: "16px", color: "#f7ebe3" })
      .setScrollFactor(0)
      .setDepth(21);
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
    for (let i = 0; i < 80; i += 1) {
      this.enemies.push({
        active: false,
        kind: "chaser",
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        hp: 0,
        max: 1,
        r: 8,
        speed: 0,
        damage: 0,
        xp: 0,
        flash: 0,
        split: false,
      });
    }
    for (let i = 0; i < 80; i += 1) {
      this.bullets.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, damage: 0, r: 4, chain: 0 });
    }
    for (let i = 0; i < 120; i += 1) {
      this.orbs.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, value: 1 });
    }

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      void this.synth.resume();
      if (this.choosing) {
        const i = Math.floor(((p.x - (this.scale.width / 2 - 330)) / 230));
        if (i >= 0 && i < 3) this.take(i);
        return;
      }
      if (this.dashCd <= 0) this.dash();
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (p.isDown && p.wasTouch) {
        this.stick.x = Math.cos(Math.atan2(p.worldY - this.py, p.worldX - this.px));
        this.stick.y = Math.sin(Math.atan2(p.worldY - this.py, p.worldX - this.px));
      }
    });
    this.input.on("pointerup", () => {
      this.stick.x = 0;
      this.stick.y = 0;
    });

    this.platform.session.start();
    this.platform.events.emit({ name: "gameplay_started", props: { gameId: "swarm-protocol" } });
    void this.synth.resume().then(() => this.synth.startBed("swarm"));
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
    this.xp = 0;
    this.level = 1;
    this.kills = 0;
    this.damageDone = 0;
    this.dead = false;
    this.choosing = null;
    this.wave = 1;
    this.elites = 0;
  }

  update(_: number, delta: number) {
    const dt = Math.min(0.033, delta / 1000);
    if (this.dead && Phaser.Input.Keyboard.JustDown(this.keys.r)) {
      this.synth.dispose();
      this.platform.events.emit({ name: "game_retry", props: { gameId: "swarm-protocol" } });
      this.scene.restart();
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
    const mag = Math.hypot(mx, my) || 1;
    const speed = this.build.move * (this.dashing > 0 ? 2.4 : 1);
    this.vx = (mx / mag) * speed;
    this.vy = (my / mag) * speed;
    this.px = clamp(this.px + this.vx * dt, 40, ARENA - 40);
    this.py = clamp(this.py + this.vy * dt, 40, ARENA - 40);

    if (Phaser.Input.Keyboard.JustDown(this.keys.dash) && this.dashCd <= 0) this.dash();
    this.dashCd = Math.max(0, this.dashCd - dt * 1000);
    this.dashing = Math.max(0, this.dashing - dt * 1000);
    this.iFrames = Math.max(0, this.iFrames - dt * 1000);
    this.shieldA += dt * (1.6 + this.build.shield);

    this.spawnWave(dt);
    this.fire(dt);
    this.stepEnemies(dt);
    this.stepBullets(dt);
    this.stepOrbs(dt);

    this.camX += (this.px - this.camX) * (1 - Math.exp(-dt * 8));
    this.camY += (this.py - this.camY) * (1 - Math.exp(-dt * 8));
    const sh = this.juice.applyCamera({ x: this.camX, y: this.camY }, this.time.now);
    this.cameras.main.centerOn(sh.x, sh.y);
    this.parts.update(dt);
    this.floaters.update(dt);
    this.draw(dt);
  }

  private dash() {
    this.dashing = 180;
    this.iFrames = 180;
    this.dashCd = this.build.dashCd;
    this.juice.cameraPunch(0.6);
    this.synth.noiseBurst(0.08, 0.04, 600);
  }

  private spawnWave(dt: number) {
    const elapsed = (this.time.now - this.started) / 1000;
    this.wave = 1 + Math.floor(elapsed / 22);
    const want = Math.min(70, 8 + this.wave * 3);
    const live = this.enemies.filter((e) => e.active).length;
    this.lastSpawn -= dt;
    if (live >= want || this.lastSpawn > 0) return;
    this.lastSpawn = Math.max(0.12, 0.55 - this.wave * 0.03);
    const kinds: EnemyKind[] = ["chaser", "chaser", "dart"];
    if (this.wave >= 2) kinds.push("tank", "spitter");
    if (this.wave >= 3) kinds.push("splitter");
    let kind: EnemyKind = kinds[Math.floor(Math.random() * kinds.length)];
    if (this.wave >= 3 && Math.random() < 0.06) kind = "elite";
    const slot = this.enemies.find((e) => !e.active);
    if (!slot) return;
    const a = Math.random() * Math.PI * 2;
    const dist = 520 + Math.random() * 180;
    spawnEnemy(slot, kind, this.px + Math.cos(a) * dist, this.py + Math.sin(a) * dist, 1 + this.wave * 0.12);
    slot.x = clamp(slot.x, 30, ARENA - 30);
    slot.y = clamp(slot.y, 30, ARENA - 30);
  }

  private fire(dt: number) {
    this.fireAcc += dt * this.build.fireRate;
    const target = this.nearest(this.px, this.py);
    if (!target || this.fireAcc < 1) return;
    this.fireAcc -= 1;
    const base = Math.atan2(target.y - this.py, target.x - this.px);
    const n = this.build.projectiles;
    for (let i = 0; i < n; i += 1) {
      const b = this.bullets.find((x) => !x.active);
      if (!b) break;
      const spread = (i - (n - 1) / 2) * 0.16;
      const a = base + spread;
      b.active = true;
      b.x = this.px;
      b.y = this.py;
      b.vx = Math.cos(a) * 520;
      b.vy = Math.sin(a) * 520;
      b.life = 700;
      b.damage = this.build.damage * (Math.random() < this.build.crit ? 2 : 1);
      b.r = 4;
      b.chain = this.build.chain;
    }
    this.synth.tone(420, 0.04, "square", 0.025, 0.1);
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
      const a = Math.atan2(this.py - e.y, this.px - e.x);
      if (e.kind === "spitter") {
        const dist = Math.hypot(this.px - e.x, this.py - e.y);
        if (dist < 260) {
          e.x -= Math.cos(a) * e.speed * 0.4 * dt;
          e.y -= Math.sin(a) * e.speed * 0.4 * dt;
        } else {
          e.x += Math.cos(a) * e.speed * dt;
          e.y += Math.sin(a) * e.speed * dt;
        }
        if (Math.random() < dt * 0.7) this.spit(e);
      } else {
        e.x += Math.cos(a) * e.speed * dt;
        e.y += Math.sin(a) * e.speed * dt;
      }

      if (this.build.shield > 0) {
        for (let i = 0; i < this.build.shield; i += 1) {
          const sa = this.shieldA + (i * Math.PI * 2) / this.build.shield;
          const sx = this.px + Math.cos(sa) * 46;
          const sy = this.py + Math.sin(sa) * 46;
          if ((e.x - sx) ** 2 + (e.y - sy) ** 2 < (e.r + 10) ** 2) {
            this.hurtEnemy(e, this.build.damage * 0.35, false);
          }
        }
      }

      const d2 = (e.x - this.px) ** 2 + (e.y - this.py) ** 2;
      if (d2 < (e.r + 14) ** 2) {
        if (this.dashing > 0) {
          this.hurtEnemy(e, this.build.damage * 1.4, true);
          void this.platform.achievement.unlock("dash-kill");
        } else if (this.iFrames <= 0) {
          this.hp -= e.damage;
          this.iFrames = 420;
          this.juice.screenShake(6, 100);
          this.juice.flash(0.2);
          this.synth.hit(this.time.now);
          if (this.hp <= 0) this.die();
        }
      }
    }
  }

  private spit(e: Enemy) {
    const b = this.bullets.find((x) => !x.active);
    if (!b) return;
    const a = Math.atan2(this.py - e.y, this.px - e.x);
    b.active = true;
    b.x = e.x;
    b.y = e.y;
    b.vx = Math.cos(a) * 220;
    b.vy = Math.sin(a) * 220;
    b.life = 1200;
    b.damage = -e.damage * 0.6;
    b.r = 5;
    b.chain = 0;
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
      if (b.damage < 0) {
        if ((b.x - this.px) ** 2 + (b.y - this.py) ** 2 < 18 * 18 && this.iFrames <= 0) {
          this.hp += b.damage;
          b.active = false;
          this.iFrames = 300;
          if (this.hp <= 0) this.die();
        }
        continue;
      }
      for (const e of this.enemies) {
        if (!e.active) continue;
        if ((e.x - b.x) ** 2 + (e.y - b.y) ** 2 < (e.r + b.r) ** 2) {
          this.hurtEnemy(e, b.damage, false);
          if (b.chain > 0) {
            const n = this.nearest(e.x, e.y, e);
            if (n) {
              b.x = e.x;
              b.y = e.y;
              const a = Math.atan2(n.y - e.y, n.x - e.x);
              b.vx = Math.cos(a) * 480;
              b.vy = Math.sin(a) * 480;
              b.chain -= 1;
              b.damage *= 0.75;
              b.life = 400;
            } else b.active = false;
          } else b.active = false;
          break;
        }
      }
    }
  }

  private hurtEnemy(e: Enemy, dmg: number, fromDash: boolean) {
    e.hp -= dmg;
    e.flash = 0.08;
    this.damageDone += dmg;
    this.juice.hitStop(fromDash ? 40 : 18);
    this.parts.burst(e.x, e.y, 5, KIND[e.kind].color, 90, 220);
    if (e.hp <= 0) this.kill(e);
  }

  private kill(e: Enemy) {
    e.active = false;
    this.kills += 1;
    this.parts.burst(e.x, e.y, 12, KIND[e.kind].color, 160, 300);
    this.synth.tone(180 + Math.random() * 80, 0.05, "sawtooth", 0.03, 0.2);
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
    if (this.kills >= 10) void this.platform.achievement.unlock("first-blood");
    if (this.kills >= 200) void this.platform.achievement.unlock("kills-200");
  }

  private stepOrbs(dt: number) {
    for (const o of this.orbs) {
      if (!o.active) continue;
      const a = Math.atan2(this.py - o.y, this.px - o.x);
      const d = Math.hypot(this.px - o.x, this.py - o.y);
      const pull = d < 140 ? 280 : 40;
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
          this.choosing = pickUpgrades([]);
          this.synth.levelUp();
          this.juice.flash(0.15);
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
    if (u.id === "shield") void this.platform.achievement.unlock("shield");
    if (u.id === "chain") void this.platform.achievement.unlock("chain");
    this.choosing = null;
  }

  private die() {
    if (this.dead) return;
    this.dead = true;
    const survive = this.time.now - this.started;
    if (survive >= 120000) void this.platform.achievement.unlock("survive-2");
    if (survive >= 300000) void this.platform.achievement.unlock("survive-5");
    this.synth.crash();
    void this.platform.session.end({
      mode: "survival",
      score: Math.floor(this.kills * 12 + survive / 20 + this.damageDone),
      result: "death",
      metadata: {
        kills: this.kills,
        surviveMs: survive,
        level: this.level,
        damage: Math.floor(this.damageDone),
        elites: this.elites,
      },
    });
  }

  private draw(dt: number) {
    const g = this.gfx;
    g.clear();
    g.fillStyle(0x1a120f, 1);
    g.fillRect(0, 0, ARENA, ARENA);
    g.lineStyle(2, 0xf07a3a, 0.15);
    g.strokeRect(20, 20, ARENA - 40, ARENA - 40);
    g.lineStyle(1, 0xffffff, 0.03);
    for (let i = 0; i < ARENA; i += 70) {
      g.lineBetween(i, 0, i, ARENA);
      g.lineBetween(0, i, ARENA, i);
    }

    for (const o of this.orbs) {
      if (!o.active) continue;
      g.fillStyle(0xffc58a, 0.9);
      g.fillCircle(o.x, o.y, 4);
    }
    for (const b of this.bullets) {
      if (!b.active) continue;
      g.fillStyle(b.damage < 0 ? 0xc45c3a : 0xf7ebe3, 1);
      g.fillCircle(b.x, b.y, b.r);
    }
    for (const e of this.enemies) {
      if (!e.active) continue;
      g.fillStyle(e.flash > 0 ? 0xffffff : KIND[e.kind].color, 1);
      if (e.kind === "tank" || e.kind === "elite") g.fillCircle(e.x, e.y, e.r);
      else if (e.kind === "dart") g.fillTriangle(e.x, e.y - e.r, e.x + e.r, e.y + e.r * 0.7, e.x - e.r, e.y + e.r * 0.7);
      else if (e.kind === "spitter") g.fillRoundedRect(e.x - e.r, e.y - e.r * 0.7, e.r * 2, e.r * 1.4, 4);
      else g.fillCircle(e.x, e.y, e.r);
    }
    for (const p of this.parts.items) {
      if (!p.active) continue;
      g.fillStyle(p.color, p.life / p.max);
      g.fillCircle(p.x, p.y, p.size);
    }

    if (this.build.shield) {
      for (let i = 0; i < this.build.shield; i += 1) {
        const sa = this.shieldA + (i * Math.PI * 2) / this.build.shield;
        g.fillStyle(0xf7ebe3, 0.9);
        g.fillCircle(this.px + Math.cos(sa) * 46, this.py + Math.sin(sa) * 46, 6);
      }
    }

    g.fillStyle(this.iFrames > 0 ? 0xffffff : 0xf07a3a, 1);
    g.fillCircle(this.px, this.py, 12);
    g.fillStyle(0x140e0c, 1);
    g.fillCircle(this.px, this.py, 5);

    const survive = (this.time.now - this.started) / 1000;
    const need = xpToLevel(this.level);
    this.hud.setText(
      `${survive.toFixed(0)}s   lv ${this.level}   ${this.kills} down\nHP ${Math.max(0, Math.ceil(this.hp))}   xp ${Math.floor(this.xp)}/${need}`,
    );

    this.overlay.clear();
    const fa = this.juice.flashAlpha(dt);
    if (fa) {
      this.overlay.fillStyle(0xffffff, fa);
      this.overlay.fillRect(0, 0, this.scale.width, this.scale.height);
    }

    if (this.choosing) {
      this.overlay.fillStyle(0x000000, 0.45);
      this.overlay.fillRect(0, 0, this.scale.width, this.scale.height);
      this.choosing.forEach((u, i) => {
        const x = this.scale.width / 2 - 330 + i * 230;
        const y = this.scale.height / 2 - 70;
        this.overlay.fillStyle(0x1a120f, 0.95);
        this.overlay.fillRoundedRect(x, y, 210, 150, 14);
        this.overlay.lineStyle(2, 0xf07a3a, 0.7);
        this.overlay.strokeRoundedRect(x, y, 210, 150, 14);
      });
      this.hud.setText(
        this.choosing.map((u, i) => `${i + 1}  ${u.name}\n    ${u.desc}`).join("\n\n") + "\n\nPress 1 / 2 / 3",
      );
    }
  }

  shutdown() {
    this.synth.dispose();
  }
}

export function mountSwarmProtocol(parent: HTMLElement, platform: PlatformSDK) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#140e0c",
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [SwarmPlayScene],
    disableContextMenu: true,
    banner: false,
    fps: { target: 60 },
  });
  game.registry.set("platform", platform);
  game.registry.set("manifest", swarmProtocolManifest);
  return game;
}
