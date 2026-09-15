import { approach, clamp } from "@gamesweb/game-core";

export const MOVE = {
  maxRun: 318,
  accel: 3100,
  decel: 3400,
  airAccel: 1880,
  airDecel: 720,
  gravity: 2280,
  apexGravity: 1280,
  jumpV: -705,
  coyoteMs: 110,
  bufferMs: 140,
  fastFall: 1.82,
  maxFall: 1020,
  jumpCut: 0.4,
  landSquash: 0.22,
} as const;

export class Runner {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  w = 16;
  h = 28;
  grounded = false;
  coyote = 0;
  buffer = 0;
  jumping = false;
  dead = false;
  facing = 1;
  fastFell = false;
  squash = 1;
  stretch = 1;
  lean = 0;
  landFlash = 0;

  reset(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;
    this.coyote = 0;
    this.buffer = 0;
    this.jumping = false;
    this.dead = false;
    this.fastFell = false;
    this.squash = 1;
    this.stretch = 1;
    this.lean = 0;
    this.landFlash = 0;
  }

  input(dt: number, move: number, jumpDown: boolean, jumpHeld: boolean, jumpReleased: boolean, down: boolean, now: number) {
    if (jumpDown) this.buffer = now + MOVE.bufferMs;

    const accel = this.grounded ? MOVE.accel : MOVE.airAccel;
    const decel = this.grounded ? MOVE.decel : MOVE.airDecel;
    if (move !== 0) {
      this.vx = approach(this.vx, move * MOVE.maxRun, accel * dt);
      this.facing = move;
    } else {
      this.vx = approach(this.vx, 0, decel * dt);
    }

    const canJump = this.grounded || now < this.coyote;
    if (now < this.buffer && canJump) {
      this.vy = MOVE.jumpV;
      this.grounded = false;
      this.coyote = 0;
      this.buffer = 0;
      this.jumping = true;
      this.stretch = 1.18;
      this.squash = 0.86;
    }

    if (jumpReleased && this.vy < 0) {
      this.vy *= MOVE.jumpCut;
      this.jumping = false;
    }

    let g: number = MOVE.gravity;
    if (Math.abs(this.vy) < 42) g = MOVE.apexGravity;
    if (down && this.vy > 0) {
      g *= MOVE.fastFall;
      this.fastFell = true;
    }
    this.vy = Math.min(MOVE.maxFall, this.vy + g * dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.lean += ((this.grounded ? this.vx / MOVE.maxRun : this.facing * 0.15) * 0.22 - this.lean) * Math.min(1, dt * 12);
    this.squash += (1 - this.squash) * Math.min(1, dt * 10);
    this.stretch += (1 - this.stretch) * Math.min(1, dt * 10);
    this.landFlash = Math.max(0, this.landFlash - dt * 4);
  }

  land(y: number) {
    const impact = Math.min(1, Math.abs(this.vy) / 900);
    this.y = y;
    this.vy = 0;
    this.grounded = true;
    this.fastFell = false;
    this.squash = 1 - MOVE.landSquash * (0.45 + impact);
    this.stretch = 1 + 0.12 * impact;
    this.landFlash = 0.35 + impact * 0.4;
  }

  bonk() {
    if (this.vy < 0) this.vy = 0;
    this.stretch = 0.9;
  }
}

export function aabb(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function clamp01(v: number) {
  return clamp(v, 0, 1);
}
