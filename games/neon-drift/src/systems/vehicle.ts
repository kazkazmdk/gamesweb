import { clamp, lerp } from "@gamesweb/game-core";
import { VEHICLE } from "../config";

export type Vec = { x: number; y: number };

export type Surface = "asphalt" | "grass" | "boost";

export const SURFACE: Record<Surface, { grip: number; accel: number; max: number }> = {
  asphalt: { grip: 1, accel: 1, max: 1 },
  grass: { grip: 0.4, accel: 0.58, max: 0.64 },
  boost: { grip: 0.9, accel: 1.38, max: 1.2 },
};

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export class Car {
  x = 0;
  y = 0;
  angle = 0;
  vx = 0;
  vy = 0;
  yawVel = 0;
  drifting = false;
  driftAmount = 0;
  slip = 0;
  surface: Surface = "asphalt";
  handbrake = false;
  throttle = 0;
  steer = 0;
  speed = 0;
  forward = 0;
  lateral = 0;
  brakeLight = 0;
  assist = 0;

  reset(x: number, y: number, angle: number) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.vx = Math.cos(angle) * 70;
    this.vy = Math.sin(angle) * 70;
    this.yawVel = 0;
    this.drifting = false;
    this.driftAmount = 0;
    this.slip = 0;
    this.surface = "asphalt";
    this.handbrake = false;
    this.throttle = 0;
    this.steer = 0;
  }

  step(dt: number) {
    const s = SURFACE[this.surface];
    const c = Math.cos(this.angle);
    const sn = Math.sin(this.angle);
    const accel =
      this.throttle > 0 ? VEHICLE.acceleration * this.throttle * s.accel : VEHICLE.brakeForce * this.throttle;
    this.vx += c * accel * dt;
    this.vy += sn * accel * dt;

    this.forward = this.vx * c + this.vy * sn;
    this.lateral = -this.vx * sn + this.vy * c;
    this.speed = Math.hypot(this.vx, this.vy);
    this.slip = Math.atan2(this.lateral, Math.abs(this.forward) + 16);
    const slipRatio = Math.abs(this.lateral) / (this.speed + 46);
    this.driftAmount = smoothstep(VEHICLE.driftEnter, VEHICLE.driftFull, slipRatio);

    let grip = lerp(VEHICLE.grip, VEHICLE.driftGrip, this.driftAmount) * s.grip;
    if (this.handbrake) grip *= VEHICLE.handbrakeGrip;
    if (this.throttle > 0.55) grip *= VEHICLE.weightAccel;
    if (this.throttle < -0.15) grip *= VEHICLE.weightBrake;

    const counter = this.steer * -Math.sign(this.lateral || 1);
    if (counter > 0.2 && this.driftAmount > 0.1) {
      grip += VEHICLE.counterSteerGrip * counter;
    }

    this.lateral *= Math.exp(-grip * dt);

    const drag = this.throttle === 0 ? VEHICLE.coastDrag : VEHICLE.throttleDrag;
    this.forward -= this.forward * drag * dt;
    const max = VEHICLE.maxSpeed * s.max;
    if (this.forward > max) this.forward = max;
    if (this.forward < -VEHICLE.reverseSpeed) this.forward = -VEHICLE.reverseSpeed;

    this.vx = this.forward * c - this.lateral * sn;
    this.vy = this.forward * sn + this.lateral * c;

    const speedT = Math.min(1, this.speed / VEHICLE.maxSpeed);
    let steerRate = VEHICLE.steeringRate - (VEHICLE.steeringRate - VEHICLE.highSpeedSteer) * speedT * speedT;
    steerRate *= 1 + this.assist;
    const dir = this.forward >= -24 ? 1 : -1;

    this.yawVel += -this.lateral * VEHICLE.yawFromSlip * this.speed * dt;
    if (this.handbrake) this.yawVel += this.steer * VEHICLE.handbrakeYaw * dt;
    this.yawVel *= Math.exp(-VEHICLE.angularDamping * dt);
    this.yawVel = clamp(this.yawVel, -VEHICLE.yawClamp, VEHICLE.yawClamp);

    this.angle += this.steer * steerRate * dir * dt + this.yawVel * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.drifting = this.driftAmount > 0.2 && this.speed > VEHICLE.minDriftSpeed;
    this.brakeLight = this.throttle < -0.2 || this.handbrake ? 1 : this.brakeLight * Math.exp(-dt * 8);
  }

  bounce(nx: number, ny: number, strength: number) {
    const dot = this.vx * nx + this.vy * ny;
    if (dot > 0) return;
    this.vx -= (1 + VEHICLE.wallRestitution) * dot * nx;
    this.vy -= (1 + VEHICLE.wallRestitution) * dot * ny;
    this.yawVel += (Math.random() - 0.5) * 1.4;
    this.x += nx * strength;
    this.y += ny * strength;
  }
}
