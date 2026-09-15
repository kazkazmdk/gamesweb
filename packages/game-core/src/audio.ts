export type MixerSettings = {
  master: number;
  music: number;
  sfx: number;
  muted: boolean;
};

const DEFAULT: MixerSettings = { master: 0.8, music: 0.45, sfx: 0.7, muted: false };

export class Synth {
  ctx: AudioContext | null = null;
  settings: MixerSettings = { ...DEFAULT };
  private master: GainNode | null = null;
  private sfx: GainNode | null = null;
  private music: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private lastHitAt = 0;
  private engine: { osc: OscillatorNode; gain: GainNode; lfo: OscillatorNode } | null = null;
  private skidVoice: { src: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode } | null = null;

  async resume() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.sfx = this.ctx.createGain();
      this.music = this.ctx.createGain();
      this.sfx.connect(this.master);
      this.music.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.apply();
      this.noise = this.makeNoise();
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }

  setSettings(next: Partial<MixerSettings>) {
    this.settings = { ...this.settings, ...next };
    this.apply();
  }

  private apply() {
    if (!this.master || !this.sfx || !this.music) return;
    const mute = this.settings.muted ? 0 : 1;
    this.master.gain.value = this.settings.master * mute;
    this.sfx.gain.value = this.settings.sfx;
    this.music.gain.value = this.settings.music;
  }

  private makeNoise() {
    if (!this.ctx) return null;
    const len = this.ctx.sampleRate * 1.2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  tone(freq: number, dur = 0.08, type: OscillatorType = "square", gain = 0.08, pitchVar = 0.06) {
    if (!this.ctx || !this.sfx || this.settings.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq * (1 - pitchVar + Math.random() * pitchVar * 2);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.sfx);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  noiseBurst(dur = 0.12, gain = 0.05, freq = 900) {
    if (!this.ctx || !this.sfx || !this.noise || this.settings.muted) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfx);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  uiClick() {
    this.tone(520, 0.05, "triangle", 0.04, 0.02);
  }

  uiConfirm() {
    this.tone(660, 0.07, "triangle", 0.05);
    this.tone(880, 0.09, "triangle", 0.03);
  }

  hit(nowMs: number) {
    if (nowMs - this.lastHitAt < 40) return;
    this.lastHitAt = nowMs;
    this.noiseBurst(0.07, 0.06, 700);
    this.tone(180, 0.06, "sawtooth", 0.04, 0.12);
  }

  pickup() {
    this.tone(880, 0.06, "sine", 0.05, 0.04);
  }

  levelUp() {
    this.tone(523, 0.1, "triangle", 0.06);
    this.tone(659, 0.14, "triangle", 0.05);
    this.tone(784, 0.18, "triangle", 0.04);
  }

  crash(intensity = 1) {
    const k = Math.max(0.35, Math.min(1.4, intensity));
    this.noiseBurst(0.22 + k * 0.12, 0.07 * k, 180 + k * 80);
    this.tone(86 * (0.92 + Math.random() * 0.16), 0.2, "sawtooth", 0.05 * k, 0.22);
  }

  impact(speedN: number) {
    const k = Math.max(0.2, Math.min(1, speedN));
    this.noiseBurst(0.09 + k * 0.1, 0.04 + k * 0.07, 260 + k * 420);
    this.tone(120 + Math.random() * 40, 0.08, "square", 0.03 * k, 0.18);
  }

  skid(amount: number) {
    this.setSkid(amount);
  }

  private ensureSkid() {
    if (this.skidVoice || !this.ctx || !this.sfx || !this.noise) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 3.6;
    filter.frequency.value = 1280;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.0001;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfx);
    src.start();
    this.skidVoice = { src, filter, gain };
  }

  setSkid(amount: number) {
    this.ensureSkid();
    if (!this.skidVoice || !this.ctx) return;
    const a = Math.max(0, Math.min(1, amount));
    const vol = this.settings.muted ? 0 : a * a * 0.058;
    this.skidVoice.gain.gain.setTargetAtTime(Math.max(0.0001, vol), this.ctx.currentTime, 0.06);
    this.skidVoice.filter.frequency.setTargetAtTime(980 + a * 820, this.ctx.currentTime, 0.08);
  }

  boostWhoosh() {
    this.noiseBurst(0.16, 0.045, 700);
    this.tone(240, 0.12, "sine", 0.03, 0.1);
  }

  gateChime() {
    this.tone(720 + Math.random() * 40, 0.07, "triangle", 0.04, 0.04);
    this.tone(960, 0.1, "sine", 0.025, 0.03);
  }

  comboSting(combo: number) {
    const n = Math.min(12, Math.max(1, combo));
    this.tone(420 + n * 42, 0.07, "triangle", 0.035, 0.05);
  }

  personalBest() {
    this.tone(523, 0.12, "triangle", 0.05);
    this.tone(659, 0.16, "triangle", 0.04);
    this.tone(784, 0.22, "sine", 0.035);
  }

  finishSting() {
    this.tone(392, 0.1, "triangle", 0.045);
    this.tone(523, 0.16, "triangle", 0.04);
    this.tone(784, 0.22, "sine", 0.03);
  }

  startEngine() {
    if (!this.ctx || !this.sfx || this.engine) return;
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 70;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 28;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 7;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    const gain = this.ctx.createGain();
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(this.sfx);
    osc.start();
    lfo.start();
    this.engine = { osc, gain, lfo };
  }

  engineRpm(normalized: number, throttle = 0) {
    if (!this.engine || !this.ctx) return;
    const n = Math.max(0, Math.min(1, normalized));
    const thr = Math.max(0, Math.min(1, throttle));
    const rpm = 64 + n * 158 + thr * 38;
    this.engine.osc.frequency.setTargetAtTime(rpm, this.ctx.currentTime, 0.045);
    const vol = this.settings.muted ? 0 : 0.011 + n * 0.028 + thr * 0.012;
    this.engine.gain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.07);
  }

  stopEngine() {
    if (this.engine) {
      try {
        this.engine.osc.stop();
        this.engine.lfo.stop();
      } catch {
        /* already stopped */
      }
      this.engine = null;
    }
    this.setSkid(0);
  }

  startBed(kind: "drift" | "run" | "swarm") {
    if (!this.ctx || !this.music || this.settings.muted) return;
    const t = this.ctx.currentTime;
    const base = kind === "drift" ? 110 : kind === "run" ? 146 : 98;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = base;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.04, t + 1.2);
    osc.connect(g);
    g.connect(this.music);
    osc.start(t);
    const fifth = this.ctx.createOscillator();
    fifth.type = "triangle";
    fifth.frequency.value = base * 1.5;
    const g2 = this.ctx.createGain();
    g2.gain.value = 0.018;
    fifth.connect(g2);
    g2.connect(this.music);
    fifth.start(t);
    this.beds.push({ osc, fifth, g, g2 });
  }

  private beds: Array<{ osc: OscillatorNode; fifth: OscillatorNode; g: GainNode; g2: GainNode }> = [];

  stopBed() {
    const t = this.ctx?.currentTime ?? 0;
    for (const b of this.beds) {
      try {
        b.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
        b.osc.stop(t + 0.4);
        b.fifth.stop(t + 0.4);
      } catch {
        /* noop */
      }
    }
    this.beds = [];
  }

  dispose() {
    this.stopEngine();
    this.stopBed();
    if (this.skidVoice) {
      try {
        this.skidVoice.src.stop();
      } catch {
        /* noop */
      }
      this.skidVoice = null;
    }
  }
}

export function createSynth() {
  return new Synth();
}
