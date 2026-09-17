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
  type GameKeyboard,
} from "@gamesweb/game-core";
import { readRunContext, territoryRushManifest, type PlatformSDK } from "@gamesweb/game-sdk";

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

  constructor() {
    super("territory-play");
  }

  create() {
    this.platform = this.game.registry.get("platform") as PlatformSDK;
    const ctx = readRunContext();
    this.rng = seededRng(ctx.seed ?? ctx.challengeCode ?? "arena");
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
    this.hud = this.add.text(16, 48, "", { fontFamily: "ui-sans-serif, system-ui", fontSize: "16px", color: "#ffe0e6" }).setScrollFactor(0).setDepth(21);
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
      if (this.ticks % 5 === 0) {
        const mx = Number(Boolean(native?.right)) - Number(Boolean(native?.left)) || Math.round(this.stick.x);
        const my = Number(Boolean(native?.down)) - Number(Boolean(native?.up)) || Math.round(this.stick.y);
        this.stepActor(1, mx, my, this.trail, false);
        for (const b of this.bots) {
          if (this.rng() < 0.08) b.dir = { x: Math.round(this.rng() * 2 - 1), y: Math.round(this.rng() * 2 - 1) };
          this.stepActor(b.id, b.dir.x, b.dir.y, b.trail, true);
        }
      }
      if (this.t >= TIME) this.finish();
    }
    this.parts.update(dt);
    this.draw();
    this.publishDebug();
  }

  private stepActor(id: Owner, dx: number, dy: number, trail: Array<{ x: number; y: number }>, isBot: boolean) {
    if (!dx && !dy) return;
    const actor = isBot ? this.bots.find((b) => b.id === id)! : { x: this.px, y: this.py };
    const nx = Math.max(0, Math.min(COLS - 1, actor.x + Math.sign(dx)));
    const ny = Math.max(0, Math.min(ROWS - 1, actor.y + Math.sign(dy)));
    if (trail.some((c) => c.x === nx && c.y === ny)) {
      if (!isBot) this.finish();
      else this.resetBot(id);
      return;
    }
    for (const other of this.bots) {
      if (other.id !== id && other.trail.some((c) => c.x === nx && c.y === ny)) {
        this.cuts += 1;
        void this.platform.achievement.unlock("cut");
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
        const n = this.fill(id, trail);
        if (n > 0) {
          this.claims += 1;
          this.largest = Math.max(this.largest, n);
          this.combo += 1;
          this.synth.tone(240 + this.combo * 20, 0.05, "sine", 0.04, 0.12);
          if (!isBot) void this.platform.achievement.unlock("first-claim");
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
      if (seen[i] || blocked.has(i) || this.grid[i] === id) return;
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
      if (!seen[i] && this.grid[i] !== id && !blocked.has(i)) {
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
    const colors = [0x1a1014, 0xff4d6d, 0x4dabff, 0xffd166, 0x7d5fff];
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        g.fillStyle(colors[this.get(x, y)], 1);
        g.fillRect(x * this.cell, y * this.cell, this.cell - 1, this.cell - 1);
      }
    }
    g.fillStyle(0xffffff, 0.7);
    for (const c of this.trail) g.fillRect(c.x * this.cell, c.y * this.cell, this.cell - 1, this.cell - 1);
    g.fillStyle(0xffffff, 1);
    g.fillRect(this.px * this.cell, this.py * this.cell, this.cell, this.cell);
    for (const b of this.bots) {
      g.fillStyle(colors[b.id], 1);
      g.fillRect(b.x * this.cell, b.y * this.cell, this.cell, this.cell);
    }
    this.hud.setText(`${Math.max(0, (TIME - this.t) / 1000).toFixed(0)}s   ${this.pct(1).toFixed(0)}%\nBOTS: BRICK · NEEDLE · SWEEP`);
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
      },
      {
        finishRun: () => this.finish(),
        hideHud: () => this.hud.setVisible(false),
      },
    );
  }

  shutdown() {
    this.native?.destroy();
    clearGwDebug();
  }
}

export function mountTerritoryRush(parent: HTMLElement, platform: PlatformSDK) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: Math.max(320, parent.clientWidth || 1280),
    height: Math.max(240, parent.clientHeight || 720),
    backgroundColor: "#1a1014",
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
