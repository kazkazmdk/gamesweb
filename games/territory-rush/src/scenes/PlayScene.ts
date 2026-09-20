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
  drawToyHouse,
  type GameKeyboard,
} from "@gamesweb/game-core";
import { readRunContext, territoryRushManifest, type PlatformSDK } from "@gamesweb/game-sdk";
import { brickDir, needleDir, sweepDir } from "../systems/bots";
import { contourSpans, drawRibbon, ribbonPoints } from "../systems/render";

const COLS = 48;
const ROWS = 28;
const TIME = 90000;

type Owner = 0 | 1 | 2 | 3 | 4;

export class TerritoryScene extends Phaser.Scene {
  private platform!: PlatformSDK;
  private juice = new Juice();
  private parts!: ParticlePool;
  private synth!: Synth;
  private gfx!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private native: GameKeyboard | null = null;
  private grid: Owner[] = [];
  private px = 8;
  private py = 14;
  private trail: Array<{ x: number; y: number }> = [];
  private bots: Array<{ x: number; y: number; id: Owner; name: string; trail: Array<{ x: number; y: number }>; dir: { x: number; y: number }; bot: true }> = [];
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
  private flashes: Array<{ cells: number[]; t: number; id: Owner }> = [];
  private names: Phaser.GameObjects.Text[] = [];
  private vis = { x: 8, y: 14 };
  private pickups: Array<{ x: number; y: number; kind: "speed" | "shield" | "claim" }> = [];
  private boost = 0;
  private shield = 0;
  private arena = 0;
  private blocked = new Set<number>();
  private botSteps = [0, 0, 0];
  private banners: Array<{ text: string; t: number }> = [];
  private captureWave = 0;
  private lastPct = 0;

  constructor() {
    super("territory-play");
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
      { x: 16, y: 8, kind: "speed" },
      { x: 32, y: 18, kind: "shield" },
    ];
    this.grid = new Array(COLS * ROWS).fill(0);
    this.paintHome(8, 14, 1);
    this.bots = [
      { x: 40, y: 6, id: 2, name: "BRICK", trail: [], dir: { x: -1, y: 0 }, bot: true },
      { x: 40, y: 22, id: 3, name: "NEEDLE", trail: [], dir: { x: 0, y: -1 }, bot: true },
      { x: 24, y: 4, id: 4, name: "SWEEP", trail: [], dir: { x: 1, y: 0 }, bot: true },
    ];
    for (const b of this.bots) this.paintHome(b.x, b.y, b.id);
    this.px = 8;
    this.py = 14;
    this.trail = [];
    this.t = 0;
    this.ended = false;
    this.claims = 0;
    this.cuts = 0;
    this.parts = new ParticlePool(80);
    this.synth = (this.game.registry.get("synth") as Synth | undefined) ?? new Synth();
    this.game.registry.set("synth", this.synth);
    this.synth.setSettings(this.platform.audio.getSettings());
    this.gfx = this.add.graphics();
    this.hud = this.add.text(16, 64, "", { fontFamily: "ui-sans-serif, system-ui", fontSize: "16px", color: "#3a2a18" }).setScrollFactor(0).setDepth(21);
    this.flashes = [];
    this.names.forEach((t) => t.destroy());
    this.names = this.bots.map((b) =>
      this.add
        .text(0, 0, b.name, { fontFamily: "ui-sans-serif, system-ui", fontSize: "11px", color: "#fff4f6" })
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
      for (let dx = -2; dx <= 2; dx += 1) this.set(x + dx, y + dy, id);
    }
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
        for (const b of this.banners) b.t -= dt;
        this.banners = this.banners.filter((b) => b.t > 0);
      }
      this.captureWave = Math.max(0, this.captureWave - dt * 0.6);
      if (this.t >= TIME) this.finish();
      this.boost = Math.max(0, this.boost - dt);
      this.shield = Math.max(0, this.shield - dt);
      this.vis.x += (this.px - this.vis.x) * (1 - Math.exp(-dt * 14));
      this.vis.y += (this.py - this.vis.y) * (1 - Math.exp(-dt * 14));
      this.pickups = this.pickups.filter((p) => {
        if (Math.abs(p.x - this.px) > 0 || Math.abs(p.y - this.py) > 0) return true;
        if (p.kind === "speed") this.boost = 4;
        if (p.kind === "shield") this.shield = 5;
        if (p.kind === "claim") {
          this.paintHome(this.px, this.py, 1);
          this.claims += 1;
        }
        this.synth.pickup();
        return false;
      });
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
      if (!isBot) this.finish();
      else this.resetBot(id);
      return;
    }
    for (const other of this.bots) {
      if (other.id !== id && other.trail.some((c) => c.x === nx && c.y === ny)) {
        this.cuts += 1;
        void this.platform.achievement.unlock("cut");
        this.banners.push({ text: isBot && id !== 1 ? `ELIMINATED ${other.name}` : `CUT ${other.name}`, t: 0.9 });
        if (!isBot) this.banners.push({ text: "REVENGE", t: 0.7 });
        this.synth.impact(0.5);
        this.resetBot(other.id);
      }
    }
    if (id !== 1 && this.trail.some((c) => c.x === nx && c.y === ny)) {
      this.finish();
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
          for (let i = 0; i < this.grid.length; i += 1) if (before[i] !== this.grid[i]) cells.push(i);
          this.flashes.push({ cells, t: 1, id });
          this.claims += 1;
          this.largest = Math.max(this.largest, n);
          this.combo += 1;
          this.captureWave = 1;
          const gained = this.pct(id) - this.lastPct;
          this.lastPct = this.pct(1);
          if (!isBot && gained > 0.2) this.banners.push({ text: `+${gained.toFixed(0)}%`, t: 0.7 });
          this.juice.cameraPunch(0.35);
          this.synth.tone(240 + this.combo * 20, 0.05, "sine", 0.04, 0.12);
          if (!isBot) void this.platform.achievement.unlock("first-claim");
        }
        trail.length = 0;
      }
    } else {
      trail.push({ x: nx, y: ny });
    }
  }

  private authoredCaptureLoop() {
    const left = 4;
    const right = 29;
    const top = 4;
    const bottom = 23;
    const trail: Array<{ x: number; y: number }> = [];
    const push = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
      if (this.blocked.has(this.idx(x, y))) return;
      if (trail.some((c) => c.x === x && c.y === y)) return;
      trail.push({ x, y });
    };
    for (let x = left; x <= right; x += 1) push(x, top);
    for (let y = top + 1; y <= bottom; y += 1) push(right, y);
    for (let x = right - 1; x >= left; x -= 1) push(x, bottom);
    for (let y = bottom - 1; y > top; y -= 1) push(left, y);
    return trail;
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
    b.x = 40;
    b.y = 8 + id * 4;
    this.paintHome(b.x, b.y, id);
  }

  private pct(id: Owner) {
    let n = 0;
    for (const c of this.grid) if (c === id) n += 1;
    return (n / this.grid.length) * 100;
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
    const colors = this.arena === 0 ? [0xf2ead8, 0xff4d6d, 0x3d9cff, 0xffd166, 0x7d5fff] : [0xe8f0e4, 0x2ec8b0, 0xff8a4a, 0x8aa0ff, 0xff6ab0];
    const outlines = [0x000000, 0xffc1cc, 0xb8ddff, 0xffe9a8, 0xcbb8ff];
    const c = this.cell;
    g.fillStyle(this.arena === 0 ? 0xf2ead8 : 0xe8f0e4, 1);
    g.fillRect(0, 0, COLS * c, ROWS * c);
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (this.get(x, y) !== 0) continue;
        const park = ((x / 8) | 0) + ((y / 6) | 0);
        g.fillStyle(park % 3 === 0 ? (this.arena === 0 ? 0xe4dcc4 : 0xd8e8d4) : this.arena === 0 ? 0xf6f0e2 : 0xeef4ea, 1);
        g.fillRect(x * c, y * c, c, c);
        const nearOwned =
          this.get(x + 1, y) !== 0 || this.get(x - 1, y) !== 0 || this.get(x, y + 1) !== 0 || this.get(x, y - 1) !== 0;
        if ((x + y * 3) % 17 === 0 && x > 1 && y > 1 && !nearOwned) {
          drawToyHouse(g, x * c + 1, y * c + 4, c - 2, c - 5, park % 2 ? 0xf4d8b0 : 0xd8e8f0, park % 2 ? 0xc45c3a : 0x3a6a88);
        }
      }
    }
    g.fillStyle(0xc4b898, 0.28);
    for (let x = 0; x < COLS; x += 8) g.fillRect(x * c, 0, 3, ROWS * c);
    for (let y = 0; y < ROWS; y += 6) g.fillRect(0, y * c, COLS * c, 3);
    for (const i of this.blocked) {
      const x = i % COLS;
      const y = (i / COLS) | 0;
      g.fillStyle(this.arena === 0 ? 0xc8b890 : 0x8aa090, 1);
      g.fillRoundedRect(x * c, y * c, c, c, this.arena === 0 ? 2 : 0);
    }
    for (let owner = 1; owner <= 4; owner += 1) {
      g.fillStyle(colors[owner], owner === 1 ? 0.98 : 0.94);
      for (const span of contourSpans(this.grid, COLS, ROWS, owner)) {
        g.fillRoundedRect(span.x * c, span.y * c, span.w * c, c + 0.6, 3);
      }
      g.fillStyle(colors[owner], owner === 1 ? 0.22 : 0.1);
      for (const span of contourSpans(this.grid, COLS, ROWS, owner)) {
        g.fillRoundedRect(span.x * c + 2, span.y * c + 2, Math.max(2, span.w * c - 4), c - 2, 2);
      }
      g.lineStyle(owner === 1 ? 3 : 2.2, outlines[owner], owner === 1 ? 0.95 : 0.8);
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
    for (const f of this.flashes) {
      g.fillStyle(0xffffff, f.t * 0.45);
      for (const i of f.cells) {
        const x = i % COLS;
        const y = (i / COLS) | 0;
        g.fillRect(x * c, y * c, c, c);
      }
    }
    if (this.captureWave > 0) {
      const wave = 1 - this.captureWave;
      g.fillStyle(colors[1], this.captureWave * 0.22);
      g.fillRect(0, 0, COLS * c, ROWS * c);
      g.fillStyle(colors[1], 0.28 + this.captureWave * 0.42);
      g.fillCircle(this.vis.x * c + c / 2, this.vis.y * c + c / 2, 90 + wave * 340);
      g.fillStyle(0xffffff, this.captureWave * 0.18);
      g.fillCircle(this.vis.x * c + c / 2, this.vis.y * c + c / 2, 48 + wave * 180);
    }
    drawRibbon(g, ribbonPoints(this.trail, c), this.shield > 0 ? 0x8fe8ff : 0xffffff, this.trail.length > 8 ? 1.35 : 1.2);
    for (const b of this.bots) drawRibbon(g, ribbonPoints(b.trail, c), colors[b.id], 0.85);
    for (const p of this.pickups) {
      g.fillStyle(p.kind === "speed" ? 0xffe08a : p.kind === "shield" ? 0x8fe8ff : 0xff8ad4, 0.95);
      g.fillCircle(p.x * c + c / 2, p.y * c + c / 2, c * 0.28);
    }
    const px = this.vis.x * c + c / 2;
    const py = this.vis.y * c + c / 2;
    const heading = Math.atan2(this.py - this.vis.y, this.px - this.vis.x);
    drawHoverBlade(g, px, py, colors[1], heading, this.trail.length > 2, this.time.now);
    this.bots.forEach((b, i) => {
      const bx = b.x * c + c / 2;
      const by = b.y * c + c / 2;
      g.fillStyle(colors[b.id], 1);
      if (b.name === "NEEDLE") g.fillTriangle(bx, by - c * 0.48, bx + c * 0.42, by + c * 0.38, bx - c * 0.42, by + c * 0.38);
      else if (b.name === "SWEEP") {
        g.fillTriangle(bx, by - c * 0.46, bx + c * 0.46, by, bx, by + c * 0.46);
        g.fillTriangle(bx, by - c * 0.46, bx - c * 0.46, by, bx, by + c * 0.46);
      } else g.fillRoundedRect(bx - c * 0.4, by - c * 0.4, c * 0.8, c * 0.8, 3);
      this.names[i]?.setPosition(bx, by - c * 0.7).setVisible(this.hud.visible);
    });
    drawParticles(g, this.parts);
    fillVignette(g, this.scale.width, this.scale.height, 0.06);
    this.hud.setText(
      `PAINT  ${this.pct(1).toFixed(0)}%   ${Math.max(0, (TIME - this.t) / 1000).toFixed(0)}s\n${this.arena === 0 ? "TOY CITY" : "PLAZA"}${this.banners[0] ? `  ${this.banners[0].text}` : ""}`,
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
        paused: false,
        fps: this.game.loop.actualFps,
        longFrames: this.longFrames,
        tick: this.ticks,
        frozen: false,
        contentId: this.arena === 0 ? "circuit-floor" : "shatter-field",
      },
      {
        finishRun: () => this.finish(),
        exposeTrail: () => {
          this.trail = [
            { x: this.px + 1, y: this.py },
            { x: this.px + 2, y: this.py },
            { x: this.px + 3, y: this.py },
            { x: this.px + 4, y: this.py },
            { x: this.px + 5, y: this.py },
            { x: this.px + 6, y: this.py },
            { x: this.px + 6, y: this.py + 1 },
            { x: this.px + 6, y: this.py + 2 },
            { x: this.px + 6, y: this.py + 3 },
          ];
          this.px = this.px + 6;
          this.py = this.py + 3;
          this.vis = { x: this.px, y: this.py };
        },
        closeLoop: () => {
          const before = this.grid.slice();
          this.trail = this.authoredCaptureLoop();
          this.fill(1, this.trail);
          this.captureWave = 1;
          const cells: number[] = [];
          for (let i = 0; i < this.grid.length; i += 1) if (before[i] !== this.grid[i]) cells.push(i);
          this.flashes.push({ cells, t: 1.4, id: 1 });
          this.trail = [];
          this.px = 8;
          this.py = 14;
          this.vis = { x: this.px, y: this.py };
          this.lastPct = this.pct(1);
        },
        hideHud: () => {
          this.hud.setVisible(false);
          this.names.forEach((t) => t.setVisible(false));
        },
      },
    );
  }

  shutdown() {
    this.native?.destroy();
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
