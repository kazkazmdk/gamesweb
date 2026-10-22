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
  drawParticles,
  drawShinyBall,
  fillBackdrop,
  type GameKeyboard,
} from "@gamesweb/game-core";
import { pocketStrikerManifest, readRunContext, type PlatformSDK } from "@gamesweb/game-sdk";
import { LAYOUTS, type Layout } from "../systems/layouts";
import { stepBall, type BallState } from "../systems/physics";

const BALL_R = 11;

export class PocketScene extends Phaser.Scene {
  private platform!: PlatformSDK;
  private layout!: Layout;
  private table!: Layout;
  private layoutIndex = 0;
  private juice = new Juice();
  private parts!: ParticlePool;
  private synth!: Synth;
  private gfx!: Phaser.GameObjects.Graphics;
  private overlay!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private bannerLabel!: Phaser.GameObjects.Text;
  private powerLabel!: Phaser.GameObjects.Text;
  private native: GameKeyboard | null = null;
  private bx = 0;
  private by = 0;
  private vx = 0;
  private vy = 0;
  private spinPhase = 0;
  private spinAngle = 0;
  private strokes = 0;
  private aiming = false;
  private ax = 0;
  private ay = 0;
  private lastPower = 0;
  private bumperShockwaves: Array<{ x: number; y: number; r: number; t: number }> = [];
  private ended = false;
  private banked = false;
  private wallThisShot = false;
  private signaledReady = false;
  private ticks = 0;
  private longFrames = 0;
  private started = 0;
  private scaleX = 1;
  private scaleY = 1;
  private trail: Array<{ x: number; y: number }> = [];
  private portalCd = 0;
  private lastPortal = false;
  private paused = false;
  private bannerTimer = 0;

  constructor() {
    super("pocket-play");
  }

  create() {
    this.platform = this.game.registry.get("platform") as PlatformSDK;
    const ctx = readRunContext();
    if (ctx.modeIndex !== undefined && Number.isFinite(ctx.modeIndex)) {
      this.layoutIndex = Math.abs(ctx.modeIndex) % LAYOUTS.length;
    } else if (ctx.seed) {
      this.layoutIndex = Math.abs([...ctx.seed].reduce((h, c) => h + c.charCodeAt(0), 0)) % LAYOUTS.length;
    } else {
      this.layoutIndex = Math.abs(Number(this.game.registry.get("layoutIndex") ?? 0)) % LAYOUTS.length;
    }
    this.layout = LAYOUTS[this.layoutIndex];
    this.table = this.layout;
    this.bx = this.layout.ball.x;
    this.by = this.layout.ball.y;
    this.vx = this.vy = 0;
    this.spinPhase = 0;
    this.spinAngle = 0;
    this.strokes = 0;
    this.banked = false;
    this.wallThisShot = false;
    this.ended = false;
    this.bannerTimer = 0;
    this.lastPower = 0;
    this.bumperShockwaves = [];
    this.parts = new ParticlePool(120);
    this.synth = (this.game.registry.get("synth") as Synth | undefined) ?? new Synth();
    this.game.registry.set("synth", this.synth);
    this.synth.setSettings(this.platform.audio.getSettings());
    this.gfx = this.add.graphics();
    this.overlay = this.add.graphics().setScrollFactor(0).setDepth(20);
    this.hud = this.add
      .text(18, 62, "DRAG → RELEASE", {
        fontFamily: "ui-sans-serif, system-ui",
        fontSize: "15px",
        fontStyle: "800",
        color: "#fff8ec",
        stroke: "#1c1208",
        strokeThickness: 4,
      })
      .setScrollFactor(0)
      .setDepth(21);
    this.bannerLabel = this.add
      .text(this.scale.width * 0.5, this.scale.height * 0.42, "", {
        fontFamily: "ui-sans-serif, system-ui",
        fontSize: "30px",
        fontStyle: "900",
        color: "#ffe066",
        stroke: "#1a1008",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(25)
      .setVisible(false);
    this.powerLabel = this.add
      .text(this.scale.width - 14, 108, "POWER 0%", {
        fontFamily: "ui-sans-serif, system-ui",
        fontSize: "11px",
        fontStyle: "900",
        color: "#ffe066",
        stroke: "#140e0a",
        strokeThickness: 3,
      })
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(22);
    this.trail = [];
    this.native?.destroy();
    this.native = createGameKeyboard();
    this.game.canvas.tabIndex = 0;
    this.game.canvas.focus({ preventScroll: true });
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (this.ended) {
        this.scene.restart();
        return;
      }
      if (Math.hypot(this.vx, this.vy) > 12) return;
      this.aiming = true;
      this.ax = p.x / this.scaleX;
      this.ay = p.y / this.scaleY;
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!this.aiming) return;
      this.ax = p.x / this.scaleX;
      this.ay = p.y / this.scaleY;
    });
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (!this.aiming) return;
      this.ax = p.x / this.scaleX;
      this.ay = p.y / this.scaleY;
      this.shoot();
    });
    this.game.events.on("platform-pause", () => (this.paused = true));
    this.game.events.on("platform-resume", () => (this.paused = false));
    this.platform.session.start();
    this.started = this.time.now;
    this.platform.events.emit({ name: "gameplay_started", props: { gameId: "pocket-striker" } });
  }

  private shoot() {
    this.aiming = false;
    const dx = this.bx - this.ax;
    const dy = this.by - this.ay;
    const len = Math.hypot(dx, dy);
    if (len < 8) return;
    const power = Math.min(1, len / 160);
    this.lastPower = power;
    this.vx = (dx / len) * power * 620;
    this.vy = (dy / len) * power * 620;
    this.strokes += 1;
    this.wallThisShot = false;
    this.juice.cameraPunch(0.2 + power * 0.25);
    this.synth.tone(180 + power * 80, 0.06, "triangle", 0.05, 0.16);
    this.parts.burst(this.bx, this.by, 7, 0xffe08a, 40, 150);
    pulseHaptic(6);
  }

  update(_: number, delta: number) {
    const dt = Math.min(0.033, delta / 1000);
    this.ticks += 1;
    this.longFrames = countLongFrame(delta, this.longFrames);
    if (!this.signaledReady) {
      this.signaledReady = true;
      this.platform.events.emit({ name: "game_ready", props: { gameId: "pocket-striker" } });
    }
    this.scaleX = this.scale.width / this.layout.w;
    this.scaleY = this.scale.height / this.layout.h;
    const native = this.native?.read();
    if (native?.retryPressed) this.scene.restart();
    if (this.paused) {
      this.draw();
      this.publishDebug();
      return;
    }
    if (this.bannerTimer > 0) {
      this.bannerTimer = Math.max(0, this.bannerTimer - dt);
    }
    for (let i = this.bumperShockwaves.length - 1; i >= 0; i -= 1) {
      this.bumperShockwaves[i].t += dt * 3.2;
      if (this.bumperShockwaves[i].t >= 1) this.bumperShockwaves.splice(i, 1);
    }
    if (!this.ended) {
      const res = stepBall({ x: this.bx, y: this.by, vx: this.vx, vy: this.vy, portalCd: this.portalCd }, this.layout, dt);
      if (res.wallHit) {
        this.wallThisShot = true;
        this.synth.tone(520, 0.03, "square", 0.02, 0.08);
        this.parts.burst(res.x, res.y, 7, 0x7dffc3, 55, 190);
      }
      if (res.bumperHit) {
        this.juice.cameraPunch(0.45);
        this.synth.tone(680, 0.04, "triangle", 0.03, 0.1);
        this.parts.burst(res.x, res.y, 9, 0xffd166, 70, 210);
        let hitBumper = (this.layout.bumpers ?? [])[0];
        let bestDist = Infinity;
        for (const b of this.layout.bumpers ?? []) {
          const d = Math.hypot(res.x - b.x, res.y - b.y);
          if (d < bestDist) {
            bestDist = d;
            hitBumper = b;
          }
        }
        if (hitBumper) {
          this.bumperShockwaves.push({ x: hitBumper.x, y: hitBumper.y, r: hitBumper.r, t: 0 });
        } else {
          this.bumperShockwaves.push({ x: res.x, y: res.y, r: 18, t: 0 });
        }
      }
      if (res.portalCd > this.portalCd) {
        this.synth.tone(720, 0.05, "sine", 0.04, 0.08);
        this.parts.burst(this.bx, this.by, 8, 0x7dffc3, 70, 220);
        this.lastPortal = true;
      }
      if ((res.broke ?? 0) > 0) {
        this.synth.impact(0.45);
        this.parts.burst(res.x, res.y, 10, 0xffc18a, 80, 240);
      }
      this.bx = res.x;
      this.by = res.y;
      this.vx = res.vx;
      this.vy = res.vy;
      this.portalCd = res.portalCd;
      const spd = Math.hypot(this.vx, this.vy);
      if (spd > 4) {
        this.spinPhase += spd * dt * 0.12;
        this.spinAngle = Math.atan2(this.vy, this.vx);
      }
      if (spd > 20 && this.ticks % 2 === 0) {
        this.trail.push({ x: this.bx, y: this.by });
        if (this.trail.length > 18) this.trail.shift();
      }
      if (spd < 8) {
        this.vx = 0;
        this.vy = 0;
        this.trail = [];
      }
      const hole = this.layout.hole;
      const dist = Math.hypot(this.bx - hole.x, this.by - hole.y);
      const speed = Math.hypot(this.vx, this.vy);
      if (dist < hole.r && speed < 90) this.sink(true);
      if (this.strokes >= 12 && speed < 8) this.sink(false);
    }
    this.parts.update(dt);
    this.draw();
    this.publishDebug();
  }

  private drawFurniture(g: Phaser.GameObjects.Graphics, theme: Layout["theme"]) {
    g.fillStyle(0xf0c060, 0.2);
    g.fillCircle(72, 18, 40);
    g.fillStyle(0x6a4a28, 1);
    g.fillRect(68, 2, 7, 22);
    g.fillStyle(0xffe08a, 0.95);
    g.fillCircle(71, 4, 9);
    g.fillStyle(0x2a1c12, 1);
    g.fillRoundedRect(this.layout.w - 118, 6, 96, 28, 4);
    g.fillStyle(theme === "arcade" ? 0xff6ad5 : 0xffd166, 1);
    g.fillRect(this.layout.w - 112, 10, 20, 8);
    g.fillStyle(0xf2e6d0, 1);
    g.fillRoundedRect(this.layout.w - 88, 12, 58, 16, 3);
    const cards = [
      { x: 18, y: 8, rot: -0.18, face: 0xf4ece0, pip: 0xc45c3a },
      { x: 30, y: 10, rot: 0.08, face: 0xf4ece0, pip: 0x2a4a88 },
      { x: 42, y: 7, rot: 0.22, face: 0xf4ece0, pip: 0xc45c3a },
    ];
    for (const card of cards) {
      g.save();
      g.translateCanvas(card.x, card.y);
      g.rotateCanvas(card.rot);
      g.fillStyle(card.face, 1);
      g.fillRoundedRect(0, 0, 16, 22, 2);
      g.fillStyle(card.pip, 1);
      g.fillCircle(8, 11, 3);
      g.restore();
    }
    if (theme === "workshop") {
      g.fillStyle(0x8a6a40, 0.8);
      g.fillRect(120, 6, 54, 12);
      g.fillRect(560, 6, 54, 12);
      g.fillStyle(0xc4a070, 1);
      g.fillRect(126, 8, 16, 6);
    } else if (theme === "garden") {
      g.fillStyle(0x3a7a44, 0.8);
      g.fillCircle(110, 14, 10);
      g.fillCircle(610, 14, 9);
      g.fillStyle(0x8a4a28, 1);
      g.fillRect(107, 16, 6, 8);
    } else {
      g.fillStyle(0xff6ad5, 0.35);
      g.fillRect(120, 8, 64, 6);
      g.fillStyle(0x3a6a88, 0.35);
      g.fillRect(540, 8, 64, 6);
    }
  }

  /**
   * Raycast the aim vector up to the first wall or bumper collision, and compute
   * the reflected post-bounce trajectory segment for bank-shot lining up.
   */
  private computeBankPreview(): {
    hitX: number;
    hitY: number;
    bounced: boolean;
    postPts: Array<{ x: number; y: number }>;
  } | null {
    const dx = this.bx - this.ax;
    const dy = this.by - this.ay;
    const len = Math.hypot(dx, dy);
    if (len < 8) return null;
    const power = Math.min(1, len / 160);
    let vx = (dx / len) * power * 620;
    let vy = (dy / len) * power * 620;
    let x = this.bx;
    let y = this.by;
    const dt = 0.008;
    const maxPreSteps = Math.round(65 + power * 95);
    let bounced = false;
    let hitX = x;
    let hitY = y;

    for (let i = 0; i < maxPreSteps; i += 1) {
      x += vx * dt;
      y += vy * dt;
      vx *= Math.pow(0.985, dt * 60);
      vy *= Math.pow(0.985, dt * 60);

      for (const w of this.layout.walls) {
        const nx = Math.max(w.x, Math.min(x, w.x + w.w));
        const ny = Math.max(w.y, Math.min(y, w.y + w.h));
        const cdx = x - nx;
        const cdy = y - ny;
        if (cdx * cdx + cdy * cdy <= 11.5 * 11.5) {
          hitX = x;
          hitY = y;
          if (Math.abs(cdx) > Math.abs(cdy)) vx *= -0.78;
          else vy *= -0.78;
          bounced = true;
          break;
        }
      }
      if (bounced) break;

      for (const b of this.layout.bumpers ?? []) {
        const bdx = x - b.x;
        const bdy = y - b.y;
        const d = Math.hypot(bdx, bdy);
        if (d <= b.r + 11 && d > 0.1) {
          hitX = x;
          hitY = y;
          const nx = bdx / d;
          const ny = bdy / d;
          const vn = vx * nx + vy * ny;
          if (vn < 0) {
            vx -= 2.0 * vn * nx;
            vy -= 2.0 * vn * ny;
          }
          bounced = true;
          break;
        }
      }
      if (bounced) break;
      hitX = x;
      hitY = y;
    }

    const postPts: Array<{ x: number; y: number }> = [];
    if (bounced) {
      let px = hitX;
      let py = hitY;
      let pvx = vx;
      let pvy = vy;
      const postStep = 0.02;
      for (let j = 0; j < 14; j += 1) {
        px += pvx * postStep;
        py += pvy * postStep;
        pvx *= Math.pow(0.985, postStep * 60);
        pvy *= Math.pow(0.985, postStep * 60);
        postPts.push({ x: px, y: py });
      }
    }

    return { hitX, hitY, bounced, postPts };
  }

  private getCalloutTitle(ok: boolean) {
    if (!ok) return "OUT OF STROKES";
    if (this.strokes === 1) return "HOLE IN ONE!";
    const diff = this.strokes - this.layout.par;
    if (diff <= -2) return `EAGLE · ${diff}`;
    if (diff === -1) return "BIRDIE · -1";
    if (diff === 0) return "PAR";
    return `BOGEY · +${diff}`;
  }

  private sink(ok = true) {
    if (this.ended) return;
    this.ended = true;
    const strokesUsed = Math.max(1, this.strokes);
    if (ok) {
      this.synth.finishSting();
      this.juice.flash(0.28);
      this.juice.cameraPunch(0.6);
      void this.platform.achievement.unlock("first-pocket");
      if (this.strokes === 1) void this.platform.achievement.unlock("perfect");
      if (this.wallThisShot) {
        this.banked = true;
        void this.platform.achievement.unlock("bank");
      }
      if (this.strokes <= this.layout.par) void this.platform.achievement.unlock("par-table");
      this.parts.burst(this.layout.hole.x, this.layout.hole.y, 24, 0xffe066, 90, 320);
      this.parts.burst(this.layout.hole.x, this.layout.hole.y, 16, 0x7dffc3, 70, 260);
      try {
        const pbKey = `gw:pocket-pb:${this.layout.id}`;
        const prev = Number(localStorage.getItem(pbKey) ?? 0);
        if (!prev || strokesUsed < prev) {
          localStorage.setItem(pbKey, String(strokesUsed));
        }
      } catch {
        /* noop */
      }
    } else {
      this.synth.crash(0.4);
    }
    const callout = this.getCalloutTitle(ok);
    this.bannerLabel
      .setText(this.banked && ok ? `${callout} · BANK SHOT!` : callout)
      .setColor(ok ? "#ffe066" : "#ff6b8a")
      .setPosition(this.scale.width * 0.5, this.scale.height * 0.42)
      .setVisible(this.hud.visible);
    this.bannerTimer = 2.0;

    void this.platform.session.end({
      mode: readRunContext().daily ? "daily" : "layout",
      score: strokesUsed,
      result: ok ? "finish" : "death",
      metadata: {
        lowerIsBetter: true,
        strokes: strokesUsed,
        table: this.table.id,
        layout: this.layout.id,
        par: this.table.par,
        banked: this.banked,
        bank: this.banked,
        failed: !ok,
        result: ok ? "finish" : "death",
        perfect: ok && this.strokes === 1,
        attemptDurationMs: Math.round(this.time.now - this.started),
        retryHint: `${this.layout.name} · ${strokesUsed} vs par ${this.layout.par}`,
      },
    });
  }

  private drawDiamondSight(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number, color: number) {
    g.fillStyle(color, 0.92);
    g.beginPath();
    g.moveTo(cx, cy - r);
    g.lineTo(cx + r, cy);
    g.lineTo(cx, cy + r);
    g.lineTo(cx - r, cy);
    g.closePath();
    g.fillPath();
  }

  private getSegmentColor(segIdx: number): number {
    if (segIdx <= 3) return 0x34d399;
    if (segIdx <= 6) return 0xffe066;
    if (segIdx === 7) return 0xf97316;
    return 0xef4444;
  }

  private drawPowerMeter(power: number, brass: number) {
    const o = this.overlay;
    const meterW = 22;
    const meterH = Math.min(176, Math.max(110, this.scale.height * 0.42));
    const meterX = this.scale.width - meterW - 16;
    const meterY = Math.max(68, (this.scale.height - meterH) * 0.52);

    // Outer gauge housing
    o.fillStyle(0x140e0a, 0.86);
    o.fillRoundedRect(meterX, meterY, meterW, meterH, 8);
    o.lineStyle(1.8, this.aiming ? 0xffe066 : brass, 0.9);
    o.strokeRoundedRect(meterX, meterY, meterW, meterH, 8);

    const padX = 4;
    const padY = 6;
    const innerW = meterW - padX * 2;
    const innerH = meterH - padY * 2;
    const gap = 2.5;
    const segH = (innerH - gap * 9) / 10;

    // 10 graduated segments from bottom (0) to top (9)
    for (let s = 0; s < 10; s += 1) {
      const sy = meterY + meterH - padY - (s + 1) * segH - s * gap;
      const segThreshold = s / 10;
      const col = this.getSegmentColor(s);
      const active = power > segThreshold + 0.01;
      const partial = Math.max(0, Math.min(1, (power - segThreshold) * 10));
      o.fillStyle(col, active ? 0.25 + partial * 0.72 : 0.14);
      o.fillRoundedRect(meterX + padX, sy, innerW, segH, 2);
      // Graduation tick on left edge
      o.fillStyle(0xffffff, s % 5 === 4 ? 0.65 : 0.28);
      o.fillRect(meterX - 3, sy + segH * 0.5 - 0.5, 3, 1.2);
    }

    // Power marker chevron on the left edge of the gauge
    const markerY = meterY + meterH - padY - power * innerH;
    const activeCol = this.getSegmentColor(Math.min(9, Math.floor(power * 9.99)));
    o.fillStyle(activeCol, 0.98);
    o.fillTriangle(meterX - 7, markerY - 4.5, meterX - 7, markerY + 4.5, meterX - 1, markerY);

    const pct = Math.round(power * 100);
    const hexCol = pct >= 80 ? "#ef4444" : pct >= 45 ? "#ffe066" : "#34d399";
    this.powerLabel
      .setText(`POWER ${pct}%`)
      .setColor(this.aiming || pct > 0 ? hexCol : "#e2e8f0")
      .setPosition(meterX + meterW, meterY - 6)
      .setVisible(this.hud.visible);
  }

  private draw() {
    const g = this.gfx;
    g.clear();
    const t = this.time.now / 1000;
    const theme = this.layout.theme ?? "garden";
    const felt = theme === "workshop" ? 0x1e6b52 : theme === "arcade" ? 0x162a4a : 0x1b6e44;
    const feltHighlight = theme === "workshop" ? 0x268265 : theme === "arcade" ? 0x1f3b66 : 0x238653;
    const rail = theme === "workshop" ? 0x5c3418 : theme === "arcade" ? 0x28183e : 0x4e2c16;
    const cushion = theme === "workshop" ? 0x144d3a : theme === "arcade" ? 0x2c4c7e : 0x135232;
    const brass = theme === "arcade" ? 0x38bdf8 : 0xeab308;

    fillBackdrop(g, this.scale.width, this.scale.height, {
      top: 0x1c1410,
      mid: 0x261b14,
      bottom: 0x120c08,
      grain: 0.03,
      blobs: [{ color: 0xffe08a, x: 0.18, y: 0.12, r: 90, alpha: 0.14 }],
    });
    const camOff = this.juice.applyCamera({ x: 0, y: 0 }, this.time.now);
    g.save();
    g.scaleCanvas(this.scaleX, this.scaleY);
    g.translateCanvas(camOff.x, camOff.y);

    // Outer table cabinet & mahogany/anodized-neon frame
    g.fillStyle(0x0d0806, 0.65);
    g.fillRoundedRect(4, 6, this.layout.w - 4, this.layout.h - 4, 26);
    g.fillStyle(0x361e0f, 1);
    g.fillRoundedRect(0, 0, this.layout.w, this.layout.h, 24);
    g.fillStyle(rail, 1);
    g.fillRoundedRect(5, 5, this.layout.w - 10, this.layout.h - 10, 20);

    // Anodized / brass trim border along rails
    g.lineStyle(2, brass, theme === "arcade" ? 0.65 : 0.45);
    g.strokeRoundedRect(6, 6, this.layout.w - 12, this.layout.h - 12, 19);

    // Cushion bevel & rich woven baize felt
    g.fillStyle(cushion, 1);
    g.fillRoundedRect(16, 16, this.layout.w - 32, this.layout.h - 32, 14);
    g.fillStyle(felt, 1);
    g.fillRoundedRect(24, 24, this.layout.w - 48, this.layout.h - 48, 10);

    // Subtle woven baize felt crosshatch & center table spotlight
    g.fillStyle(feltHighlight, 0.35);
    g.fillEllipse(this.layout.w * 0.5, this.layout.h * 0.5, this.layout.w * 0.66, this.layout.h * 0.58);
    g.lineStyle(1, 0xffffff, 0.04);
    for (let x = 48; x < this.layout.w - 32; x += 24) {
      g.lineBetween(x, 24, x, this.layout.h - 24);
    }
    for (let y = 48; y < this.layout.h - 32; y += 24) {
      g.lineBetween(24, y, this.layout.w - 24, y);
    }
    // Baize head-string & center spot markings
    g.lineStyle(1.5, 0xffffff, 0.14);
    g.lineBetween(160, 26, 160, this.layout.h - 26);
    g.strokeCircle(this.layout.w * 0.5, this.layout.h * 0.5, 36);

    // Brass / Neon Corner & Side Plates
    const cornerPlates = [
      [18, 18],
      [this.layout.w - 18, 18],
      [18, this.layout.h - 18],
      [this.layout.w - 18, this.layout.h - 18],
      [this.layout.w / 2, 14],
      [this.layout.w / 2, this.layout.h - 14],
    ];
    for (const [px, py] of cornerPlates) {
      g.fillStyle(brass, 0.88);
      g.fillCircle(px, py, 15);
      g.fillStyle(0x0c0908, 1);
      g.fillCircle(px, py, 11.5);
      g.fillStyle(0xffffff, 0.22);
      g.fillCircle(px - 3, py - 3, 3.5);
    }

    this.drawFurniture(g, theme);

    // Diamond sight-markers along the cushion rails
    const sightColor = theme === "arcade" ? 0xf472b6 : 0xfef08a;
    for (let i = 1; i <= 7; i += 1) {
      if (i === 4) continue;
      const sx = i * (this.layout.w / 8);
      this.drawDiamondSight(g, sx, 11, 3.2, sightColor);
      this.drawDiamondSight(g, sx, this.layout.h - 11, 3.2, sightColor);
    }
    for (let i = 1; i <= 3; i += 1) {
      const sy = i * (this.layout.h / 4);
      this.drawDiamondSight(g, 11, sy, 3.2, sightColor);
      this.drawDiamondSight(g, this.layout.w - 11, sy, 3.2, sightColor);
    }

    // Interior cushion walls with 3D shadow and neon/brass bumper strips
    for (const w of this.layout.walls) {
      if (w.x === 0 || w.y === 0 || w.w >= this.layout.w - 2 || w.h >= this.layout.h - 2) continue;
      g.fillStyle(0x000000, 0.28);
      g.fillRoundedRect(w.x + 3, w.y + 4, w.w, w.h, 6);
      g.fillStyle(rail, 1);
      g.fillRoundedRect(w.x, w.y, w.w, w.h, 6);
      g.lineStyle(2, brass, 0.78);
      g.strokeRoundedRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2, 5);
      g.fillStyle(0xffffff, 0.2);
      g.fillRect(w.x + 4, w.y + 2, Math.max(4, w.w - 8), 3);
    }

    // Target Pocket with Spinning Gravity Vortex
    const hole = this.layout.hole;
    const pulse = 0.7 + Math.sin(t * 5) * 0.25;
    g.fillStyle(0x34d399, 0.18 * pulse);
    g.fillCircle(hole.x, hole.y, hole.r + 12);
    g.fillStyle(brass, 0.92);
    g.fillCircle(hole.x, hole.y, hole.r + 5);
    g.fillStyle(0x050b09, 1);
    g.fillCircle(hole.x, hole.y, hole.r + 1);
    // Spinning vortex rings & spokes inside target pocket
    g.save();
    g.translateCanvas(hole.x, hole.y);
    g.rotateCanvas(t * 2.8);
    g.lineStyle(2, 0x34d399, 0.65);
    for (let s = 0; s < 4; s += 1) {
      const a = (s * Math.PI) / 2;
      g.beginPath();
      g.arc(0, 0, hole.r * 0.68, a, a + 0.9);
      g.strokePath();
    }
    g.rotateCanvas(-t * 4.6);
    g.lineStyle(1.8, 0xffe066, 0.72);
    for (let s = 0; s < 3; s += 1) {
      const a = (s * Math.PI * 2) / 3;
      g.beginPath();
      g.arc(0, 0, hole.r * 0.38, a, a + 1.0);
      g.strokePath();
    }
    g.restore();
    g.fillStyle(0xffffff, 0.25);
    g.fillCircle(hole.x - 3, hole.y - 3, hole.r * 0.24);

    // Ball motion trail
    for (let i = 0; i < this.trail.length; i += 1) {
      const p = this.trail[i];
      const u = (i + 1) / this.trail.length;
      g.fillStyle(0x7dffc3, 0.08 + u * 0.28);
      g.fillCircle(p.x, p.y, 3.5 + u * 4.5);
    }

    // Reflective Bank-Shot Aim Preview, Pool Cue & Ghost Ball
    let aimPower = 0;
    if (this.aiming) {
      const dx = this.bx - this.ax;
      const dy = this.by - this.ay;
      const len = Math.hypot(dx, dy);
      const power = Math.min(1, len / 160);
      aimPower = power;
      const powerCol = power >= 0.8 ? 0xef4444 : power >= 0.45 ? 0xffe066 : 0x34d399;

      // Pull-back power handle & graduated impulse ticks
      g.lineStyle(2, 0xffe066, 0.45);
      g.lineBetween(this.bx, this.by, this.ax, this.ay);
      g.fillStyle(powerCol, 0.92);
      g.fillCircle(this.ax, this.ay, 4 + power * 4);

      if (len >= 6) {
        const ux = dx / len;
        const uy = dy / len;
        const pullGap = BALL_R + 6 + power * 28;
        // Dynamic pool cue stick behind the ball along the shot axis
        g.save();
        g.translateCanvas(this.bx, this.by);
        g.rotateCanvas(Math.atan2(-uy, -ux));
        // Graduated impulse ticks between ball and cue tip
        for (let ti = 1; ti <= 4; ti += 1) {
          const tx = BALL_R + 3 + (ti / 5) * (pullGap - BALL_R - 3);
          g.fillStyle(powerCol, 0.75);
          g.fillRect(tx, -2.5, 2, 5);
        }
        // Chalk tip + white ferrule + maple shaft + ornate grip butt
        g.fillStyle(0x38bdf8, 0.98);
        g.fillRoundedRect(pullGap, -2.4, 4, 4.8, 1.5);
        g.fillStyle(0xf8fafc, 0.98);
        g.fillRect(pullGap + 4, -2.5, 5, 5);
        g.fillStyle(0xfde68a, 0.96);
        g.fillRoundedRect(pullGap + 9, -2.8, 56, 5.6, 2);
        g.fillStyle(0x1e293b, 0.96);
        g.fillRoundedRect(pullGap + 65, -3.5, 42, 7, 3);
        g.fillStyle(0xffe066, 0.95);
        g.fillRect(pullGap + 67, -3.5, 3, 7);
        g.fillRect(pullGap + 104, -3.5, 3, 7);
        g.restore();

        // Forward impulse arrow chevron ahead of cue ball
        const tipX = this.bx + ux * (BALL_R + 14 + power * 10);
        const tipY = this.by + uy * (BALL_R + 14 + power * 10);
        const px = -uy;
        const py = ux;
        g.fillStyle(powerCol, 0.9);
        g.fillTriangle(
          tipX,
          tipY,
          tipX - ux * 8 + px * 5,
          tipY - uy * 8 + py * 5,
          tipX - ux * 8 - px * 5,
          tipY - uy * 8 - py * 5,
        );
      }

      const bank = this.computeBankPreview();
      if (bank) {
        // Primary raycast aim line up to first wall/obstacle
        g.lineStyle(2.8, 0xffffff, 0.55 + power * 0.35);
        g.lineBetween(this.bx, this.by, bank.hitX, bank.hitY);
        // Translucent Ghost Ball (radius BALL_R = 11px) with cyan #38bdf8 ring at exact impact point
        g.fillStyle(0xffffff, 0.24);
        g.fillCircle(bank.hitX, bank.hitY, BALL_R);
        g.fillStyle(0xffffff, 0.48);
        g.fillCircle(bank.hitX - 3, bank.hitY - 3, 3);
        g.lineStyle(2.2, 0x38bdf8, 0.95);
        g.strokeCircle(bank.hitX, bank.hitY, BALL_R);
        g.fillStyle(0x38bdf8, 0.92);
        g.fillCircle(bank.hitX, bank.hitY, 2.4);
        // Reflected post-bounce dotted neon trajectory segment
        for (let i = 0; i < bank.postPts.length; i += 1) {
          const pt = bank.postPts[i];
          const fade = 1 - i / bank.postPts.length;
          g.fillStyle(0x38bdf8, 0.25 + fade * 0.65);
          g.fillCircle(pt.x, pt.y, 2.8);
        }
      }
    }

    // Golden shockwave rings on bumper hits
    for (const sw of this.bumperShockwaves) {
      const alpha = Math.max(0, 1 - sw.t);
      const radius = sw.r + sw.t * 26;
      g.lineStyle(3 * (1 - sw.t * 0.5), 0xffe066, alpha * 0.9);
      g.strokeCircle(sw.x, sw.y, radius);
      g.lineStyle(1.5, 0xffffff, alpha * 0.55);
      g.strokeCircle(sw.x, sw.y, Math.max(2, radius - 4));
    }

    for (const b of this.layout.bumpers ?? []) {
      const bCol = theme === "arcade" ? 0xff6ad5 : theme === "workshop" ? 0xf59e0b : 0x34d399;
      g.fillStyle(0x000000, 0.28);
      g.fillCircle(b.x + 2, b.y + 3, b.r + 1);
      g.fillStyle(bCol, 1);
      g.fillCircle(b.x, b.y, b.r);
      g.lineStyle(2.5, 0xffffff, 0.65);
      g.strokeCircle(b.x, b.y, b.r - 3);
      g.fillStyle(0xffffff, 0.45);
      g.fillCircle(b.x - 4, b.y - 4, 5);
    }
    for (const m of this.layout.movingBlockers ?? []) {
      // Grooved oscillation track & endpoint pins for moving obstacle readability
      g.lineStyle(2, 0xffffff, 0.22);
      if (m.axis === "x") {
        const cy = m.y + m.h * 0.5;
        g.lineBetween(m.min, cy, m.max + m.w, cy);
        g.fillStyle(brass, 0.7);
        g.fillCircle(m.min, cy, 3);
        g.fillCircle(m.max + m.w, cy, 3);
      } else {
        const cx = m.x + m.w * 0.5;
        g.lineBetween(cx, m.min, cx, m.max + m.h);
        g.fillStyle(brass, 0.7);
        g.fillCircle(cx, m.min, 3);
        g.fillCircle(cx, m.max + m.h, 3);
      }
      g.fillStyle(0x000000, 0.25);
      g.fillRoundedRect(m.x + 2, m.y + 3, m.w, m.h, 5);
      g.fillStyle(theme === "arcade" ? 0x38bdf8 : 0xd97706, 1);
      g.fillRoundedRect(m.x, m.y, m.w, m.h, 5);
      g.fillStyle(0xffffff, 0.32);
      g.fillRect(m.x + 3, m.y + 3, m.w - 6, 3);
    }
    for (const r of this.layout.rotators ?? []) {
      g.save();
      g.translateCanvas(r.x, r.y);
      g.rotateCanvas(r.a);
      g.fillStyle(0x000000, 0.28);
      g.fillRoundedRect(0, -3, r.len, 10, 4);
      g.fillStyle(0xe2e8f0, 1);
      g.fillRoundedRect(0, -5, r.len, 10, 4);
      g.fillStyle(brass, 1);
      g.fillCircle(0, 0, 9);
      g.restore();
    }
    for (const p of this.layout.portals ?? []) {
      g.lineStyle(3, 0x7dffc3, 0.9);
      g.strokeCircle(p.x, p.y, p.r + 4);
      g.fillStyle(0x1a3a34, 0.85);
      g.fillCircle(p.x, p.y, p.r);
      g.fillStyle(0x7dffc3, 0.35 + Math.sin(this.time.now / 120) * 0.15);
      g.fillCircle(p.x, p.y, p.r * 0.55);
    }
    for (const p of this.layout.forcePads ?? []) {
      g.fillStyle(0xffe08a, 0.55);
      g.fillRoundedRect(p.x, p.y, p.w, p.h, 4);
      g.fillStyle(0xffffff, 0.7);
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;
      g.fillTriangle(cx + Math.sign(p.ax) * 10, cy + Math.sign(p.ay) * 10, cx - 6, cy - 6, cx - 6, cy + 6);
    }
    for (const b of this.layout.breakables ?? []) {
      if (b.hp <= 0) continue;
      g.fillStyle(0xc4a070, 0.95);
      g.fillRoundedRect(b.x, b.y, b.w, b.h, 3);
      g.fillStyle(0x000000, 0.2);
      g.fillRect(b.x + 4, b.y + 4, b.w - 8, 3);
    }
    for (const gate of this.layout.gates ?? []) {
      if (gate.open) {
        g.fillStyle(0x7dffc3, 0.18);
        g.fillRect(gate.x, gate.y, gate.w, gate.h);
      } else {
        g.fillStyle(0xff6a6a, 0.9);
        g.fillRect(gate.x, gate.y, gate.w, gate.h);
      }
    }

    // Cue Ball Drop Shadow, Specular Roll Highlight & Spin Stripe
    g.fillStyle(0x000000, 0.36);
    g.fillEllipse(this.bx + 3.5, this.by + 4.5, 22, 18);
    drawShinyBall(g, this.bx, this.by, 11, theme === "arcade" ? 0xfdf4ff : 0xfefce8, this.spinPhase);
    // Rolling spin dot / equator indicator
    const rollOff = Math.sin(this.spinPhase) * 5.2;
    const rx = this.bx + Math.cos(this.spinAngle) * rollOff;
    const ry = this.by + Math.sin(this.spinAngle) * rollOff;
    g.fillStyle(0xef4444, 0.85);
    g.fillCircle(rx, ry, 2.2);
    g.fillStyle(0xffffff, 0.88);
    g.fillCircle(this.bx - 3.5, this.by - 3.8, 3.2);

    drawParticles(g, this.parts);
    g.restore();

    const bankTag = this.wallThisShot || this.banked ? "  ·  BANK ACTIVE" : "";
    this.hud.setText(
      `TABLE  ${this.layout.name.toUpperCase()}\nSTROKES ${this.strokes}/12  ·  PAR ${this.layout.par}${bankTag}`,
    );
    this.overlay.clear();
    if (this.hud.visible) {
      this.overlay.fillStyle(0x140e0a, 0.78);
      this.overlay.fillRoundedRect(10, 54, 300, 50, 10);
      this.overlay.lineStyle(1.5, brass, 0.8);
      this.overlay.strokeRoundedRect(10, 54, 300, 50, 10);
      const displayPower = this.aiming ? aimPower : Math.hypot(this.vx, this.vy) > 8 ? this.lastPower : 0;
      this.drawPowerMeter(displayPower, brass);
    } else {
      this.powerLabel.setVisible(false);
    }
    const fa = this.juice.flashAlpha(0.016);
    if (fa > 0) {
      this.overlay.fillStyle(0xffffff, fa);
      this.overlay.fillRect(0, 0, this.scale.width, this.scale.height);
    }
    this.bannerLabel.setVisible(this.hud.visible && this.bannerTimer > 0);
  }

  private publishDebug() {
    publishGwDebug(
      {
        gameId: "pocket-striker",
        ready: this.signaledReady,
        runState: this.ended ? "ended" : "playing",
        playerX: this.bx,
        playerY: this.by,
        score: this.strokes,
        paused: this.paused,
        fps: this.game.loop.actualFps,
        longFrames: this.longFrames,
        tick: this.ticks,
        frozen: false,
        contentId: this.layout.id,
      },
      {
        finishRun: () => this.sink(true),
        seedPeak: () => {
          this.aiming = true;
          this.ax = this.bx - 96;
          this.ay = this.by + 78;
          this.wallThisShot = true;
          this.banked = true;
          this.bumperShockwaves.push({ x: this.layout.hole.x - 110, y: this.layout.hole.y + 30, r: 16, t: 0.28 });
          this.draw();
        },
        hideHud: () => {
          this.hud.setVisible(false);
          this.bannerLabel.setVisible(false);
          this.powerLabel.setVisible(false);
        },
      },
    );
  }

  shutdown() {
    this.native?.destroy();
    this.bannerLabel?.destroy();
    this.powerLabel?.destroy();
    clearGwDebug();
  }
}

export function mountPocketStriker(parent: HTMLElement, platform: PlatformSDK, layoutIndex = 0) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: Math.max(320, parent.clientWidth || 720),
    height: Math.max(240, parent.clientHeight || 480),
    backgroundColor: "#e8d4b0",
    scale: { mode: Phaser.Scale.RESIZE },
    scene: [PocketScene],
    disableContextMenu: true,
    banner: false,
    autoFocus: true,
    input: { keyboard: { target: typeof window !== "undefined" ? window : undefined }, activePointers: 3 },
    fps: { target: 60 },
    render: { preserveDrawingBuffer: true },
  });
  game.registry.set("platform", platform);
  game.registry.set("layoutIndex", layoutIndex);
  game.registry.set("manifest", pocketStrikerManifest);
  (game as Phaser.Game & { restartRun: () => void }).restartRun = () => {
    game.scene.getScene("pocket-play")?.scene.restart();
  };
  game.events.once("destroy", () => {
    (game.registry.get("synth") as Synth | undefined)?.dispose();
    clearGwDebug();
  });
  return game;
}
