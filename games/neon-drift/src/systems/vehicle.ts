export type Vec = { x: number; y: number };

export const VEHICLE = {
  acceleration: 920,
  maxSpeed: 640,
  brakeForce: 1280,
  reverseSpeed: 180,
  steeringRate: 2.85,
  highSpeedSteer: 1.15,
  grip: 10.2,
  driftGrip: 2.15,
  handbrakeGrip: 0.42,
  angularDamping: 7.2,
  lateralFriction: 12.4,
  driftThreshold: 78,
  minDriftSpeed: 140,
  wallRestitution: 0.18,
} as const;

export type Surface = "asphalt" | "grass" | "boost";

export const SURFACE: Record<Surface, { grip: number; accel: number; max: number }> = {
  asphalt: { grip: 1, accel: 1, max: 1 },
  grass: { grip: 0.38, accel: 0.55, max: 0.62 },
  boost: { grip: 0.92, accel: 1.35, max: 1.18 },
};

export class Car {
  x = 0;
  y = 0;
  angle = 0;
  vx = 0;
  vy = 0;
  drifting = false;
  slip = 0;
  surface: Surface = "asphalt";
  handbrake = false;
  throttle = 0;
  steer = 0;
  speed = 0;
  forward = 0;
  lateral = 0;

  reset(x: number, y: number, angle: number) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.vx = Math.cos(angle) * 90;
    this.vy = Math.sin(angle) * 90;
    this.drifting = false;
    this.slip = 0;
    this.surface = "asphalt";
  }

  step(dt: number) {
    const s = SURFACE[this.surface];
    const c = Math.cos(this.angle);
    const sn = Math.sin(this.angle);
    const accel = this.throttle > 0 ? VEHICLE.acceleration * this.throttle * s.accel : VEHICLE.brakeForce * this.throttle;
    this.vx += c * accel * dt;
    this.vy += sn * accel * dt;

    this.forward = this.vx * c + this.vy * sn;
    this.lateral = -this.vx * sn + this.vy * c;
    this.speed = Math.hypot(this.vx, this.vy);
    this.slip = Math.atan2(this.lateral, Math.abs(this.forward) + 12);

    const driftBySlip = Math.abs(this.lateral) > VEHICLE.driftThreshold && this.speed > VEHICLE.minDriftSpeed;
    this.drifting = driftBySlip || (this.handbrake && this.speed > 80);

    let grip = this.drifting ? VEHICLE.driftGrip : VEHICLE.grip;
    grip *= s.grip;
    if (this.handbrake) grip *= VEHICLE.handbrakeGrip;
    const latKill = 1 - Math.exp(-grip * dt);
    this.lateral -= this.lateral * latKill;

    const drag = this.throttle === 0 ? 1.6 : 0.35;
    this.forward -= this.forward * drag * dt;

    const max = VEHICLE.maxSpeed * s.max;
    if (this.forward > max) this.forward = max;
    if (this.forward < -VEHICLE.reverseSpeed) this.forward = -VEHICLE.reverseSpeed;

    this.vx = this.forward * c - this.lateral * sn;
    this.vy = this.forward * sn + this.lateral * c;

    const speedT = Math.min(1, this.speed / VEHICLE.maxSpeed);
    const steerRate = VEHICLE.steeringRate - (VEHICLE.steeringRate - VEHICLE.highSpeedSteer) * speedT * speedT;
    const dir = this.forward >= -20 ? 1 : -1;
    this.angle += this.steer * steerRate * dir * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  bounce(nx: number, ny: number, strength: number) {
    const dot = this.vx * nx + this.vy * ny;
    if (dot > 0) return;
    this.vx -= (1 + VEHICLE.wallRestitution) * dot * nx;
    this.vy -= (1 + VEHICLE.wallRestitution) * dot * ny;
    this.x += nx * strength;
    this.y += ny * strength;
  }
}
