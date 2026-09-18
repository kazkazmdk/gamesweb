export type StageFamily = "speed" | "arena" | "vertical" | "diorama" | "graphic" | "runner";
export type CopyAnchor = "left" | "low" | "offset";

export type HomeStageDir = {
  family: StageFamily;
  copy: CopyAnchor;
  crop: { desktop: string; laptop: string; mobile: string };
  tile: string;
  scale: { desktop: number; mobile: number };
  lift: string;
  glow: string;
  glowX: string;
  glowY: string;
  glowSize: string;
  wash: string;
  leftWash: string;
  bottomWash: string;
  contrast: string;
  bloom: number;
  vignette: number;
  travel: number;
};

export const HOME_STAGE: Record<string, HomeStageDir> = {
  "neon-drift": {
    family: "speed",
    copy: "left",
    crop: { desktop: "48% 38%", laptop: "46% 40%", mobile: "56% 36%" },
    tile: "48% 40%",
    scale: { desktop: 1.16, mobile: 1.1 },
    lift: "-2%",
    glow: "#5ad4f0",
    glowX: "68%",
    glowY: "38%",
    glowSize: "70% 48%",
    wash: "rgba(3, 8, 14, 0.16)",
    leftWash: "linear-gradient(90deg, rgba(0,0,0,.52) 0%, rgba(0,0,0,.16) 42%, transparent 70%)",
    bottomWash: "linear-gradient(0deg, rgba(0,0,0,.82) 0%, rgba(0,0,0,.22) 55%, transparent 100%)",
    contrast: "contrast(1.08) saturate(1.1)",
    bloom: 1.18,
    vignette: 0.22,
    travel: 1,
  },
  "velocity-run": {
    family: "speed",
    copy: "left",
    crop: { desktop: "40% 30%", laptop: "38% 32%", mobile: "42% 28%" },
    tile: "40% 42%",
    scale: { desktop: 1.12, mobile: 1.08 },
    lift: "2%",
    glow: "#3ec6e8",
    glowX: "48%",
    glowY: "34%",
    glowSize: "58% 40%",
    wash: "rgba(4, 12, 20, 0.1)",
    leftWash: "linear-gradient(90deg, rgba(0,0,0,.34) 0%, rgba(0,0,0,.08) 26%, transparent 50%)",
    bottomWash: "linear-gradient(0deg, rgba(0,0,0,.78) 0%, rgba(0,0,0,.16) 52%, transparent 100%)",
    contrast: "contrast(1.06) saturate(1.08)",
    bloom: 1.06,
    vignette: 0.16,
    travel: 1,
  },
  "swarm-protocol": {
    family: "arena",
    copy: "offset",
    crop: { desktop: "50% 46%", laptop: "48% 48%", mobile: "52% 44%" },
    tile: "52% 46%",
    scale: { desktop: 1.1, mobile: 1.06 },
    lift: "0%",
    glow: "#ff7a2e",
    glowX: "48%",
    glowY: "46%",
    glowSize: "62% 48%",
    wash: "rgba(18, 5, 3, 0.14)",
    leftWash: "linear-gradient(90deg, rgba(0,0,0,.36) 0%, transparent 44%)",
    bottomWash: "linear-gradient(0deg, rgba(0,0,0,.74) 0%, rgba(0,0,0,.14) 48%, transparent 100%)",
    contrast: "contrast(1.08) saturate(1.1)",
    bloom: 1.08,
    vignette: 0.22,
    travel: 0,
  },
  "sky-stack": {
    family: "vertical",
    copy: "left",
    crop: { desktop: "58% 78%", laptop: "56% 80%", mobile: "52% 76%" },
    tile: "50% 68%",
    scale: { desktop: 1.06, mobile: 1.04 },
    lift: "-18%",
    glow: "#9fd6ff",
    glowX: "50%",
    glowY: "22%",
    glowSize: "90% 58%",
    wash: "rgba(6, 16, 28, 0.06)",
    leftWash: "linear-gradient(90deg, rgba(0,0,0,.36) 0%, transparent 50%)",
    bottomWash: "linear-gradient(0deg, rgba(0,0,0,.72) 0%, rgba(0,0,0,.12) 60%, transparent 100%)",
    contrast: "contrast(1.04) saturate(1.06) brightness(1.04)",
    bloom: 1.04,
    vignette: 0.1,
    travel: 0,
  },
  "knockout-circuit": {
    family: "runner",
    copy: "left",
    crop: { desktop: "42% 48%", laptop: "40% 50%", mobile: "38% 52%" },
    tile: "36% 50%",
    scale: { desktop: 1.12, mobile: 1.08 },
    lift: "-2%",
    glow: "#ffb703",
    glowX: "38%",
    glowY: "42%",
    glowSize: "58% 42%",
    wash: "rgba(10, 8, 4, 0.18)",
    leftWash: "linear-gradient(90deg, rgba(0,0,0,.4) 0%, rgba(0,0,0,.1) 30%, transparent 56%)",
    bottomWash: "linear-gradient(0deg, rgba(0,0,0,.8) 0%, rgba(0,0,0,.2) 56%, transparent 100%)",
    contrast: "contrast(1.06) saturate(1.06)",
    bloom: 1.06,
    vignette: 0.2,
    travel: 1,
  },
  "pocket-striker": {
    family: "diorama",
    copy: "left",
    crop: { desktop: "56% 52%", laptop: "54% 54%", mobile: "50% 50%" },
    tile: "30% 56%",
    scale: { desktop: 1.1, mobile: 1.06 },
    lift: "-8%",
    glow: "#9ee0a4",
    glowX: "30%",
    glowY: "56%",
    glowSize: "50% 42%",
    wash: "rgba(8, 14, 10, 0.1)",
    leftWash: "linear-gradient(90deg, rgba(0,0,0,.42) 0%, transparent 48%)",
    bottomWash: "linear-gradient(0deg, rgba(0,0,0,.74) 0%, rgba(0,0,0,.16) 52%, transparent 100%)",
    contrast: "contrast(1.05) saturate(1.08)",
    bloom: 0.7,
    vignette: 0.28,
    travel: 0,
  },
  "territory-rush": {
    family: "graphic",
    copy: "left",
    crop: { desktop: "48% 48%", laptop: "46% 50%", mobile: "44% 48%" },
    tile: "48% 50%",
    scale: { desktop: 1.04, mobile: 1.02 },
    lift: "0%",
    glow: "#ff4d6d",
    glowX: "58%",
    glowY: "40%",
    glowSize: "62% 50%",
    wash: "rgba(12, 6, 12, 0.1)",
    leftWash: "linear-gradient(90deg, rgba(0,0,0,.44) 0%, transparent 46%)",
    bottomWash: "linear-gradient(0deg, rgba(0,0,0,.76) 0%, rgba(0,0,0,.14) 54%, transparent 100%)",
    contrast: "contrast(1.06) saturate(1.1)",
    bloom: 0,
    vignette: 0.16,
    travel: 0,
  },
  "crowd-control": {
    family: "runner",
    copy: "left",
    crop: { desktop: "26% 80%", laptop: "24% 82%", mobile: "22% 84%" },
    tile: "32% 64%",
    scale: { desktop: 1.18, mobile: 1.12 },
    lift: "-20%",
    glow: "#ff7a59",
    glowX: "50%",
    glowY: "16%",
    glowSize: "74% 40%",
    wash: "rgba(14, 6, 4, 0.12)",
    leftWash: "linear-gradient(90deg, rgba(0,0,0,.4) 0%, transparent 48%)",
    bottomWash: "linear-gradient(0deg, rgba(0,0,0,.78) 0%, rgba(0,0,0,.16) 52%, transparent 100%)",
    contrast: "contrast(1.05) saturate(1.06)",
    bloom: 1.05,
    vignette: 0.2,
    travel: 1,
  },
};

export function homeStage(slug: string): HomeStageDir {
  return HOME_STAGE[slug] ?? HOME_STAGE["neon-drift"];
}

/** Intentional home/event labels. Never derive these with title.split(" ")[0]. */
export const HOME_GAME_LABEL: Record<string, string> = {
  "neon-drift": "Neon Drift",
  "velocity-run": "Velocity Run",
  "swarm-protocol": "Swarm Protocol",
  "sky-stack": "Sky Stack",
  "knockout-circuit": "Knockout Circuit",
  "pocket-striker": "Pocket Striker",
  "territory-rush": "Territory Rush",
  "crowd-control": "Crowd Control",
};

export function homeGameLabel(slug: string, title?: string) {
  return HOME_GAME_LABEL[slug] ?? title ?? slug;
}
