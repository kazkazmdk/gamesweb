import { SCORE } from "../config";

export type SectorSnap = { score: number; timeMs: number };

export function driftGain(opts: {
  slip: number;
  speed: number;
  combo: number;
  near: boolean;
  boost: boolean;
  dt: number;
}): number {
  if (opts.speed < SCORE.minDriftSpeed) return 0;
  const angle = Math.min(SCORE.angleCap, Math.abs(opts.slip) * SCORE.angleGain);
  const spd = Math.min(SCORE.speedCap, opts.speed / SCORE.speedRef);
  let add = angle * spd * SCORE.basePerSec * opts.dt * Math.max(1, opts.combo);
  if (opts.near) add *= SCORE.nearMul;
  if (opts.boost) add *= SCORE.boostMul;
  return add;
}

export class DriftScore {
  total = 0;
  display = 0;
  combo = 1;
  comboHeat = 0;
  bankedThisFrame = 0;
  currentDrift = 0;
  bestDrift = 0;
  bestCombo = 1;
  driftTime = 0;
  driftCount = 0;
  nearMisses = 0;
  perfectGates = 0;
  cleanSectors = 0;
  sectorScore = [0, 0, 0];
  sectorStart = 0;
  lastSector = 0;

  reset() {
    this.total = 0;
    this.display = 0;
    this.combo = 1;
    this.comboHeat = 0;
    this.bankedThisFrame = 0;
    this.currentDrift = 0;
    this.bestDrift = 0;
    this.bestCombo = 1;
    this.driftTime = 0;
    this.driftCount = 0;
    this.nearMisses = 0;
    this.perfectGates = 0;
    this.cleanSectors = 0;
    this.sectorScore = [0, 0, 0];
    this.sectorStart = 0;
    this.lastSector = 0;
  }

  tick(
    dt: number,
    opts: { drifting: boolean; speed: number; slip: number; near: boolean; boost: boolean },
  ) {
    this.bankedThisFrame = 0;
    if (opts.drifting && opts.speed > SCORE.minDriftSpeed) {
      const add = driftGain({
        slip: opts.slip,
        speed: opts.speed,
        combo: this.combo,
        near: opts.near,
        boost: opts.boost,
        dt,
      });
      this.total += add;
      this.bankedThisFrame = add;
      this.currentDrift += add;
      this.driftTime += dt;
      this.comboHeat += dt;
      if (this.comboHeat > SCORE.comboStep) {
        this.combo = Math.min(SCORE.comboMax, this.combo + 1);
        this.comboHeat = 0;
        this.bestCombo = Math.max(this.bestCombo, Math.floor(this.combo));
      }
    } else {
      if (this.currentDrift > 40) this.driftCount += 1;
      this.bestDrift = Math.max(this.bestDrift, this.currentDrift);
      this.currentDrift = 0;
      this.comboHeat = Math.max(0, this.comboHeat - dt * 1.35);
      if (!opts.drifting) this.combo = Math.max(1, this.combo - dt * SCORE.comboDecay);
    }
    this.display += (this.total - this.display) * Math.min(1, dt * 11);
  }

  closeSector(index: number): SectorSnap {
    const score = this.total - this.sectorStart;
    this.sectorScore[index] = score;
    this.sectorStart = this.total;
    return { score, timeMs: 0 };
  }
}
