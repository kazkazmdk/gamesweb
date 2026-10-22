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
  seededRng,
  fillBackdrop,
  fillVignette,
  mixColor,
  drawParticles,
  clamp,
  type GameKeyboard,
} from "@gamesweb/game-core";
import { prismDropManifest, readRunContext, type PlatformSDK } from "@gamesweb/game-sdk";
import {
  DANGER_Y,
  TIERS,
  WELL_H,
  WELL_W,
  applyPulseTilt,
  buildShowcaseWell,
  stepWell,
  tierColor,
  tierRadius,
  tierValue,
  type MergeEvent,
  type PrismPiece,
} from "../systems/merge";

const FONT = "ui-sans-serif, system-ui, Segoe UI, sans-serif";
const DROP_CD = 0.32;
const TILT_CD = 6;

type WellLayout = {
  w: number;
  h: number;
  scale: number;
  wellX: number;
  wellY: number;
  wellW: number;
  wellH: number;
  panelX: number;
  panelY: number;
  panelW: number;
  panelH: number;
  button: { x: number; y: number; w: number; h: number };
};

type Ring = { x: number; y: number; life: number; max: number; color: number };
type Popup = { x: number; y: number; text: string; life: number; max: number; color: string };

function ink(color: number) {
  const r = (color >> 16) & 255;
  const g = (color >> 8) & 255;
  const b = color & 255;
  const y = (r * 299 + g * 587 + b * 114) / 1000;
  return y > 168 ? "#1c1408" : "#f8fbff";
}

function tracePoly(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  sides: number,
  rot: number,
  squash = 1,
) {
  g.beginPath();
  for (let i = 0; i < sides; i += 1) {
    const a = rot + (i / sides) * Math.PI * 2 - Math.PI / sides;
    const px = x + Math.cos(a) * radius;
    const py = y + Math.sin(a) * radius * squash;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.closePath();
}

function drawTechGrid(g: Phaser.GameObjects.Graphics, w: number, h: number) {
  g.lineStyle(1, 0x7dd3fc, 0.04);
  for (let x = 0; x <= w; x += 32) g.lineBetween(x, 0, x, h);
  for (let y = 0; y <= h; y += 32) g.lineBetween(0, y, w, y);
  const hex = (cx: number, cy: number, r: number, alpha: number) => {
    g.lineStyle(1.2, 0x67e8f9, alpha);
    tracePoly(g, cx, cy, r, 6, Math.PI / 6, 1);
    g.strokePath();
  };
  hex(72, 78, 30, 0.14);
  hex(w - 84, 64, 22, 0.1);
  hex(58, h - 72, 18, 0.08);
  hex(w * 0.42, h * 0.16, 46, 0.05);
}

export class PrismDropScene extends Phaser.Scene {
  private platform!: PlatformSDK;
  private juice = new Juice();
  private parts!: ParticlePool;
  private synth!: Synth;
  private gfx!: Phaser.GameObjects.Graphics;
  private overlay!: Phaser.GameObjects.Graphics;
  private nativeKeys: GameKeyboard | null = null;
  private onKey = (e: KeyboardEvent) => {
    if (e.repeat || e.code !== "KeyE") return;
    const target = e.target;
    if (target instanceof HTMLElement) {
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return;
    }
    e.preventDefault();
    this.ePulse = true;
  };
  private rng = Math.random;
  private seed = "local";
  private modeName = "well";
  private overclock = false;
  private pieces: PrismPiece[] = [];
  private ids = { id: 1 };
  private held = 1;
  private nextTier = 1;
  private aimX = WELL_W / 2;
  private tiltDir: -1 | 1 = 1;
  private score = 0;
  private merges = 0;
  private chain = 0;
  private chainMax = 0;
  private chainT = 0;
  private tilts = 0;
  private maxTierSeen = 0;
  private dropCd = 0;
  private tiltCd = 0;
  private overflow = false;
  private ended = false;
  private reported = false;
  private endedAt = 0;
  private paused = false;
  private signaledReady = false;
  private longFrames = 0;
  private ticks = 0;
  private hudHidden = false;
  private showcase = false;
  private bannerText = "";
  private bannerT = 0;
  private rings: Ring[] = [];
  private popups: Popup[] = [];
  private lay!: WellLayout;
  private armDrop = false;
  private suppressDrop = false;
  private prevDown = false;
  private ePulse = false;
  private scoreText!: Phaser.GameObjects.Text;
  private metaText!: Phaser.GameObjects.Text;
  private nextTitle!: Phaser.GameObjects.Text;
  private nextValue!: Phaser.GameObjects.Text;
  private evoTitle!: Phaser.GameObjects.Text;
  private evoCenter!: Phaser.GameObjects.Text;
  private tiltText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;
  private limitText!: Phaser.GameObjects.Text;
  private valueLabels: Phaser.GameObjects.Text[] = [];
  private popupLabels: Phaser.GameObjects.Text[] = [];
  private chrome: Phaser.GameObjects.Text[] = [];

  constructor() {
    super("prism-drop-play");
  }

  create() {
    this.platform = this.game.registry.get("platform") as PlatformSDK;
    const ctx = readRunContext();
    const arg = Number(this.game.registry.get("modeIndex") ?? 0);
    const index = ctx.modeIndex !== undefined ? ctx.modeIndex : arg;
    this.overclock = !ctx.daily && index === 1;
    this.modeName = ctx.daily ? "daily" : "well";
    this.seed = ctx.seed ?? ctx.challengeCode ?? `prism:${Date.now().toString(36)}`;
    this.rng = seededRng(this.seed);
    this.juice = new Juice();
    this.parts = new ParticlePool(180);
    this.synth = (this.game.registry.get("synth") as Synth | undefined) ?? new Synth();
    this.game.registry.set("synth", this.synth);
    this.synth.setSettings(this.platform.audio.getSettings());
    this.cameras.main.setBackgroundColor("#090d16");
    this.resetWell();
    this.gfx = this.add.graphics().setDepth(1);
    this.overlay = this.add.graphics().setScrollFactor(0).setDepth(20);
    this.scoreText = this.makeText(28, "#f8fafc", 0, 0, 24);
    this.metaText = this.makeText(12, "#bae6fd", 0, 0, 24);
    this.nextTitle = this.makeText(11, "#fde68a", 0.5, 0, 24);
    this.nextValue = this.makeText(22, "#f8fbff", 0.5, 0.5, 25);
    this.evoTitle = this.makeText(11, "#a5f3fc", 0.5, 0, 24);
    this.evoCenter = this.makeText(16, "#fef08a", 0.5, 0.5, 25);
    this.tiltText = this.makeText(13, "#fef9c3", 0.5, 0.5, 26);
    this.hintText = this.makeText(10, "#94a3b8", 0.5, 1, 24);
    this.banner = this.makeText(26, "#fef08a", 0.5, 0.5, 30);
    this.limitText = this.makeText(10, "#fecdd3", 0, 0.5, 12);
    this.chrome = [
      this.scoreText,
      this.metaText,
      this.nextTitle,
      this.nextValue,
      this.evoTitle,
      this.evoCenter,
      this.tiltText,
      this.hintText,
      this.banner,
      this.limitText,
    ];
    this.valueLabels = [];
    this.popupLabels = [];
    this.nativeKeys?.destroy();
    this.nativeKeys = createGameKeyboard();
    window.addEventListener("keydown", this.onKey, true);
    this.game.canvas.tabIndex = 0;
    this.game.canvas.focus({ preventScroll: true });
    this.lay = this.computeLayout();
    this.input.addPointer(2);
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => this.onPointerDown(p));
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => this.onPointerMove(p));
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => this.onPointerUp(p));
    const onPause = () => {
      this.paused = true;
    };
    const onResume = () => {
      this.paused = false;
    };
    this.game.events.on("platform-pause", onPause);
    this.game.events.on("platform-resume", onResume);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.nativeKeys?.destroy();
      this.nativeKeys = null;
      window.removeEventListener("keydown", this.onKey, true);
      this.game.events.off("platform-pause", onPause);
      this.game.events.off("platform-resume", onResume);
      clearGwDebug();
    });
    this.platform.session.start();
    this.platform.events.emit({ name: "gameplay_started", props: { gameId: "prism-drop", mode: this.modeName } });
  }

  private makeText(size: number, color: string, originX: number, originY: number, depth: number) {
    return this.add
      .text(0, 0, "", {
        fontFamily: FONT,
        fontSize: `${size}px`,
        fontStyle: "800",
        color,
        stroke: "#070b14",
        strokeThickness: Math.max(3, Math.round(size * 0.16)),
        resolution: 2,
      })
      .setOrigin(originX, originY)
      .setScrollFactor(0)
      .setDepth(depth);
  }

  private resetWell() {
    this.pieces = [];
    this.ids = { id: 1 };
    this.held = this.rollTier();
    this.nextTier = this.rollTier();
    this.aimX = WELL_W / 2;
    this.tiltDir = 1;
    this.score = 0;
    this.merges = 0;
    this.chain = 0;
    this.chainMax = 0;
    this.chainT = 0;
    this.tilts = 0;
    this.maxTierSeen = 0;
    this.dropCd = 0;
    this.tiltCd = 0;
    this.overflow = false;
    this.ended = false;
    this.reported = false;
    this.endedAt = 0;
    this.paused = false;
    this.showcase = false;
    this.bannerText = "";
    this.bannerT = 0;
    this.rings = [];
    this.popups = [];
    this.armDrop = false;
    this.suppressDrop = false;
    this.prevDown = false;
    this.ePulse = false;
    this.hudHidden = false;
  }

  private rollTier() {
    const x = this.rng();
    if (this.overclock) {
      if (x < 0.22) return 1;
      if (x < 0.5) return 2;
      if (x < 0.78) return 3;
      return 4;
    }
    if (x < 0.46) return 1;
    if (x < 0.74) return 2;
    if (x < 0.9) return 3;
    return 4;
  }

  private computeLayout(): WellLayout {
    const w = Math.max(320, this.scale.width || 960);
    const h = Math.max(240, this.scale.height || 640);
    const gutter = w < 720 ? 8 : 16;
    const panelW = Math.min(250, Math.max(w < 720 ? 124 : 186, Math.round(w * (w < 720 ? 0.32 : 0.22))));
    const availW = Math.max(140, w - panelW - gutter * 3);
    const availH = Math.max(180, h - gutter * 2);
    const scale = Math.max(0.4, Math.min(availW / WELL_W, availH / WELL_H));
    const wellW = WELL_W * scale;
    const wellH = WELL_H * scale;
    const wellX = gutter + Math.max(0, (availW - wellW) / 2);
    const wellY = gutter + Math.max(0, (availH - wellH) / 2);
    const panelX = w - gutter - panelW;
    const panelY = gutter;
    const panelH = h - gutter * 2;
    return {
      w,
      h,
      scale,
      wellX,
      wellY,
      wellW,
      wellH,
      panelX,
      panelY,
      panelW,
      panelH,
      button: { x: panelX + 10, y: panelY + panelH - 64, w: panelW - 20, h: 50 },
    };
  }

  private ensureAudio() {
    void this.synth.resume();
  }

  private heldRadius() {
    return tierRadius(this.held);
  }

  private aimFrom(px: number, lay: WellLayout) {
    const r = this.heldRadius();
    this.aimX = clamp((px - lay.wellX) / lay.scale, r, WELL_W - r);
  }

  private hitWell(px: number, py: number, lay: WellLayout) {
    return px >= lay.wellX - 8 && px <= lay.wellX + lay.wellW + 8 && py >= lay.wellY - 36 && py <= lay.wellY + lay.wellH + 8;
  }

  private hitButton(px: number, py: number, lay: WellLayout) {
    const b = lay.button;
    return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;
  }

  private onPointerDown(p: Phaser.Input.Pointer) {
    this.ensureAudio();
    if (this.ended) {
      this.tryRetry();
      return;
    }
    const lay = this.lay ?? this.computeLayout();
    if (this.hitButton(p.x, p.y, lay)) {
      this.triggerTilt();
      this.suppressDrop = true;
      return;
    }
    if (this.hitWell(p.x, p.y, lay)) {
      this.aimFrom(p.x, lay);
      this.armDrop = true;
    }
  }

  private onPointerMove(p: Phaser.Input.Pointer) {
    if (this.ended || this.paused) return;
    const lay = this.lay ?? this.computeLayout();
    if (p.isDown && this.armDrop) this.aimFrom(p.x, lay);
    else if (!p.wasTouch && this.hitWell(p.x, p.y, lay)) this.aimFrom(p.x, lay);
  }

  private onPointerUp(p: Phaser.Input.Pointer) {
    if (this.suppressDrop) {
      this.suppressDrop = false;
      this.armDrop = false;
      return;
    }
    if (this.armDrop && !this.ended && !this.paused) {
      const lay = this.lay ?? this.computeLayout();
      this.aimFrom(p.x, lay);
      this.dropCurrent();
    }
    this.armDrop = false;
  }

  private landingY(x: number, r: number, fromY: number) {
    let y = WELL_H - r;
    for (const p of this.pieces) {
      const dx = x - p.x;
      const reach = r + p.r;
      if (Math.abs(dx) >= reach) continue;
      const dy = Math.sqrt(Math.max(0, reach * reach - dx * dx));
      const hit = p.y - dy;
      if (hit < y) y = hit;
    }
    return Math.max(fromY, Math.min(WELL_H - r, y));
  }

  private dropCurrent(force = false) {
    if (this.ended || this.paused) return;
    if (!force && this.dropCd > 0) return;
    const tier = this.held;
    const r = tierRadius(tier);
    const x = clamp(this.aimX, r, WELL_W - r);
    this.ids.id += 1;
    this.pieces.push({
      id: this.ids.id,
      x,
      y: r + 18,
      vx: 0,
      vy: 72,
      r,
      tier,
      rot: this.rng() * Math.PI * 2,
      vr: (this.rng() - 0.5) * 1.6,
      age: 0,
      flash: 0,
    });
    this.held = this.nextTier;
    this.nextTier = this.rollTier();
    const nr = this.heldRadius();
    this.aimX = clamp(this.aimX, nr, WELL_W - nr);
    this.dropCd = DROP_CD;
    this.showcase = false;
    this.synth.tone(150 + tier * 26, 0.05, "sine", 0.04, 0.07);
    pulseHaptic(6);
  }

  private triggerTilt(dir?: -1 | 1) {
    if (this.ended || this.paused || this.tiltCd > 0 || this.pieces.length === 0) return;
    const d = dir ?? this.tiltDir;
    applyPulseTilt(this.pieces, d);
    this.tiltCd = TILT_CD;
    this.tilts += 1;
    this.showcase = false;
    this.juice.cameraPunch(0.75);
    this.juice.screenShake(5, 180);
    this.synth.noiseBurst(0.14, 0.05, 380);
    this.synth.tone(118, 0.1, "sawtooth", 0.03, 0.12);
    pulseHaptic(14);
  }

  private tryRetry() {
    if (this.ended && this.time.now - this.endedAt < 450) return;
    this.platform.events.emit({
      name: "game_retry",
      props: {
        gameId: "prism-drop",
        time_since_run_end_ms: this.ended ? Math.round(this.time.now - this.endedAt) : 0,
      },
    });
    this.scene.restart();
  }

  private setBanner(text: string, seconds: number) {
    this.bannerText = text;
    this.bannerT = seconds;
  }

  private onMerge(event: MergeEvent, lay: WellLayout) {
    this.merges += 1;
    if (event.chain > this.chainMax) this.chainMax = event.chain;
    this.chain = event.chain;
    this.chainT = 1.35;
    if (event.newTier > this.maxTierSeen) this.maxTierSeen = event.newTier;
    const color = tierColor(event.newTier);
    this.rings.push({ x: event.x, y: event.y, life: 0, max: 0.72 + event.chain * 0.06, color });
    if (this.rings.length > 12) this.rings.shift();
    const sx = lay.wellX + event.x * lay.scale;
    const sy = lay.wellY + event.y * lay.scale;
    this.parts.burst(sx, sy, 10 + event.newTier * 2, color, 70 + event.chain * 18, 440);
    this.popups.push({
      x: event.x,
      y: event.y - 8,
      text: `+${Math.round(event.value)}`,
      life: 0.9,
      max: 0.9,
      color: "#f8fafc",
    });
    if (event.chain >= 2) {
      this.popups.push({
        x: event.x,
        y: event.y - 28,
        text: `CHAIN ×${event.chain}!`,
        life: 1.05,
        max: 1.05,
        color: "#fef08a",
      });
    }
    if (this.popups.length > 14) this.popups.splice(0, this.popups.length - 14);
    if (!this.showcase) {
      if (event.newTier >= 11) this.setBanner("2048 PRISM", 2.1);
      else if (event.chain >= 2) this.setBanner(`CHAIN ×${event.chain}!`, 1.15);
    }
    this.juice.cameraPunch(0.42 + event.newTier * 0.055 + event.chain * 0.08);
    this.juice.screenShake(2 + event.chain * 1.15, 130 + event.chain * 16);
    if (event.chain >= 3 || event.newTier >= 8) this.juice.hitStop(24 + event.chain * 6);
    this.juice.flash(event.newTier >= 10 ? 0.42 : 0.14);
    this.synth.tone(230 + event.newTier * 42 + event.chain * 16, 0.08, "triangle", 0.055, 0.045);
    if (event.chain >= 2) this.synth.comboSting(event.chain);
    if (event.newTier >= 9) this.synth.levelUp();
    pulseHaptic(event.chain >= 3 ? [8, 22, 10] : 8);
  }

  private endRun(result: "finish" | "death") {
    if (this.reported) return;
    this.reported = true;
    this.ended = true;
    this.endedAt = this.time.now;
    this.bannerText = result === "death" ? "CONTAINMENT BREACH" : "WELL SEALED";
    this.bannerT = 5;
    if (result === "death") {
      this.synth.crash(0.72);
      this.juice.screenShake(8, 240);
      this.juice.cameraPunch(1.1);
      pulseHaptic([16, 36, 16]);
    } else this.synth.finishSting();
    const maxTile = this.maxTierSeen > 0 ? tierValue(this.maxTierSeen) : 0;
    if (this.merges >= 1) void this.platform.achievement.unlock("first-merge");
    if (this.maxTierSeen >= 9) void this.platform.achievement.unlock("tile-512");
    if (this.maxTierSeen >= 11) void this.platform.achievement.unlock("tile-2048");
    if (this.chainMax >= 4) void this.platform.achievement.unlock("chain-4");
    void this.platform.session.end({
      mode: this.modeName,
      score: Math.round(this.score),
      result,
      metadata: {
        maxTile,
        merges: this.merges,
        chainMax: this.chainMax,
        maxChain: this.chainMax,
        tilts: this.tilts,
        seed: this.seed,
      },
    });
  }

  private stagePeakWell() {
    this.pieces = buildShowcaseWell(this.ids);
    this.score = 14820;
    this.chain = 3;
    this.chainT = 8;
    this.chainMax = Math.max(this.chainMax, 3);
    this.merges = Math.max(this.merges, 11);
    this.maxTierSeen = Math.max(this.maxTierSeen, 9);
    this.showcase = true;
    this.overflow = false;
    const hero = this.pieces.find((p) => p.tier === 9);
    this.rings = hero ? [{ x: hero.x, y: hero.y, life: 0.08, max: 1.25, color: tierColor(9) }] : [];
    this.popups = [];
    this.setBanner("CHAIN ×3 · 512 PRISM!", 8);
  }

  update(_: number, delta: number) {
    const dt = Math.min(0.033, delta / 1000);
    this.ticks += 1;
    this.longFrames = countLongFrame(delta, this.longFrames);
    if (!this.signaledReady) {
      this.signaledReady = true;
      this.platform.events.emit({ name: "game_ready", props: { gameId: "prism-drop" } });
    }
    this.lay = this.computeLayout();
    const keys = this.nativeKeys?.read();
    if (keys?.left && !keys.right) this.tiltDir = -1;
    if (keys?.right && !keys.left) this.tiltDir = 1;
    if (keys?.jumpPressed || keys?.retryPressed || keys?.dashPressed || keys?.left || keys?.right) this.ensureAudio();
    if (!this.ended && !this.paused) {
      const dir = (keys?.right ? 1 : 0) - (keys?.left ? 1 : 0);
      if (dir) {
        const r = this.heldRadius();
        this.aimX = clamp(this.aimX + dir * 320 * dt, r, WELL_W - r);
      }
      const dropEdge = Boolean(keys?.jumpPressed || (keys?.down && !this.prevDown));
      if (dropEdge) this.dropCurrent();
      if (keys?.dashPressed || this.ePulse) this.triggerTilt();
    }
    this.prevDown = Boolean(keys?.down);
    this.ePulse = false;
    if (keys?.retryPressed) this.tryRetry();
    else if (this.ended && keys?.jumpPressed && this.time.now - this.endedAt >= 450) this.tryRetry();

    const frozen = this.juice.isFrozen(this.time.now);
    if (!this.ended && !this.paused && !frozen) {
      const sim = dt * (this.overclock ? 1.4 : 1);
      const result = stepWell(this.pieces, sim, this.ids);
      if (result.maxTier > this.maxTierSeen) this.maxTierSeen = result.maxTier;
      this.score += result.scoreGain;
      for (const event of result.merges) this.onMerge(event, this.lay);
      this.overflow = result.overflowDanger;
      if (result.gameOver) this.endRun("death");
    }
    if (this.showcase) {
      const hero = this.pieces.find((p) => p.tier === 9);
      if (hero) {
        hero.flash = 1;
        if (this.bannerT > 0 && !this.rings.some((ring) => ring.life < ring.max * 0.62)) {
          this.rings.push({ x: hero.x, y: hero.y, life: 0, max: 1.15, color: tierColor(9) });
        }
      }
    }
    if (!this.paused) {
      this.dropCd = Math.max(0, this.dropCd - dt);
      this.tiltCd = Math.max(0, this.tiltCd - dt);
      this.bannerT = Math.max(0, this.bannerT - dt);
      this.chainT = Math.max(0, this.chainT - dt);
      for (const ring of this.rings) ring.life += dt;
      this.rings = this.rings.filter((ring) => ring.life < ring.max);
      for (const popup of this.popups) {
        popup.life -= dt;
        popup.y -= 26 * dt;
      }
      this.popups = this.popups.filter((popup) => popup.life > 0);
      this.parts.update(dt);
    }
    this.draw(dt);
    this.publishDebug();
  }

  private drawPrism(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    radius: number,
    tier: number,
    rot: number,
    alpha: number,
    flash: number,
  ) {
    const color = tierColor(tier);
    const body = mixColor(color, 0xffffff, 0.12);
    const shade = mixColor(color, 0x070b14, 0.45);
    const lift = 1 + Math.max(0, flash) * 0.12;
    const r = radius * lift;
    g.fillStyle(0x02040a, 0.32 * alpha);
    g.fillEllipse(x + r * 0.16, y + r * 0.78, r * 1.28, r * 0.46);
    g.fillStyle(color, 0.16 * alpha);
    g.fillCircle(x, y, r * 1.18);
    g.fillStyle(shade, alpha);
    g.fillCircle(x, y + r * 0.08, r);
    g.fillStyle(body, alpha);
    g.fillCircle(x, y - r * 0.04, r * 0.9);
    g.fillStyle(mixColor(color, 0xffffff, 0.42), 0.95 * alpha);
    tracePoly(g, x, y, r * 0.58, 8, rot, 0.92);
    g.fillPath();
    g.lineStyle(Math.max(1, r * 0.045), mixColor(color, 0xffffff, 0.72), 0.85 * alpha);
    tracePoly(g, x, y, r * 0.58, 8, rot, 0.92);
    g.strokePath();
    g.lineStyle(Math.max(1.6, r * 0.075), color, 0.95 * alpha);
    g.strokeCircle(x, y, r * 0.96);
    g.lineStyle(Math.max(1, r * 0.03), 0xffffff, 0.32 * alpha);
    g.strokeCircle(x, y, r * 0.8);
    g.fillStyle(0x071018, 0.4 * alpha);
    g.fillCircle(x, y + r * 0.04, r * (String(tierValue(tier)).length >= 4 ? 0.46 : 0.36));
    g.lineStyle(Math.max(1.4, r * 0.11), 0xffffff, 0.78 * alpha);
    g.beginPath();
    g.arc(x - r * 0.02, y - r * 0.05, r * 0.62, Math.PI * 1.02, Math.PI * 1.62, false);
    g.strokePath();
    g.fillStyle(0xffffff, 0.72 * alpha);
    g.fillCircle(x - r * 0.34, y - r * 0.36, Math.max(1.2, r * 0.09));
    if (flash > 0.02) {
      g.lineStyle(2 + flash * 3, 0xffffff, 0.5 * flash * alpha);
      g.strokeCircle(x, y, r * (1.04 + (1 - flash) * 0.18));
    }
  }

  private labelFor(pool: Phaser.GameObjects.Text[], index: number, depth: number) {
    let label = pool[index];
    if (!label) {
      label = this.makeText(16, "#f8fbff", 0.5, 0.5, depth);
      pool[index] = label;
    }
    return label;
  }

  private draw(dt: number) {
    const lay = this.lay;
    const g = this.gfx;
    const cam = this.juice.applyCamera({ x: 0, y: 0 }, this.time.now);
    g.clear();
    fillBackdrop(g, lay.w, lay.h, {
      top: 0x090d16,
      mid: 0x111a2e,
      bottom: 0x070a12,
      grain: 0.035,
      blobs: [
        { color: 0x38bdf8, x: 0.18, y: 0.12, r: 120, alpha: 0.08 },
        { color: 0xfacc15, x: 0.78, y: 0.2, r: 90, alpha: 0.05 },
        { color: 0xa78bfa, x: 0.5, y: 0.9, r: 140, alpha: 0.05 },
      ],
    });
    drawTechGrid(g, lay.w, lay.h);
    fillVignette(g, lay.w, lay.h, 0.28);
    g.save();
    g.translateCanvas(cam.x, cam.y);

    g.fillStyle(0x02060c, 0.55);
    g.fillRoundedRect(lay.wellX - 10, lay.wellY + 10, lay.wellW + 20, lay.wellH + 16, 22);
    g.fillStyle(0x0c1424, 0.94);
    g.fillRoundedRect(lay.wellX, lay.wellY, lay.wellW, lay.wellH, 16);
    g.fillStyle(0x38bdf8, 0.04);
    g.fillRoundedRect(lay.wellX + 6, lay.wellY + 6, lay.wellW * 0.28, lay.wellH - 12, 10);
    for (let i = 0; i < 8; i += 1) {
      g.fillStyle(0xffffff, 0.015);
      g.fillRect(lay.wellX + 8, lay.wellY + 18 + i * (lay.wellH / 8), lay.wellW - 16, 1);
    }

    const approaching = this.pieces.some((p) => p.age > 0.45 && p.y - p.r < DANGER_Y + 46);
    const hot = this.overflow || approaching;
    const pulse = 0.45 + 0.55 * Math.sin(this.time.now / (hot ? 80 : 320));
    for (let mark = 40; mark < WELL_H; mark += 40) {
      const y = lay.wellY + mark * lay.scale;
      g.lineStyle(1, 0x7dd3fc, mark === 80 ? 0 : 0.18);
      g.lineBetween(lay.wellX + 8, y, lay.wellX + 16, y);
      g.lineBetween(lay.wellX + lay.wellW - 16, y, lay.wellX + lay.wellW - 8, y);
    }
    const dangerY = lay.wellY + DANGER_Y * lay.scale;
    g.lineStyle(hot ? 2.6 : 1.5, hot ? 0xff3355 : 0xfb7185, hot ? 0.5 + pulse * 0.45 : 0.55);
    g.lineBetween(lay.wellX + 10, dangerY, lay.wellX + lay.wellW - 10, dangerY);
    if (hot) {
      g.lineStyle(6, 0xff3355, 0.12 + pulse * 0.1);
      g.lineBetween(lay.wellX + 10, dangerY, lay.wellX + lay.wellW - 10, dangerY);
    }

    const spawnY = this.heldRadius() + 18;
    const ghostY = this.landingY(this.aimX, this.heldRadius(), spawnY);
    const aimSx = lay.wellX + this.aimX * lay.scale;
    if (!this.ended) {
      const y0 = lay.wellY + (spawnY + this.heldRadius() * 0.2) * lay.scale;
      const y1 = lay.wellY + ghostY * lay.scale;
      g.lineStyle(1.4, 0x67e8f9, 0.28 + pulse * 0.25);
      const dash = 7;
      const gap = 6;
      for (let y = y0; y < y1 - 4; y += dash + gap) g.lineBetween(aimSx, y, aimSx, Math.min(y1 - 2, y + dash));
      this.drawPrism(g, aimSx, lay.wellY + ghostY * lay.scale, this.heldRadius() * lay.scale, this.held, 0.2, 0.3, 0);
    }

    for (const piece of this.pieces) {
      const sx = lay.wellX + piece.x * lay.scale;
      const sy = lay.wellY + piece.y * lay.scale;
      this.drawPrism(g, sx, sy, piece.r * lay.scale, piece.tier, piece.rot, 1, piece.flash);
    }
    for (const ring of this.rings) {
      const k = ring.life / ring.max;
      const sx = lay.wellX + ring.x * lay.scale;
      const sy = lay.wellY + ring.y * lay.scale;
      const rad = (16 + k * 118) * lay.scale;
      g.lineStyle(Math.max(1.5, (1 - k) * 4), ring.color, (1 - k) * 0.85);
      g.strokeCircle(sx, sy, rad);
      g.lineStyle(1, 0xffffff, (1 - k) * 0.35);
      g.strokeCircle(sx, sy, rad * 0.78);
    }
    drawParticles(g, this.parts);

    if (!this.ended) {
      const hy = lay.wellY + spawnY * lay.scale;
      const hr = this.heldRadius() * lay.scale;
      g.lineStyle(2, 0xfacc15, 0.8);
      g.lineBetween(aimSx - hr - 8, hy - hr * 0.85, aimSx - hr * 0.15, hy - hr * 0.15);
      g.lineBetween(aimSx + hr + 8, hy - hr * 0.85, aimSx + hr * 0.15, hy - hr * 0.15);
      this.drawPrism(g, aimSx, hy, hr, this.held, this.time.now / 900, this.dropCd > 0 ? 0.55 : 1, 0);
    }

    g.lineStyle(7, 0x071018, 0.95);
    g.strokeRoundedRect(lay.wellX - 2, lay.wellY - 2, lay.wellW + 4, lay.wellH + 4, 18);
    g.lineStyle(2.4, 0xfacc15, 0.88);
    g.strokeRoundedRect(lay.wellX - 7, lay.wellY - 7, lay.wellW + 14, lay.wellH + 14, 22);
    g.lineStyle(1.6, 0x67e8f9, 0.95);
    g.strokeRoundedRect(lay.wellX - 1, lay.wellY - 1, lay.wellW + 2, lay.wellH + 2, 16);
    g.lineStyle(3, 0xfacc15, 0.55);
    g.strokeRoundedRect(lay.wellX - 1, lay.wellY + lay.wellH - 8, lay.wellW + 2, 12, 6);
    g.restore();

    this.drawLabels(lay, cam);
    this.drawChrome(lay, dt);
  }

  private drawLabels(lay: WellLayout, cam: { x: number; y: number }) {
    this.pieces.forEach((piece, index) => {
      const label = this.labelFor(this.valueLabels, index, 8);
      const r = piece.r * lay.scale;
      const digits = String(tierValue(piece.tier));
      const size = Math.max(10, r * (digits.length >= 4 ? 0.34 : digits.length === 3 ? 0.46 : 0.58));
      label
        .setText(digits)
        .setColor(ink(tierColor(piece.tier)))
        .setFontSize(size)
        .setPosition(lay.wellX + piece.x * lay.scale + cam.x, lay.wellY + piece.y * lay.scale + cam.y + r * 0.02)
        .setVisible(true)
        .setAlpha(1);
    });
    for (let i = this.pieces.length; i < this.valueLabels.length; i += 1) this.valueLabels[i]?.setVisible(false);

    if (!this.ended) {
      const held = this.labelFor(this.valueLabels, this.pieces.length, 9);
      const r = this.heldRadius() * lay.scale;
      const digits = String(tierValue(this.held));
      const size = Math.max(10, r * (digits.length >= 3 ? 0.42 : 0.56));
      held
        .setText(digits)
        .setColor(ink(tierColor(this.held)))
        .setFontSize(size)
        .setPosition(
          lay.wellX + this.aimX * lay.scale + cam.x,
          lay.wellY + (this.heldRadius() + 18) * lay.scale + cam.y,
        )
        .setVisible(true)
        .setAlpha(this.dropCd > 0 ? 0.65 : 1);
      for (let i = this.pieces.length + 1; i < this.valueLabels.length; i += 1) this.valueLabels[i]?.setVisible(false);
    }

    this.popups.forEach((popup, index) => {
      const label = this.labelFor(this.popupLabels, index, 28);
      const alpha = Math.max(0, popup.life / popup.max);
      label
        .setText(popup.text)
        .setColor(popup.color)
        .setFontSize(popup.text.startsWith("CHAIN") ? 16 : 15)
        .setPosition(lay.wellX + popup.x * lay.scale + cam.x, lay.wellY + popup.y * lay.scale + cam.y)
        .setVisible(!this.hudHidden)
        .setAlpha(alpha);
    });
    for (let i = this.popups.length; i < this.popupLabels.length; i += 1) this.popupLabels[i]?.setVisible(false);
  }

  private drawChrome(lay: WellLayout, dt: number) {
    const show = !this.hudHidden;
    const o = this.overlay;
    o.clear();
    if (show) {
      o.fillStyle(0x070c16, 0.78);
      o.fillRoundedRect(lay.panelX, lay.panelY, lay.panelW, lay.panelH, 18);
      o.lineStyle(1.5, 0x38bdf8, 0.55);
      o.strokeRoundedRect(lay.panelX, lay.panelY, lay.panelW, lay.panelH, 18);
      o.lineStyle(1, 0xfacc15, 0.35);
      o.strokeRoundedRect(lay.panelX + 4, lay.panelY + 4, lay.panelW - 8, lay.panelH - 8, 14);

      const pad = 12;
      let y = lay.panelY + pad;
      const modeLabel = this.overclock ? "OVERCLOCK WELL" : this.modeName === "daily" ? "DAILY WELL" : "CONTAINMENT WELL";
      const best = this.maxTierSeen > 0 ? tierValue(this.maxTierSeen) : 0;
      const chainLine = this.chainT > 0 && this.chain >= 2 ? `CHAIN ×${this.chain}` : "CHAIN —";
      this.scoreText.setText(Math.round(this.score).toLocaleString()).setPosition(lay.panelX + pad, y).setVisible(true);
      y += 32;
      this.metaText
        .setText(`${modeLabel}\nBEST ${best || "—"}   ${chainLine}`)
        .setPosition(lay.panelX + pad, y)
        .setVisible(true);
      y += 42;
      this.evoTitle.setText("EVOLUTION");
      this.nextTitle.setText("NEXT PRISM").setPosition(lay.panelX + lay.panelW / 2, y).setVisible(true);
      y += 16;
      const budget = Math.max(0, lay.button.y - y - 40);
      const nextH = Math.max(64, Math.min(108, budget * 0.42));
      o.fillStyle(0x10192b, 0.95);
      o.fillRoundedRect(lay.panelX + 10, y, lay.panelW - 20, nextH, 12);
      o.lineStyle(1.4, tierColor(this.nextTier), 0.9);
      o.strokeRoundedRect(lay.panelX + 10, y, lay.panelW - 20, nextH, 12);
      const nr = Math.min(28, nextH * 0.28, (lay.panelW - 36) / 2);
      this.drawPrism(
        o,
        lay.panelX + lay.panelW / 2,
        y + nextH * 0.48,
        nr,
        this.nextTier,
        this.time.now / 1200,
        1,
        0,
      );
      this.nextValue
        .setText(String(tierValue(this.nextTier)))
        .setColor(ink(tierColor(this.nextTier)))
        .setFontSize(Math.max(14, nr * 0.7))
        .setPosition(lay.panelX + lay.panelW / 2, y + nextH * 0.5)
        .setVisible(true);
      y += nextH + 12;
      this.evoTitle.setPosition(lay.panelX + lay.panelW / 2, y).setVisible(true);
      y += 18;
      const wheelRoom = lay.button.y - y - 30;
      const wheelR = Math.min(108, (lay.panelW - 28) / 2, wheelRoom / 2);
      const cx = lay.panelX + lay.panelW / 2;
      const cy = y + Math.max(0, wheelR);
      if (wheelR > 24) {
      o.lineStyle(1, 0x38bdf8, 0.25);
      o.strokeCircle(cx, cy, wheelR);
      TIERS.forEach((entry, i) => {
        const ang = -Math.PI / 2 + (i / TIERS.length) * Math.PI * 2;
        const px = cx + Math.cos(ang) * wheelR;
        const py = cy + Math.sin(ang) * wheelR;
        const reached = this.maxTierSeen >= entry.tier;
        const node = reached ? 7.2 : 5.2;
        o.fillStyle(tierColor(entry.tier), reached ? 0.95 : 0.28);
        o.fillCircle(px, py, node);
        o.lineStyle(1.2, reached ? 0xffffff : 0x334155, reached ? 0.8 : 0.45);
        o.strokeCircle(px, py, node);
        if (entry.tier === this.held) {
          o.lineStyle(1.5, 0xfacc15, 0.95);
          o.strokeCircle(px, py, node + 3);
        }
      });
      o.fillStyle(0x070c16, 0.92);
      o.fillCircle(cx, cy, wheelR * 0.46);
      o.lineStyle(1.4, 0xfacc15, 0.7);
      o.strokeCircle(cx, cy, wheelR * 0.46);
      this.evoCenter
        .setText(best ? String(best) : "—")
        .setPosition(cx, cy)
        .setVisible(true);
      } else {
        this.evoCenter.setVisible(false);
        this.evoTitle.setVisible(false);
      }

      const btn = lay.button;
      const cooling = this.tiltCd > 0;
      const ready = !cooling && !this.ended && this.pieces.length > 0;
      const charge = cooling ? 1 - this.tiltCd / TILT_CD : 1;
      const glow = ready ? 0.45 + 0.55 * Math.sin(this.time.now / 160) : 0.2;
      o.fillStyle(ready ? 0x172033 : 0x101622, 0.96);
      o.fillRoundedRect(btn.x, btn.y, btn.w, btn.h, 12);
      o.lineStyle(2, ready ? 0xfacc15 : 0x334155, 0.45 + glow * 0.5);
      o.strokeRoundedRect(btn.x, btn.y, btn.w, btn.h, 12);
      o.fillStyle(ready ? 0x38bdf8 : 0x0ea5e9, ready ? 0.45 : 0.28);
      o.fillRoundedRect(btn.x + 8, btn.y + btn.h - 9, Math.max(4, (btn.w - 16) * charge), 4, 2);
      const tiltLabel = cooling ? `PULSE TILT ⚡  ${this.tiltCd.toFixed(1)}s` : "PULSE TILT ⚡";
      this.tiltText
        .setText(tiltLabel)
        .setFontSize(lay.panelW < 160 ? 10 : 13)
        .setPosition(btn.x + btn.w / 2, btn.y + btn.h / 2 - 4)
        .setVisible(true)
        .setAlpha(ready ? 1 : 0.7);
      this.hintText
        .setText(lay.panelW < 160 ? "A/D · DROP · TILT" : "A/D AIM · SPACE DROP · SHIFT TILT")
        .setPosition(lay.panelX + lay.panelW / 2, btn.y - 4)
        .setVisible(true);
    } else {
      for (const text of this.chrome) text.setVisible(false);
    }

    this.limitText
      .setText("LIMIT")
      .setPosition(lay.wellX + 18, lay.wellY + DANGER_Y * lay.scale)
      .setVisible(show);

    const bannerAlpha = this.bannerT > 0 ? Math.min(1, this.bannerT) : 0;
    this.banner
      .setText(this.bannerText)
      .setPosition(lay.wellX + lay.wellW / 2, lay.wellY + 36)
      .setVisible(show && bannerAlpha > 0.05)
      .setAlpha(bannerAlpha);

    const flash = this.juice.flashAlpha(dt);
    if (flash > 0) {
      o.fillStyle(0xffffff, flash * 0.85);
      o.fillRect(0, 0, lay.w, lay.h);
    }
  }

  private publishDebug() {
    publishGwDebug(
      {
        gameId: "prism-drop",
        ready: this.signaledReady,
        runState: this.ended ? "ended" : this.paused ? "paused" : "playing",
        playerX: this.aimX,
        playerY: DANGER_Y,
        score: Math.round(this.score),
        paused: this.paused,
        fps: this.game.loop.actualFps,
        longFrames: this.longFrames,
        tick: this.ticks,
        frozen: false,
        contentId: this.modeName,
      },
      {
        finishRun: () => this.endRun("finish"),
        killPlayer: () => this.endRun("death"),
        jump: () => this.dropCurrent(true),
        seedPeak: () => this.stagePeakWell(),
        hideHud: () => {
          this.hudHidden = true;
          for (const text of this.chrome) text.setVisible(false);
          for (const text of this.popupLabels) text.setVisible(false);
        },
      },
    );
  }
}

export function mountPrismDrop(parent: HTMLElement, platform: PlatformSDK, modeIndex = 0) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: Math.max(320, parent.clientWidth || 960),
    height: Math.max(240, parent.clientHeight || 640),
    backgroundColor: "#090d16",
    scale: { mode: Phaser.Scale.RESIZE },
    scene: [PrismDropScene],
    disableContextMenu: true,
    banner: false,
    autoFocus: true,
    input: { keyboard: { target: typeof window !== "undefined" ? window : undefined }, activePointers: 3 },
    fps: { target: 60 },
    render: { preserveDrawingBuffer: true },
  });
  game.registry.set("platform", platform);
  game.registry.set("modeIndex", modeIndex);
  game.registry.set("manifest", prismDropManifest);
  (game as Phaser.Game & { restartRun: () => void }).restartRun = () => {
    game.scene.getScene("prism-drop-play")?.scene.restart();
  };
  game.events.once("destroy", () => {
    (game.registry.get("synth") as Synth | undefined)?.dispose();
    clearGwDebug();
  });
  return game;
}
