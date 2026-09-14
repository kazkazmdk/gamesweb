export class DriftScore {
  total = 0;
  display = 0;
  combo = 1;
  comboHeat = 0;
  nearMiss = false;
  bankedThisFrame = 0;

  reset() {
    this.total = 0;
    this.display = 0;
    this.combo = 1;
    this.comboHeat = 0;
    this.bankedThisFrame = 0;
  }

  tick(dt: number, opts: { drifting: boolean; speed: number; slip: number; near: boolean; boost: boolean }) {
    this.bankedThisFrame = 0;
    if (opts.drifting && opts.speed > 140) {
      const angle = Math.min(1.2, Math.abs(opts.slip) * 1.8);
      const spd = Math.min(1.4, opts.speed / 420);
      let add = angle * spd * 920 * dt * this.combo;
      if (opts.near) add *= 1.55;
      if (opts.boost) add *= 1.2;
      this.total += add;
      this.bankedThisFrame = add;
      this.comboHeat += dt;
      if (this.comboHeat > 0.7) {
        this.combo = Math.min(12, this.combo + 1);
        this.comboHeat = 0;
      }
    } else {
      this.comboHeat = Math.max(0, this.comboHeat - dt * 1.4);
      if (!opts.drifting) {
        this.combo = Math.max(1, this.combo - dt * 1.8);
      }
    }
    this.display += (this.total - this.display) * Math.min(1, dt * 10);
  }
}
