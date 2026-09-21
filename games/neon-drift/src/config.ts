export const NEON = {
  lapsToFinish: 2,
  runTimeoutMs: 150_000,
  ghostHz: 12,
  ghostKey: "gw:neon-ghost",
  trackKey: "gw:neon-track",
  tutorialKey: "gw:neon-tutorial-v2",
  ghostToggleKey: "gw:neon-ghost-on",
  sectorCount: 3,
} as const;

export const VEHICLE = {
  acceleration: 980,
  maxSpeed: 615,
  brakeForce: 1220,
  reverseSpeed: 155,
  steeringRate: 2.48,
  highSpeedSteer: 1.28,
  grip: 9.6,
  driftGrip: 2.62,
  handbrakeGrip: 0.36,
  counterSteerGrip: 5.1,
  angularDamping: 5.6,
  yawFromSlip: 0.00165,
  handbrakeYaw: 3.05,
  yawClamp: 4.0,
  driftEnter: 0.15,
  driftFull: 0.54,
  minDriftSpeed: 122,
  wallRestitution: 0.2,
  weightAccel: 0.9,
  weightBrake: 0.7,
  coastDrag: 1.42,
  throttleDrag: 0.3,
  touchSteerAssist: 0.16,
} as const;

export type CamProfile = {
  follow: number;
  lookBlend: number;
  lookBase: number;
  lookSpeed: number;
  zoomSlow: number;
  zoomFast: number;
  driftOffset: number;
  yawMax: number;
};

export const CAMERA: CamProfile = {
  follow: 6.2,
  lookBlend: 0.55,
  lookBase: 48,
  lookSpeed: 0.17,
  zoomSlow: 1.3,
  zoomFast: 1.07,
  driftOffset: 14,
  yawMax: 0.035,
};

export const CAMERA_BY_TRACK: Record<"foundation" | "technical" | "velocity", CamProfile> = {
  foundation: {
    follow: 5.1,
    lookBlend: 0.4,
    lookBase: 92,
    lookSpeed: 0.21,
    zoomSlow: 1.02,
    zoomFast: 0.86,
    driftOffset: 10,
    yawMax: 0.018,
  },
  technical: {
    follow: 8.1,
    lookBlend: 0.68,
    lookBase: 18,
    lookSpeed: 0.07,
    zoomSlow: 1.68,
    zoomFast: 1.42,
    driftOffset: 7,
    yawMax: 0.055,
  },
  velocity: {
    follow: 4.4,
    lookBlend: 0.32,
    lookBase: 128,
    lookSpeed: 0.28,
    zoomSlow: 0.82,
    zoomFast: 0.68,
    driftOffset: 20,
    yawMax: 0.012,
  },
};

export const SCORE = {
  basePerSec: 860,
  angleGain: 1.7,
  angleCap: 1.45,
  speedRef: 390,
  speedCap: 1.48,
  nearMul: 1.48,
  boostMul: 1.18,
  comboStep: 0.62,
  comboMax: 12,
  comboDecay: 1.55,
  minDriftSpeed: 128,
} as const;
