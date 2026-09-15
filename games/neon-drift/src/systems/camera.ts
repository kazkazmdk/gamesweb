import { clamp, lerp } from "@gamesweb/game-core";
import { CAMERA } from "../config";
import type { Car } from "./vehicle";

export type Cam = { x: number; y: number; zoom: number; yaw: number };

export function axis(v: number, half: number, world: number) {
  if (world <= half * 2) return world / 2;
  return clamp(v, half, world - half);
}

export function createCam(x: number, y: number): Cam {
  return { x, y, zoom: CAMERA.zoomSlow, yaw: 0 };
}

export function stepCamera(cam: Cam, car: Car, dt: number, viewW: number, viewH: number, worldW: number, worldH: number) {
  const speedT = Math.min(1, car.speed / 615);
  const moveAng = Math.atan2(car.vy, car.vx);
  const lookAng = lerpAngle(car.angle, moveAng, CAMERA.lookBlend * speedT);
  const look = CAMERA.lookBase + car.speed * CAMERA.lookSpeed;
  const ox = Math.cos(lookAng) * look;
  const oy = Math.sin(lookAng) * look;
  const driftSide = Math.sin(car.slip) * car.driftAmount * CAMERA.driftOffset;
  const tx = car.x + ox + Math.cos(car.angle + Math.PI / 2) * driftSide;
  const ty = car.y + oy + Math.sin(car.angle + Math.PI / 2) * driftSide;
  const k = 1 - Math.exp(-dt * CAMERA.follow);
  cam.x += (tx - cam.x) * k;
  cam.y += (ty - cam.y) * k;
  cam.x = axis(cam.x, viewW / (2 * cam.zoom), worldW);
  cam.y = axis(cam.y, viewH / (2 * cam.zoom), worldH);
  const zWant = lerp(CAMERA.zoomSlow, CAMERA.zoomFast, speedT * speedT);
  cam.zoom += (zWant - cam.zoom) * (1 - Math.exp(-dt * 2.4));
  const yawWant = clamp(car.slip * 0.12 * car.driftAmount, -CAMERA.yawMax, CAMERA.yawMax);
  cam.yaw += (yawWant - cam.yaw) * (1 - Math.exp(-dt * 5));
}

function lerpAngle(a: number, b: number, t: number) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
