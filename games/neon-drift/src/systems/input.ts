import type Phaser from "phaser";
import { clamp } from "@gamesweb/game-core";

export type DriveInput = {
  steer: number;
  throttle: number;
  handbrake: boolean;
  touch: boolean;
};

export function readDriveInput(
  keys: Record<string, Phaser.Input.Keyboard.Key>,
  input: Phaser.Input.InputPlugin,
  w: number,
  h: number,
): DriveInput {
  const pointers = [input.activePointer, input.pointer1, input.pointer2];
  const touch = pointers.some((p) => p.wasTouch);
  let steer =
    Number(keys.right.isDown || keys.right2.isDown) - Number(keys.left.isDown || keys.left2.isDown);
  let throttle = 0;
  if (keys.up.isDown || keys.up2.isDown) throttle = 1;
  else if (keys.down.isDown || keys.down2.isDown) throttle = -1;
  let handbrake = keys.space.isDown;

  if (touch) {
    throttle = 1;
    steer = 0;
    handbrake = false;
    for (const p of pointers) {
      if (!p.isDown) continue;
      const brakeZone = p.y > h * 0.72 && p.x > w * 0.32 && p.x < w * 0.68;
      if (brakeZone) {
        handbrake = true;
        continue;
      }
      if (p.x < w * 0.5) steer = -clamp((w * 0.42 - p.x) / (w * 0.32), 0, 1);
      else steer = clamp((p.x - w * 0.58) / (w * 0.32), 0, 1);
    }
  }

  return { steer, throttle, handbrake, touch };
}
