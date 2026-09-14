import { approach, clamp } from "@gamesweb/game-core";

export const MOVE = {
  maxRun: 310,
  accel: 2800,
  decel: 3200,
  airAccel: 1750,
  airDecel: 800,
  gravity: 2150,
  apexGravity: 1350,
  jumpV: -690,
  coyoteMs: 100,
  bufferMs: 130,
  fastFall: 1.75,
  maxFall: 980,
  jumpCut: 0.42,
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
    }

    if (jumpReleased && this.vy < 0) {
      this.vy *= MOVE.jumpCut;
      this.jumping = false;
    }

    let g: number = MOVE.gravity;
    if (Math.abs(this.vy) < 40) g = MOVE.apexGravity;
    if (down && this.vy > 0) {
      g *= MOVE.fastFall;
      this.fastFell = true;
    }
    this.vy = Math.min(MOVE.maxFall, this.vy + g * dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  land(y: number) {
    this.y = y;
    this.vy = 0;
    this.grounded = true;
  }

  bonk() {
    if (this.vy < 0) this.vy = 0;
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
