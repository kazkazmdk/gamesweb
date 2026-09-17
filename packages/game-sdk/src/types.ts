export type InputMethod = "keyboard" | "mouse" | "touch" | "gamepad";

export type GameOrientation = "landscape" | "portrait" | "either";

export type SocialMode = "solo" | "async-duel" | "ghost-race" | "party" | "daily" | "grand-prix";

export type ChallengeType =
  | "beat-score"
  | "beat-time"
  | "beat-ghost"
  | "survive-longer"
  | "same-seed"
  | "beat-route"
  | "beat-build"
  | "survive-seed";

export type ScoreDirection = "higher" | "lower";

export type VerificationLevel = "practice" | "unverified" | "verified";

export type AchievementDefinition = {
  key: string;
  name: string;
  description: string;
  xp: number;
  hidden?: boolean;
};

export type QuestDefinition = {
  id: string;
  title: string;
  description: string;
  type: "daily" | "weekly" | "platform";
  gameId: string | null;
  stat: string;
  target: number;
  xp: number;
};

export type GameManifest = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  genre: string;
  tags: string[];
  skills: string[];
  accent: string;
  accentSoft: string;
  orientation: GameOrientation;
  inputMethods: InputMethod[];
  thumbnail: string;
  hero: string;
  heroImage?: string;
  heroVideo?: string;
  gameplayStill?: string;
  tileImage?: string;
  backdropImage?: string;
  media?: {
    backdrop?: string;
    tile?: string;
    hero?: string;
  };
  version: string;
  achievements: AchievementDefinition[];
  supportedDevices: Array<"desktop" | "laptop" | "tablet" | "mobile">;
  minPlayers: number;
  maxPlayers: number;
  sessionHint: string;
  sessionDuration: { minSec: number; maxSec: number };
  howToPlay: string[];
  controls: Array<{ input: string; action: string }>;
  faq: Array<{ q: string; a: string }>;
  modes: string[];
  scoreDirection: ScoreDirection;
  socialModes: SocialMode[];
  challengeTypes: ChallengeType[];
  ghostSupport: boolean;
  dailySupport: boolean;
  partySupport: boolean;
  leaderboards: string[];
  assets?: Record<string, string>;
};

export type GameSession = {
  id: string;
  gameId: string;
  startedAt: number;
  endedAt?: number;
  version: string;
};

export type ScorePayload = {
  mode: string;
  score: number;
  metadata: Record<string, number | string | boolean>;
};

export type GameSave = {
  version: string;
  payload: Record<string, unknown>;
};

export type GameTelemetryEvent = {
  name: string;
  props?: Record<string, string | number | boolean | null>;
};

export type PlayerView = {
  id: string;
  isGuest: boolean;
  username: string;
  displayName: string;
  avatar: string;
  level: number;
  xp: number;
  streak: number;
};

export type AudioSettings = {
  master: number;
  music: number;
  sfx: number;
  muted: boolean;
};

export type RunContext = {
  daily: boolean;
  seed?: string;
  challengeCode?: string;
  partyCode?: string;
  grandPrixId?: string;
  endless?: boolean;
  modeIndex?: number;
  ghostKind?: "pb" | "friend" | "rival" | "challenge" | "daily";
};

export type PlatformSDK = {
  init: (opts: { gameId: string; version: string }) => void;
  session: {
    start: () => GameSession;
    end: (result: ScorePayload & { result: string }) => Promise<void>;
  };
  score: {
    submit: (payload: ScorePayload) => Promise<{ personalBest: boolean; previous: number }>;
  };
  achievement: {
    unlock: (key: string) => Promise<boolean>;
  };
  quest: {
    progress: (stat: string, amount: number) => Promise<void>;
  };
  xp: {
    add: (amount: number, reason: string) => Promise<{ level: number; leveledUp: boolean }>;
  };
  save: {
    get: () => Promise<GameSave | null>;
    set: (save: GameSave) => Promise<void>;
  };
  player: {
    get: () => PlayerView;
  };
  leaderboard: {
    get: (mode?: string) => Promise<Array<{ name: string; score: number; isYou: boolean }>>;
  };
  audio: {
    getSettings: () => AudioSettings;
  };
  events: {
    emit: (event: GameTelemetryEvent) => void;
  };
  pause: {
    request: () => void;
  };
  run?: {
    context: () => RunContext;
  };
};
