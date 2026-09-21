import { clamp, lerp } from "@gamesweb/game-core";
import { CAMERA, type CamProfile } from "../config";
import type { Car } from "./vehicle";

export type Cam = { x: number; y: number; zoom: number; yaw: number };

export function axis(v: number, half: number, world: number) {
  if (world <= half * 2) return world / 2;
  return clamp(v, half, world - half);
}

export function createCam(x: number, y: number, profile: CamProfile = CAMERA): Cam {
  return { x, y, zoom: profile.zoomSlow, yaw: 0 };
}

export function stepCamera(
  cam: Cam,
  car: Car,
  dt: number,
  viewW: number,
  viewH: number,
  worldW: number,
  worldH: number,
  profile: CamProfile = CAMERA,
) {
  const speedT = Math.min(1, car.speed / 615);
  const moveAng = Math.atan2(car.vy, car.vx);
  const lookAng = lerpAngle(car.angle, moveAng, profile.lookBlend * speedT);
  const look = profile.lookBase + car.speed * profile.lookSpeed;
  const ox = Math.cos(lookAng) * look;
  const oy = Math.sin(lookAng) * look;
  const driftSide = Math.sin(car.slip) * car.driftAmount * profile.driftOffset;
  const tx = car.x + ox + Math.cos(car.angle + Math.PI / 2) * driftSide;
  const ty = car.y + oy + Math.sin(car.angle + Math.PI / 2) * driftSide;
  const k = 1 - Math.exp(-dt * profile.follow);
  cam.x += (tx - cam.x) * k;
  cam.y += (ty - cam.y) * k;
  cam.x = axis(cam.x, viewW / (2 * cam.zoom), worldW);
  cam.y = axis(cam.y, viewH / (2 * cam.zoom), worldH);
  const zWant = lerp(profile.zoomSlow, profile.zoomFast, speedT * speedT);
  cam.zoom += (zWant - cam.zoom) * (1 - Math.exp(-dt * 2.4));
  const yawWant = clamp(car.slip * 0.12 * car.driftAmount, -profile.yawMax, profile.yawMax);
  cam.yaw += (yawWant - cam.yaw) * (1 - Math.exp(-dt * 5));
}

function lerpAngle(a: number, b: number, t: number) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
