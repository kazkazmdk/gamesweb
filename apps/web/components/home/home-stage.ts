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
    crop: { desktop: "22% 68%", laptop: "20% 70%", mobile: "16% 72%" },
    tile: "22% 70%",
    scale: { desktop: 1.22, mobile: 1.14 },
    lift: "-10%",
    glow: "#3ec6e8",
    glowX: "18%",
    glowY: "62%",
    glowSize: "64% 44%",
    wash: "rgba(4, 12, 20, 0.12)",
    leftWash: "linear-gradient(90deg, rgba(0,0,0,.48) 0%, rgba(0,0,0,.12) 38%, transparent 66%)",
    bottomWash: "linear-gradient(0deg, rgba(0,0,0,.8) 0%, rgba(0,0,0,.2) 58%, transparent 100%)",
    contrast: "contrast(1.06) saturate(1.08)",
    bloom: 1.08,
    vignette: 0.18,
    travel: 1,
  },
  "swarm-protocol": {
    family: "arena",
    copy: "offset",
    crop: { desktop: "38% 28%", laptop: "36% 26%", mobile: "40% 24%" },
    tile: "40% 30%",
    scale: { desktop: 1.18, mobile: 1.12 },
    lift: "4%",
    glow: "#ff7a2e",
    glowX: "50%",
    glowY: "48%",
    glowSize: "86% 70%",
    wash: "rgba(18, 5, 3, 0.18)",
    leftWash: "linear-gradient(90deg, rgba(0,0,0,.4) 0%, transparent 46%)",
    bottomWash: "linear-gradient(0deg, rgba(0,0,0,.78) 0%, rgba(0,0,0,.18) 50%, transparent 100%)",
    contrast: "contrast(1.08) saturate(1.12)",
    bloom: 1.22,
    vignette: 0.38,
    travel: 0,
  },
  "sky-stack": {
    family: "vertical",
    copy: "low",
    crop: { desktop: "50% 64%", laptop: "50% 66%", mobile: "50% 62%" },
    tile: "50% 68%",
    scale: { desktop: 1.08, mobile: 1.06 },
    lift: "-6%",
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
    crop: { desktop: "22% 52%", laptop: "20% 54%", mobile: "18% 56%" },
    tile: "20% 54%",
    scale: { desktop: 1.14, mobile: 1.1 },
    lift: "-6%",
    glow: "#ffb703",
    glowX: "16%",
    glowY: "56%",
    glowSize: "58% 42%",
    wash: "rgba(10, 8, 4, 0.18)",
    leftWash: "linear-gradient(90deg, rgba(0,0,0,.5) 0%, rgba(0,0,0,.14) 40%, transparent 68%)",
    bottomWash: "linear-gradient(0deg, rgba(0,0,0,.8) 0%, rgba(0,0,0,.2) 56%, transparent 100%)",
    contrast: "contrast(1.06) saturate(1.06)",
    bloom: 1.06,
    vignette: 0.2,
    travel: 1,
  },
  "pocket-striker": {
    family: "diorama",
    copy: "left",
    crop: { desktop: "32% 58%", laptop: "30% 60%", mobile: "28% 56%" },
    tile: "30% 56%",
    scale: { desktop: 1.1, mobile: 1.06 },
    lift: "-6%",
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
    copy: "low",
    crop: { desktop: "30% 62%", laptop: "28% 64%", mobile: "26% 66%" },
    tile: "32% 64%",
    scale: { desktop: 1.12, mobile: 1.08 },
    lift: "-2%",
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
