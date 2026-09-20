export type GwDebugState = {
  gameId: string;
  ready: boolean;
  runState: "boot" | "playing" | "paused" | "ended" | "choosing";
  playerX: number;
  playerY: number;
  playerAngle?: number;
  score: number;
  paused: boolean;
  fps?: number;
  longFrames?: number;
  deaths?: number;
  sessionDeaths?: number;
  timeMs?: number;
  kills?: number;
  level?: number;
  trackId?: string;
  courseId?: string;
  combo?: number;
  speed?: number;
  throttle?: number;
  frozen?: boolean;
  tick?: number;
  scene?: string;
  ended?: boolean;
  canvasW?: number;
  canvasH?: number;
  inputSource?: string;
  lateral?: number;
  headingError?: number;
  surface?: string;
  drifting?: boolean;
  lookError?: number;
  contentId?: string;
  laps?: number;
  boss?: string;
};

export type GwDebugCommands = {
  pickUpgrade?: (index: number) => void;
  grantXp?: (amount: number) => void;
  killPlayer?: () => void;
  finishRun?: () => void;
  setDrive?: (throttle: number, steer: number) => void;
  jump?: () => void;
  hideHud?: () => void;
  setPack?: (n: number) => void;
  stackTo?: (n: number) => void;
  exposeTrail?: () => void;
  closeLoop?: () => void;
  seekGate?: () => void;
  seedPeak?: () => void;
  setCourse?: (id: string) => void;
};

type GwDebugWindow = Window & {
  __GW_DEBUG__?: GwDebugState;
  __GW_DEBUG_CMD__?: GwDebugCommands;
};

function debugWindow(): GwDebugWindow | null {
  if (typeof window === "undefined") return null;
  const w = window as GwDebugWindow & { __GW_ALLOW_DEBUG__?: boolean };
  if (w.__GW_ALLOW_DEBUG__) return w;
  const host = window.location.hostname;
  const local = host === "localhost" || host === "127.0.0.1" || host === "::1";
  if (local) return w;
  if (process.env.NODE_ENV === "production") return null;
  return w;
}

export function publishGwDebug(state: GwDebugState, commands?: GwDebugCommands) {
  const w = debugWindow();
  if (!w) return;
  w.__GW_DEBUG__ = state;
  if (commands) w.__GW_DEBUG_CMD__ = commands;
}

export function clearGwDebug() {
  const w = debugWindow();
  if (!w) return;
  delete w.__GW_DEBUG__;
  delete w.__GW_DEBUG_CMD__;
}

export function countLongFrame(dtMs: number, current: number) {
  return dtMs > 22 ? current + 1 : current;
}
