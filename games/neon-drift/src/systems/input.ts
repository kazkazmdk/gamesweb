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
  const pointers = [input.activePointer, input.pointer1, input.pointer2].filter(
    (p): p is Phaser.Input.Pointer => Boolean(p),
  );
  const touch = pointers.some((p) => p.isDown && p.wasTouch);
  let steer =
    Number(Boolean(keys.right?.isDown || keys.right2?.isDown)) -
    Number(Boolean(keys.left?.isDown || keys.left2?.isDown || keys.left3?.isDown));
  let throttle = 0;
  if (keys.up?.isDown || keys.up2?.isDown || keys.up3?.isDown) throttle = 1;
  else if (keys.down?.isDown || keys.down2?.isDown) throttle = -1;
  let handbrake = Boolean(keys.space?.isDown);
  const keyDrive = throttle !== 0 || steer !== 0 || handbrake;

  if (touch && !keyDrive) {
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
