export { Juice, ParticlePool, FloatingTextPool, springScale, audioPitchVariation } from "./juice";
export { publishGwDebug, clearGwDebug, countLongFrame } from "./runtime";
export type { GwDebugState, GwDebugCommands } from "./runtime";
export { createGameKeyboard } from "./keyboard";
export type { GameKeyboard, GameKeyState } from "./keyboard";
export type { Particle, FloatingText } from "./juice";
export { Synth, createSynth } from "./audio";
export type { MixerSettings } from "./audio";
export { pulseHaptic } from "./haptic";
export { hashSeed, mulberry32, seededRng } from "./rng";

export class Pool<T> {
  private free: T[] = [];
  constructor(
    private factory: () => T,
    private reset: (item: T) => void,
    seed = 16,
  ) {
    for (let i = 0; i < seed; i += 1) this.free.push(factory());
  }
  acquire(): T {
    return this.free.pop() ?? this.factory();
  }
  release(item: T) {
    this.reset(item);
    this.free.push(item);
  }
}

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function approach(current: number, target: number, maxDelta: number) {
  if (current < target) return Math.min(current + maxDelta, target);
  return Math.max(current - maxDelta, target);
}
