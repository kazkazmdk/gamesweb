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
  drawParticles,
  drawHoverBlade,
  fillVignette,
  type GameKeyboard,
} from "@gamesweb/game-core";
import { readRunContext, territoryRushManifest, type PlatformSDK } from "@gamesweb/game-sdk";
import { brickDir, needleDir, sweepDir } from "../systems/bots";
import { authoredCaptureLoop, contourSpans, drawRibbon, ribbonPoints } from "../systems/render";

const COLS = 48;
const ROWS = 28;
const TIME = 90000;

type Owner = 0 | 1 | 2 | 3 | 4;

type ArenaPickup = {
  x: number;
  y: number;
  kind: "speed" | "shield" | "claim";
  active: boolean;
  respawnTimer: number;
  seq: number;
};

export class TerritoryScene extends Phaser.Scene {
  private platform!: PlatformSDK;
  private juice = new Juice();
  private parts!: ParticlePool;
  private synth!: Synth;
  private gfx!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private playerLabel!: Phaser.GameObjects.Text;
  private dangerLabel!: Phaser.GameObjects.Text;
  private standingLabels: Phaser.GameObjects.Text[] = [];
  private standingPctLabels: Phaser.GameObjects.Text[] = [];
  private native: GameKeyboard | null = null;
  private grid: Owner[] = [];
  private px = 8;
  private py = 14;
  private trail: Array<{ x: number; y: number }> = [];
  private trailThreat = false;
  private bots: Array<{
    x: number;
    y: number;
    spawnX: number;
    spawnY: number;
    id: Owner;
    name: string;
    trail: Array<{ x: number; y: number }>;
    dir: { x: number; y: number };
    bot: true;
  }> = [];
  private t = 0;
  private ended = false;
  private claims = 0;
  private cuts = 0;
  private largest = 0;
  private combo = 0;
  private signaledReady = false;
  private ticks = 0;
  private longFrames = 0;
  private cell = 16;
  private rng = Math.random;
  private stick = { x: 0, y: 0 };
  private flashes: Array<{ cells: number[]; t: number; id: Owner; cx: number; cy: number }> = [];
  private names: Phaser.GameObjects.Text[] = [];
  private vis = { x: 8, y: 14 };
  private pickups: ArenaPickup[] = [];
  private boost = 0;
  private shield = 0;
  private arena = 0;
  private blocked = new Set<number>();
  private botSteps = [0, 0, 0];
  private banners: Array<{ text: string; t: number }> = [];
  private captureWave = 0;
  private captureOrigin = { x: 8, y: 14 };
  private lastPct = 0;
  private paused = false;

  constructor() {
    super("territory-play");
  }

  private get remaining() {
    return Math.max(0, (TIME - this.t) / 1000);
  }

  create() {
    this.platform = this.game.registry.get("platform") as PlatformSDK;
    const ctx = readRunContext();
    this.rng = seededRng(ctx.seed ?? ctx.challengeCode ?? "arena");
    if (ctx.modeIndex !== undefined && Number.isFinite(ctx.modeIndex)) {
      this.arena = Math.abs(ctx.modeIndex) % 2;
    } else {
      this.arena = Math.abs(Number(this.game.registry.get("arenaIndex") ?? 0)) % 2;
    }
    this.vis = { x: 8, y: 14 };
    this.boost = 0;
    this.shield = 0;
    this.botSteps = [0, 0, 0];
    this.banners = [];
    this.captureWave = 0;
    this.captureOrigin = { x: 8, y: 14 };
    this.blocked = this.arena === 0
      ? this.blockRects([
          [20, 10, 6, 4],
          [30, 16, 5, 5],
        ])
      : this.blockRects([
          [14, 6, 3, 8],
          [22, 18, 8, 3],
          [34, 8, 4, 10],
          [8, 20, 6, 3],
        ]);
    this.pickups = [
      { x: 16, y: 8, kind: "speed", active: true, respawnTimer: 0, seq: 1 },
      { x: 32, y: 18, kind: "shield", active: true, respawnTimer: 0, seq: 2 },
      { x: 24, y: 14, kind: "claim", active: true, respawnTimer: 0, seq: 3 },
    ];
    this.grid = new Array(COLS * ROWS).fill(0);
    this.paintHome(8, 14, 1);
    this.bots = [
      { x: 40, y: 6, spawnX: 40, spawnY: 6, id: 2, name: "BRICK", trail: [], dir: { x: -1, y: 0 }, bot: true },
      { x: 40, y: 22, spawnX: 40, spawnY: 22, id: 3, name: "NEEDLE", trail: [], dir: { x: 0, y: -1 }, bot: true },
      { x: 24, y: 4, spawnX: 24, spawnY: 4, id: 4, name: "SWEEP", trail: [], dir: { x: 1, y: 0 }, bot: true },
    ];
    for (const b of this.bots) this.paintHome(b.x, b.y, b.id);
    this.px = 8;
    this.py = 14;
    this.trail = [];
    this.trailThreat = false;
    this.t = 0;
    this.ended = false;
    this.claims = 0;
    this.cuts = 0;
    this.largest = 0;
    this.combo = 0;
    this.lastPct = this.pct(1);
    this.parts = new ParticlePool(120);
    this.synth = (this.game.registry.get("synth") as Synth | undefined) ?? new Synth();
    this.game.registry.set("synth", this.synth);
    this.synth.setSettings(this.platform.audio.getSettings());
    this.gfx = this.add.graphics();
    this.hud = this.add
      .text(16, 62, "", {
        fontFamily: "ui-sans-serif, system-ui",
        fontSize: "15px",
        fontStyle: "800",
        color: "#221a12",
        stroke: "#fff8ec",
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(21);
    this.flashes = [];
    this.playerLabel?.destroy();
    this.playerLabel = this.add
      .text(0, 0, "YOU", {
        fontFamily: "ui-sans-serif, system-ui",
        fontSize: "11px",
        fontStyle: "800",
        color: "#ffffff",
        stroke: "#1c1218",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 1)
      .setDepth(18);
    this.dangerLabel?.destroy();
    this.dangerLabel = this.add
      .text(0, 0, "⚠ TRAIL DANGER!", {
        fontFamily: "ui-sans-serif, system-ui",
        fontSize: "12px",
        fontStyle: "900",
        color: "#ff2a5a",
        stroke: "#fff8ec",
        strokeThickness: 4,
      })
      .setOrigin(0.5, 1)
      .setDepth(22)
      .setVisible(false);
    this.standingLabels.forEach((t) => t.destroy());
    this.standingPctLabels.forEach((t) => t.destroy());
    this.standingLabels = [0, 1, 2, 3].map(() =>
      this.add
        .text(0, 0, "", {
          fontFamily: "ui-sans-serif, system-ui",
          fontSize: "11px",
          fontStyle: "800",
          color: "#f8fafc",
          stroke: "#0f172a",
          strokeThickness: 3,
        })
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(22),
    );
    this.standingPctLabels = [0, 1, 2, 3].map(() =>
      this.add
        .text(0, 0, "", {
          fontFamily: "ui-sans-serif, system-ui",
          fontSize: "11px",
          fontStyle: "900",
          color: "#f8fafc",
          stroke: "#0f172a",
          strokeThickness: 3,
        })
        .setOrigin(1, 0)
        .setScrollFactor(0)
        .setDepth(22),
    );
    this.names.forEach((t) => t.destroy());
    this.names = this.bots.map((b) =>
      this.add
        .text(0, 0, b.name, {
          fontFamily: "ui-sans-serif, system-ui",
          fontSize: "11px",
          fontStyle: "800",
          color: "#fff4f6",
          stroke: "#18121e",
          strokeThickness: 3,
        })
        .setOrigin(0.5, 1)
        .setDepth(18),
    );
    this.native?.destroy();
    this.native = createGameKeyboard();
    this.game.canvas.tabIndex = 0;
    this.game.canvas.focus({ preventScroll: true });
    this.input.addPointer(2);
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!p.isDown) return;
      this.stick.x = p.x < this.scale.width / 2 ? -1 : 1;
      this.stick.y = p.y < this.scale.height / 2 ? -1 : 1;
    });
    this.input.on("pointerup", () => {
      this.stick.x = 0;
      this.stick.y = 0;
    });
    this.game.events.on("platform-pause", () => (this.paused = true));
    this.game.events.on("platform-resume", () => (this.paused = false));
    this.platform.session.start();
    this.platform.events.emit({ name: "gameplay_started", props: { gameId: "territory-rush" } });
  }

  private blockRects(rects: Array<[number, number, number, number]>) {
    const set = new Set<number>();
    for (const [x, y, w, h] of rects) {
      for (let yy = y; yy < y + h; yy += 1) {
        for (let xx = x; xx < x + w; xx += 1) set.add(this.idx(xx, yy));
      }
    }
    return set;
  }

  private paintHome(x: number, y: number, id: Owner) {
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        const cx = x + dx;
        const cy = y + dy;
        if (!this.blocked.has(this.idx(cx, cy))) this.set(cx, cy, id);
      }
    }
  }

  private clearTrail(id: number) {
    if (id === 1 || id === 2 && !this.bots.some((b) => b.id === id && b.trail.length > 0)) {
      this.trail.length = 0;
    }
    const bot = this.bots.find((b) => b.id === id);
    if (bot) bot.trail.length = 0;
  }

  private erodePlayerTerritory(ratio = 0.15) {
    const owned: number[] = [];
    for (let i = 0; i < this.grid.length; i += 1) {
      if (this.grid[i] !== 1) continue;
      const x = i % COLS;
      const y = (i / COLS) | 0;
      // Protect core 5x5 home base around (8, 14)
      if (Math.abs(x - 8) <= 2 && Math.abs(y - 14) <= 2) continue;
      owned.push(i);
    }
    const toRemove = Math.floor(owned.length * ratio);
    // Erode from outer perimeter indices first
    for (let k = 0; k < toRemove; k += 1) {
      const idx = owned[owned.length - 1 - k];
      if (idx !== undefined) this.grid[idx] = 0;
    }
  }

  private handlePlayerSevered() {
    if (this.remaining > 12) {
      this.trail.length = 0;
      this.erodePlayerTerritory(0.15);
      this.paintHome(8, 14, 1);
      this.px = 8;
      this.py = 14;
      this.vis = { x: 8, y: 14 };
      this.shield = 2.0;
      this.combo = 0;
      this.synth.impact(0.55);
      this.juice.flash(0.18);
      this.parts.burst(this.px * this.cell + this.cell / 2, this.py * this.cell + this.cell / 2, 16, 0xff4d6d, 80, 240);
      this.banners.unshift({ text: "TRAIL SEVERED · RESPAWNED", t: 1.5 });
      return;
    }
    this.finish();
  }

  private findFreePickupCell(seq: number): { x: number; y: number } {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const h = (seq * 37 + attempt * 19 + this.arena * 13) % 997;
      const cx = 6 + (h % (COLS - 12));
      const cy = 4 + ((h * 7) % (ROWS - 8));
      if (!this.blocked.has(this.idx(cx, cy))) {
        return { x: cx, y: cy };
      }
    }
    return { x: 24, y: 14 };
  }

  private idx(x: number, y: number) {
    return y * COLS + x;
  }
  private get(x: number, y: number): Owner {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return 0;
    return this.grid[this.idx(x, y)] ?? 0;
  }
  private set(x: number, y: number, v: Owner) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
    this.grid[this.idx(x, y)] = v;
  }

  update(_: number, delta: number) {
    const dt = Math.min(0.033, delta / 1000);
    this.ticks += 1;
    this.longFrames = countLongFrame(delta, this.longFrames);
    if (!this.signaledReady) {
      this.signaledReady = true;
      this.platform.events.emit({ name: "game_ready", props: { gameId: "territory-rush" } });
    }
    this.cell = Math.min(this.scale.width / COLS, this.scale.height / ROWS);
    const native = this.native?.read();
    if (native?.retryPressed) this.scene.restart();
    if (this.paused) {
      this.draw();
      this.publishDebug();
      return;
    }
    if (!this.ended) {
      this.t += dt * 1000;
      if (this.ticks % (this.boost > 0 ? 3 : 5) === 0) {
        const mx = Number(Boolean(native?.right)) - Number(Boolean(native?.left)) || Math.round(this.stick.x);
        const my = Number(Boolean(native?.down)) - Number(Boolean(native?.up)) || Math.round(this.stick.y);
        this.stepActor(1, mx, my, this.trail, false);
        this.bots.forEach((b, i) => {
          this.botSteps[i] += 1;
          if (b.name === "BRICK") b.dir = brickDir(this.botSteps[i], b.x, b.y, 40, 6);
          else if (b.name === "NEEDLE") b.dir = needleDir(this.botSteps[i], b.x, b.y, 6, 22);
          else b.dir = sweepDir(this.botSteps[i], b.x, b.y);
          this.stepActor(b.id, b.dir.x, b.dir.y, b.trail, true);
        });
      }
      for (const b of this.banners) b.t -= dt;
      this.banners = this.banners.filter((b) => b.t > 0);
      this.captureWave = Math.max(0, this.captureWave - dt * 0.75);
      if (this.remaining <= 0 || this.pct(1) >= 85) this.finish();
      this.boost = Math.max(0, this.boost - dt);
      this.shield = Math.max(0, this.shield - dt);
      this.vis.x += (this.px - this.vis.x) * (1 - Math.exp(-dt * 14));
      this.vis.y += (this.py - this.vis.y) * (1 - Math.exp(-dt * 14));

      for (const p of this.pickups) {
        if (!p.active) {
          p.respawnTimer -= dt;
          if (p.respawnTimer <= 0) {
            const cellPos = this.findFreePickupCell(p.seq);
            p.x = cellPos.x;
            p.y = cellPos.y;
            p.active = true;
            p.respawnTimer = 0;
            p.seq += 1;
          }
          continue;
        }
        if (Math.abs(p.x - this.px) <= 1 && Math.abs(p.y - this.py) <= 1) {
          if (p.kind === "speed") {
            this.boost = 4;
            this.banners.unshift({ text: "SPEED BOOST!", t: 1.0 });
          } else if (p.kind === "shield") {
            this.shield = 5;
            this.banners.unshift({ text: "SHIELD ACTIVE!", t: 1.0 });
          } else if (p.kind === "claim") {
            this.paintHome(this.px, this.py, 1);
            this.claims += 1;
            this.captureOrigin = { x: this.px, y: this.py };
            this.captureWave = 0.75;
            this.banners.unshift({ text: "BURST CLAIM!", t: 1.0 });
          }
          this.synth.pickup();
          this.parts.burst(p.x * this.cell + this.cell / 2, p.y * this.cell + this.cell / 2, 12, 0xffe08a, 60, 200);
          p.active = false;
          p.respawnTimer = 10;
        }
      }
    }
    this.parts.update(dt);
    for (const f of this.flashes) f.t -= dt * 1.8;
    this.flashes = this.flashes.filter((f) => f.t > 0);
    this.draw();
    this.publishDebug();
  }

  private stepActor(id: Owner, dx: number, dy: number, trail: Array<{ x: number; y: number }>, isBot: boolean) {
    if (!dx && !dy) return;
    const actor = isBot ? this.bots.find((b) => b.id === id)! : { x: this.px, y: this.py };
    const nx = Math.max(0, Math.min(COLS - 1, actor.x + Math.sign(dx)));
    const ny = Math.max(0, Math.min(ROWS - 1, actor.y + Math.sign(dy)));
    if (nx === actor.x && ny === actor.y) return;
    if (this.blocked.has(this.idx(nx, ny))) return;
    if (trail.some((c) => c.x === nx && c.y === ny)) {
      if (!isBot) this.handlePlayerSevered();
      else this.resetBot(id);
      return;
    }
    for (const other of this.bots) {
      if (other.id !== id && other.trail.some((c) => c.x === nx && c.y === ny)) {
        this.cuts += 1;
        void this.platform.achievement.unlock("cut");
        this.banners.unshift({ text: isBot && id !== 1 ? `ELIMINATED ${other.name}` : `CUT ${other.name}!`, t: 0.9 });
        if (!isBot) this.banners.unshift({ text: "REVENGE", t: 0.7 });
        this.synth.impact(0.5);
        this.resetBot(other.id);
      }
    }
    if (id !== 1 && this.trail.some((c) => c.x === nx && c.y === ny)) {
      if (this.shield > 0) {
        this.shield = 0;
        this.clearTrail(id);
        this.resetBot(id);
        this.cuts += 1;
        this.synth.impact(0.6);
        this.juice.flash(0.16);
        this.parts.burst(nx * this.cell + this.cell / 2, ny * this.cell + this.cell / 2, 16, 0x8fe8ff, 80, 250);
        this.banners.unshift({ text: "SHIELD BLOCKED CUT!", t: 1.4 });
        return;
      }
      this.handlePlayerSevered();
      return;
    }
    if (!isBot) {
      this.px = nx;
      this.py = ny;
    } else {
      actor.x = nx;
      actor.y = ny;
    }
    if (this.get(nx, ny) === id) {
      if (trail.length) {
        const before = this.grid.slice();
        const n = this.fill(id, trail);
        if (n > 0) {
          const cells: number[] = [];
          let sumX = 0;
          let sumY = 0;
          for (let i = 0; i < this.grid.length; i += 1) {
            if (before[i] !== this.grid[i]) {
              cells.push(i);
              sumX += i % COLS;
              sumY += (i / COLS) | 0;
            }
          }
          const cx = cells.length ? sumX / cells.length : nx;
          const cy = cells.length ? sumY / cells.length : ny;
          this.flashes.push({ cells, t: 1, id, cx, cy });
          this.claims += 1;
          this.largest = Math.max(this.largest, n);
          this.combo += 1;
          this.captureOrigin = { x: cx, y: cy };
          this.captureWave = 1;
          const gained = this.pct(id) - this.lastPct;
          this.lastPct = this.pct(1);
          if (!isBot && gained > 0.2) this.banners.unshift({ text: `+${gained.toFixed(0)}% CLAIMED`, t: 0.85 });
          this.juice.cameraPunch(0.35);
          this.synth.tone(240 + this.combo * 20, 0.05, "sine", 0.04, 0.12);
          if (!isBot) void this.platform.achievement.unlock("first-claim");
          if (this.pct(1) >= 85) this.finish();
        }
        trail.length = 0;
      }
    } else {
      trail.push({ x: nx, y: ny });
    }
  }

  private fill(id: Owner, trail: Array<{ x: number; y: number }>) {
    for (const c of trail) this.set(c.x, c.y, id);
    const blocked = new Set(trail.map((c) => this.idx(c.x, c.y)));
    const seen = new Uint8Array(COLS * ROWS);
    const q: number[] = [];
    const push = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
      const i = this.idx(x, y);
      if (seen[i] || blocked.has(i) || this.blocked.has(i) || this.grid[i] === id) return;
      seen[i] = 1;
      q.push(i);
    };
    for (let x = 0; x < COLS; x += 1) {
      push(x, 0);
      push(x, ROWS - 1);
    }
    for (let y = 0; y < ROWS; y += 1) {
      push(0, y);
      push(COLS - 1, y);
    }
    while (q.length) {
      const i = q.pop()!;
      const x = i % COLS;
      const y = (i / COLS) | 0;
      push(x + 1, y);
      push(x - 1, y);
      push(x, y + 1);
      push(x, y - 1);
    }
    let n = 0;
    for (let i = 0; i < this.grid.length; i += 1) {
      if (!seen[i] && this.grid[i] !== id && !blocked.has(i) && !this.blocked.has(i)) {
        this.grid[i] = id;
        n += 1;
      }
    }
    return n + trail.length;
  }

  private resetBot(id: Owner) {
    const b = this.bots.find((x) => x.id === id);
    if (!b) return;
    b.trail = [];
    b.x = b.spawnX;
    b.y = b.spawnY;
    this.paintHome(b.x, b.y, id);
  }

  private pct(id: Owner) {
    let n = 0;
    for (const c of this.grid) if (c === id) n += 1;
    return (n / this.grid.length) * 100;
  }

  private drawLeaderCrown(g: Phaser.GameObjects.Graphics, cx: number, cy: number) {
    // Golden 3-point Paper.io Leader Crown with ruby gem
    g.fillStyle(0x1f1408, 0.85);
    g.fillRoundedRect(cx - 9, cy - 3, 18, 5, 2);
    g.fillStyle(0xfacc15, 1);
    g.beginPath();
    g.moveTo(cx - 8, cy);
    g.lineTo(cx - 9, cy - 8);
    g.lineTo(cx - 4, cy - 4);
    g.lineTo(cx, cy - 10);
    g.lineTo(cx + 4, cy - 4);
    g.lineTo(cx + 9, cy - 8);
    g.lineTo(cx + 8, cy);
    g.closePath();
    g.fillPath();
    g.fillStyle(0xff4d6d, 1);
    g.fillCircle(cx, cy - 3, 1.8);
  }

  private drawLiveStandings(g: Phaser.GameObjects.Graphics, colors: number[]) {
    if (!this.hud.visible) {
      this.standingLabels.forEach((t) => t.setVisible(false));
      this.standingPctLabels.forEach((t) => t.setVisible(false));
      return;
    }
    const px = Math.max(12, this.scale.width - 178);
    const py = 44;
    const pw = 164;
    const ph = 98;

    const entries: Array<{ id: Owner; name: string; pct: number; color: number }> = [
      { id: 1 as Owner, name: "YOU", pct: this.pct(1), color: colors[1] },
      ...this.bots.map((b) => ({ id: b.id, name: b.name, pct: this.pct(b.id), color: colors[b.id] })),
    ].sort((a, b) => b.pct - a.pct);

    // Compact dark Paper.io 2 live leaderboard plate
    g.fillStyle(0x140f1d, 0.84);
    g.fillRoundedRect(px, py, pw, ph, 10);
    g.lineStyle(1.8, entries[0]?.color ?? 0xffffff, 0.55);
    g.strokeRoundedRect(px, py, pw, ph, 10);

    for (let i = 0; i < entries.length; i += 1) {
      const e = entries[i];
      const ry = py + 6 + i * 22;
      const isYou = e.id === 1;

      if (isYou) {
        g.fillStyle(e.color, 0.24);
        g.fillRoundedRect(px + 4, ry - 1, pw - 8, 20, 5);
        g.lineStyle(1.2, 0xffffff, 0.55);
        g.strokeRoundedRect(px + 4, ry - 1, pw - 8, 20, 5);
      }

      // Faction color swatch
      g.fillStyle(e.color, 1);
      g.fillCircle(px + 13, ry + 9, 4.5);
      g.lineStyle(1.2, 0xffffff, 0.85);
      g.strokeCircle(px + 13, ry + 9, 4.5);

      // Proportional territory progress bar
      const barX = px + 23;
      const barW = pw - 31;
      const ratio = Phaser.Math.Clamp(e.pct / 100, 0.03, 1);
      g.fillStyle(0x000000, 0.48);
      g.fillRoundedRect(barX, ry + 13, barW, 4, 2);
      g.fillStyle(e.color, 1);
      g.fillRoundedRect(barX, ry + 13, barW * ratio, 4, 2);

      const rankCrown = i === 0 ? "👑 " : "";
      this.standingLabels[i]
        ?.setPosition(barX, ry - 1)
        .setText(`#${i + 1} ${rankCrown}${e.name}`)
        .setColor(isYou ? "#fde047" : i === 0 ? "#ffffff" : "#e2e8f0")
        .setVisible(true);

      this.standingPctLabels[i]
        ?.setPosition(px + pw - 8, ry - 1)
        .setText(`${Math.round(e.pct)}%`)
        .setColor(isYou ? "#fde047" : "#f8fafc")
        .setVisible(true);
    }
  }

  private finish() {
    if (this.ended) return;
    this.ended = true;
    const pct = this.pct(1);
    if (pct >= 50) void this.platform.achievement.unlock("half-map");
    const score = Math.round(pct * 400 + this.cuts * 250 + this.largest * 8 + this.combo * 40);
    this.synth.finishSting();
    pulseHaptic([10, 20, 10]);
    void this.platform.session.end({
      mode: readRunContext().daily ? "daily" : "arena",
      score,
      result: "finish",
      metadata: {
        territoryPct: Math.round(pct),
        eliminations: this.cuts,
        largestCapture: this.largest,
        maxCombo: this.combo,
        bots: true,
        attemptDurationMs: Math.round(this.t),
        retryHint: `${pct.toFixed(0)}% of the floor`,
      },
    });
  }

  private draw() {
    const g = this.gfx;
    g.clear();
    const colors =
      this.arena === 0
        ? [0xf2ead8, 0xff4d6d, 0x38bdf8, 0xfbbf24, 0xa78bfa]
        : [0xe8f0e4, 0x10b981, 0xf97316, 0x60a5fa, 0xf472b6];
    const lips =
      this.arena === 0
        ? [0x000000, 0x9f1239, 0x0369a1, 0xb45309, 0x5b21b6]
        : [0x000000, 0x065f46, 0x9a3412, 0x1e40af, 0x9d174d];
    const outlines = [0x000000, 0xffe4e8, 0xe0f2fe, 0xfef3c7, 0xede9fe];
    const c = this.cell;
    const tSec = this.time.now / 1000;

    // Neutral Arena Floor Grid
    g.fillStyle(this.arena === 0 ? 0xf2ead8 : 0xe8f0e4, 1);
    g.fillRect(0, 0, COLS * c, ROWS * c);
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (this.get(x, y) !== 0) continue;
        const park = ((x / 8) | 0) + ((y / 6) | 0);
        g.fillStyle(park % 3 === 0 ? (this.arena === 0 ? 0xe4dcc4 : 0xd8e8d4) : this.arena === 0 ? 0xf6f0e2 : 0xeef4ea, 1);
        g.fillRect(x * c, y * c, c - 0.5, c - 0.5);
        if ((x + y * 5) % 29 === 0 && x > 2 && y > 2 && this.get(x, y) === 0) {
          g.fillStyle(park % 2 ? 0xc4b898 : 0x9aa890, 0.22);
          g.fillRect(x * c + c * 0.25, y * c + c * 0.35, c * 0.5, c * 0.4);
        }
      }
    }
    g.fillStyle(0xc4b898, 0.26);
    for (let x = 0; x < COLS; x += 8) g.fillRect(x * c, 0, 2, ROWS * c);
    for (let y = 0; y < ROWS; y += 6) g.fillRect(0, y * c, COLS * c, 2);

    // 3D Extruded Obstacles / Pillars
    for (const i of this.blocked) {
      const x = i % COLS;
      const y = (i / COLS) | 0;
      g.fillStyle(0x2a241e, 0.45);
      g.fillRoundedRect(x * c, y * c + 3, c, c, 2);
      g.fillStyle(this.arena === 0 ? 0x9c8c6e : 0x647a6a, 1);
      g.fillRoundedRect(x * c, y * c, c, c, 2);
      g.fillStyle(0xffffff, 0.22);
      g.fillRect(x * c + 2, y * c + 1, c - 4, 2.5);
    }

    // Paper.io 3D Extruded Territory Tiles + Glowing Frontier Perimeter
    const lipDepth = Math.max(3, c * 0.28);
    for (let owner = 1; owner <= 4; owner += 1) {
      // Pass 1: Raised 3D Bottom Lip / Extrusion on southern frontier edges
      g.fillStyle(lips[owner], 0.96);
      for (let y = 0; y < ROWS; y += 1) {
        for (let x = 0; x < COLS; x += 1) {
          if (this.get(x, y) !== owner) continue;
          if (this.get(x, y + 1) !== owner) {
            g.fillRect(x * c, (y + 1) * c - 1, c + 0.5, lipDepth);
          }
        }
      }
      // Pass 2: Main Territory Top Surface Spans
      g.fillStyle(colors[owner], owner === 1 ? 0.98 : 0.94);
      for (const span of contourSpans(this.grid, COLS, ROWS, owner)) {
        g.fillRoundedRect(span.x * c, span.y * c, span.w * c, c + 0.6, 3);
      }
      // Pass 3: Specular Top Bevel & Glowing Frontier Border
      const frontierPulse = owner === 1 ? 0.82 + Math.sin(tSec * 5) * 0.16 : 0.78;
      g.lineStyle(owner === 1 ? 3 : 2.2, outlines[owner], frontierPulse);
      for (let y = 0; y < ROWS; y += 1) {
        for (let x = 0; x < COLS; x += 1) {
          if (this.get(x, y) !== owner) continue;
          if (this.get(x, y - 1) !== owner) g.lineBetween(x * c, y * c, (x + 1) * c, y * c);
          if (this.get(x, y + 1) !== owner) g.lineBetween(x * c, (y + 1) * c, (x + 1) * c, (y + 1) * c);
          if (this.get(x - 1, y) !== owner) g.lineBetween(x * c, y * c, x * c, (y + 1) * c);
          if (this.get(x + 1, y) !== owner) g.lineBetween((x + 1) * c, y * c, (x + 1) * c, (y + 1) * c);
        }
      }
    }

    // Expanding Grid Highlight Wave on Loop Capture
    for (const f of this.flashes) {
      const waveDist = (1 - f.t) * 22;
      for (const i of f.cells) {
        const x = i % COLS;
        const y = (i / COLS) | 0;
        const dist = Math.hypot(x - f.cx, y - f.cy);
        const ringBoost = Math.max(0, 1 - Math.abs(dist - waveDist) / 4.5);
        g.fillStyle(0xffffff, f.t * 0.35 + ringBoost * 0.4);
        g.fillRect(x * c, y * c, c, c);
      }
    }
    if (this.captureWave > 0) {
      const ox = this.captureOrigin.x * c + c / 2;
      const oy = this.captureOrigin.y * c + c / 2;
      const waveR = (1.05 - this.captureWave) * Math.max(COLS, ROWS) * c * 0.55;
      g.lineStyle(6 * this.captureWave, 0xffffff, this.captureWave * 0.65);
      g.strokeCircle(ox, oy, Math.max(18, waveR));
      g.lineStyle(3 * this.captureWave, colors[1], this.captureWave * 0.85);
      g.strokeCircle(ox, oy, Math.max(10, waveR * 0.72));
    }

    // Evaluate Trail Danger Radar (minimum bot distance to any unbanked player trail segment)
    let minTrailDist = Infinity;
    let threatCell: { x: number; y: number } | null = null;
    if (this.trail.length > 0) {
      for (const b of this.bots) {
        for (const seg of this.trail) {
          const d = Math.hypot(b.x - seg.x, b.y - seg.y);
          if (d < minTrailDist) {
            minTrailDist = d;
            threatCell = seg;
          }
        }
      }
    }
    this.trailThreat = this.trail.length > 0 && minTrailDist <= 3;

    // Active Unbanked Trails (pulses urgent red/white when threatened)
    const dangerWave = 0.5 + 0.5 * Math.sin(tSec * 24);
    const playerTrailColor = this.trailThreat
      ? dangerWave > 0.5
        ? 0xff1e42
        : 0xffffff
      : this.shield > 0
        ? 0x8fe8ff
        : colors[1];
    const playerTrailPulse = this.trailThreat ? 1.55 + dangerWave * 0.45 : this.trail.length > 8 ? 1.55 : 1.35;
    drawRibbon(g, ribbonPoints(this.trail, c), playerTrailColor, playerTrailPulse);
    if (this.trailThreat && threatCell) {
      const tx = threatCell.x * c + c / 2;
      const ty = threatCell.y * c + c / 2;
      g.lineStyle(2.5, 0xff1e42, 0.85);
      g.strokeCircle(tx, ty, c * (0.65 + dangerWave * 0.45));
    }
    for (const b of this.bots) drawRibbon(g, ribbonPoints(b.trail, c), colors[b.id], 0.85);

    // Arena Pickups (Speed, Shield, Claim) with animated halos
    for (const p of this.pickups) {
      if (!p.active) continue;
      const px = p.x * c + c / 2;
      const py = p.y * c + c / 2;
      const pCol = p.kind === "speed" ? 0xfacc15 : p.kind === "shield" ? 0x38bdf8 : 0xf472b6;
      const haloR = c * (0.42 + Math.sin(tSec * 5 + p.seq) * 0.08);
      g.lineStyle(2, pCol, 0.75);
      g.strokeCircle(px, py, haloR);
      g.fillStyle(0x18121e, 0.85);
      g.fillCircle(px, py, c * 0.32);
      g.fillStyle(pCol, 1);
      g.fillCircle(px, py, c * 0.24);
      g.fillStyle(0xffffff, 0.85);
      g.fillCircle(px - c * 0.07, py - c * 0.07, c * 0.08);
    }

    // Determine Live Territory Leader across YOU (1) and Bots (2..4)
    let leaderId: Owner = 1;
    let bestPct = this.pct(1);
    for (const b of this.bots) {
      const bp = this.pct(b.id);
      if (bp > bestPct) {
        bestPct = bp;
        leaderId = b.id;
      }
    }

    // Draw Player Hover-Carver + Shield Bubble + Leader Crown
    const px = this.vis.x * c + c / 2;
    const py = this.vis.y * c + c / 2;
    const heading = Math.atan2(this.py - this.vis.y, this.px - this.vis.x);
    if (this.shield > 0) {
      g.lineStyle(2.5, 0x38bdf8, 0.75 + Math.sin(tSec * 8) * 0.2);
      g.strokeCircle(px, py, c * 0.75);
      g.fillStyle(0x38bdf8, 0.16);
      g.fillCircle(px, py, c * 0.72);
    }
    drawHoverBlade(g, px, py, colors[1], heading, this.trailThreat, this.time.now);
    this.playerLabel?.setPosition(px, py - c * 0.72).setVisible(this.hud.visible);
    if (leaderId === 1) {
      this.drawLeaderCrown(g, px, py - c * 1.55);
    }
    if (this.trailThreat && this.hud.visible) {
      const warnY = py - c * (leaderId === 1 ? 2.25 : 1.55);
      this.dangerLabel
        ?.setPosition(px, warnY)
        .setColor(dangerWave > 0.5 ? "#ff1e42" : "#ffffff")
        .setScale(0.96 + dangerWave * 0.14)
        .setVisible(true);
    } else {
      this.dangerLabel?.setVisible(false);
    }

    // Draw Bot Rivals + Leader Crown
    this.bots.forEach((b, i) => {
      const bx = b.x * c + c / 2;
      const by = b.y * c + c / 2;
      g.fillStyle(0x000000, 0.28);
      g.fillCircle(bx + 1.5, by + 2.5, c * 0.44);
      g.fillStyle(colors[b.id], 1);
      if (b.name === "NEEDLE") g.fillTriangle(bx, by - c * 0.48, bx + c * 0.42, by + c * 0.38, bx - c * 0.42, by + c * 0.38);
      else if (b.name === "SWEEP") {
        g.fillTriangle(bx, by - c * 0.46, bx + c * 0.46, by, bx, by + c * 0.46);
        g.fillTriangle(bx, by - c * 0.46, bx - c * 0.46, by, bx, by + c * 0.46);
      } else g.fillRoundedRect(bx - c * 0.4, by - c * 0.4, c * 0.8, c * 0.8, 3);
      this.names[i]?.setPosition(bx, by - c * 0.7).setVisible(this.hud.visible);
      if (leaderId === b.id) {
        this.drawLeaderCrown(g, bx, by - c * 1.5);
      }
    });

    drawParticles(g, this.parts);
    fillVignette(g, this.scale.width, this.scale.height, 0.06);
    this.drawLiveStandings(g, colors);
    const shieldTag = this.shield > 0 ? `  ·  SHIELD ${this.shield.toFixed(1)}s` : "";
    const boostTag = this.boost > 0 ? `  ·  BOOST` : "";
    this.hud.setText(
      `HOLD  ${this.pct(1).toFixed(0)}%   ${this.remaining.toFixed(0)}s${shieldTag}${boostTag}\n${this.arena === 0 ? "DISTRICT" : "PLAZA"}${this.banners[0] ? `  ·  ${this.banners[0].text}` : ""}`,
    );
  }

  private publishDebug() {
    publishGwDebug(
      {
        gameId: "territory-rush",
        ready: this.signaledReady,
        runState: this.ended ? "ended" : "playing",
        playerX: this.px,
        playerY: this.py,
        score: Math.round(this.pct(1) * 400),
        paused: this.paused,
        fps: this.game.loop.actualFps,
        longFrames: this.longFrames,
        tick: this.ticks,
        frozen: false,
        contentId: this.arena === 0 ? "circuit-floor" : "shatter-field",
      },
      {
        finishRun: () => this.finish(),
        exposeTrail: () => {
          this.px = 8;
          this.py = 14;
          this.trail = [
            { x: 9, y: 14 },
            { x: 10, y: 14 },
            { x: 11, y: 14 },
            { x: 12, y: 14 },
            { x: 13, y: 14 },
            { x: 14, y: 14 },
            { x: 15, y: 14 },
            { x: 16, y: 14 },
            { x: 16, y: 15 },
            { x: 16, y: 16 },
            { x: 16, y: 17 },
            { x: 15, y: 17 },
          ];
          this.px = 15;
          this.py = 17;
          this.vis = { x: this.px, y: this.py };
        },
        closeLoop: () => {
          this.trail = authoredCaptureLoop(COLS, ROWS);
          const before = this.grid.slice();
          const n = this.fill(1, this.trail);
          const cells: number[] = [];
          let sumX = 0;
          let sumY = 0;
          for (let i = 0; i < this.grid.length; i += 1) {
            if (before[i] !== this.grid[i]) {
              cells.push(i);
              sumX += i % COLS;
              sumY += (i / COLS) | 0;
            }
          }
          const cx = cells.length ? sumX / cells.length : 24;
          const cy = cells.length ? sumY / cells.length : 14;
          this.flashes.push({ cells, t: 1.2, id: 1, cx, cy });
          this.captureOrigin = { x: cx, y: cy };
          this.captureWave = 1;
          this.claims += 1;
          this.largest = Math.max(this.largest, n);
          this.lastPct = this.pct(1);
          this.trail = [];
          this.px = 8;
          this.py = 14;
          this.vis = { x: this.px, y: this.py };
        },
        hideHud: () => {
          this.hud.setVisible(false);
          this.playerLabel?.setVisible(false);
          this.dangerLabel?.setVisible(false);
          this.standingLabels.forEach((t) => t.setVisible(false));
          this.standingPctLabels.forEach((t) => t.setVisible(false));
          this.names.forEach((t) => t.setVisible(false));
        },
      },
    );
  }

  shutdown() {
    this.native?.destroy();
    this.playerLabel?.destroy();
    this.dangerLabel?.destroy();
    this.standingLabels.forEach((t) => t.destroy());
    this.standingLabels = [];
    this.standingPctLabels.forEach((t) => t.destroy());
    this.standingPctLabels = [];
    this.names.forEach((t) => t.destroy());
    this.names = [];
    clearGwDebug();
  }
}

export function mountTerritoryRush(parent: HTMLElement, platform: PlatformSDK, arenaIndex = 0) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: Math.max(320, parent.clientWidth || 1280),
    height: Math.max(240, parent.clientHeight || 720),
    backgroundColor: "#f2ead8",
    scale: { mode: Phaser.Scale.RESIZE },
    scene: [TerritoryScene],
    disableContextMenu: true,
    banner: false,
    autoFocus: true,
    input: { keyboard: { target: typeof window !== "undefined" ? window : undefined }, activePointers: 3 },
    fps: { target: 60 },
    render: { preserveDrawingBuffer: true },
  });
  game.registry.set("platform", platform);
  game.registry.set("arenaIndex", arenaIndex);
  game.registry.set("manifest", territoryRushManifest);
  (game as Phaser.Game & { restartRun: () => void }).restartRun = () => {
    game.scene.getScene("territory-play")?.scene.restart();
  };
  game.events.once("destroy", () => {
    (game.registry.get("synth") as Synth | undefined)?.dispose();
    clearGwDebug();
  });
  return game;
}
