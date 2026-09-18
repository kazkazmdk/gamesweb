export type HomeStageDir = {
  crop: { desktop: string; laptop: string; mobile: string };
  scale: number;
  glow: string;
  glowX: string;
  glowY: string;
  wash: string;
  contrast: string;
};

export const HOME_STAGE: Record<string, HomeStageDir> = {
  "neon-drift": {
    crop: { desktop: "52% 46%", laptop: "50% 48%", mobile: "64% 40%" },
    scale: 1.08,
    glow: "#3ec6e8",
    glowX: "72%",
    glowY: "38%",
    wash: "rgba(4, 10, 16, 0.42)",
    contrast: "contrast(1.08) saturate(1.12)",
  },
  "velocity-run": {
    crop: { desktop: "24% 64%", laptop: "22% 66%", mobile: "18% 70%" },
    scale: 1.06,
    glow: "#3ec6e8",
    glowX: "18%",
    glowY: "72%",
    wash: "rgba(6, 16, 22, 0.4)",
    contrast: "contrast(1.06) saturate(1.05)",
  },
  "swarm-protocol": {
    crop: { desktop: "78% 46%", laptop: "74% 48%", mobile: "82% 42%" },
    scale: 1.1,
    glow: "#f07a3a",
    glowX: "78%",
    glowY: "42%",
    wash: "rgba(18, 8, 8, 0.46)",
    contrast: "contrast(1.1) saturate(1.15)",
  },
  "sky-stack": {
    crop: { desktop: "50% 28%", laptop: "50% 32%", mobile: "50% 22%" },
    scale: 1.04,
    glow: "#9fd6ff",
    glowX: "50%",
    glowY: "18%",
    wash: "rgba(8, 18, 28, 0.28)",
    contrast: "contrast(1.04) saturate(1.08) brightness(1.06)",
  },
  "knockout-circuit": {
    crop: { desktop: "26% 70%", laptop: "24% 72%", mobile: "30% 68%" },
    scale: 1.07,
    glow: "#e8b86a",
    glowX: "22%",
    glowY: "70%",
    wash: "rgba(10, 10, 12, 0.44)",
    contrast: "contrast(1.08) saturate(1.04)",
  },
  "pocket-striker": {
    crop: { desktop: "44% 46%", laptop: "42% 48%", mobile: "40% 44%" },
    scale: 1.05,
    glow: "#9ee0a4",
    glowX: "42%",
    glowY: "48%",
    wash: "rgba(8, 16, 12, 0.36)",
    contrast: "contrast(1.05) saturate(1.1)",
  },
  "territory-rush": {
    crop: { desktop: "40% 54%", laptop: "38% 56%", mobile: "36% 52%" },
    scale: 1.08,
    glow: "#ff8ad4",
    glowX: "62%",
    glowY: "46%",
    wash: "rgba(16, 8, 14, 0.44)",
    contrast: "contrast(1.08) saturate(1.12)",
  },
  "crowd-control": {
    crop: { desktop: "48% 56%", laptop: "50% 58%", mobile: "52% 52%" },
    scale: 1.07,
    glow: "#e07a4a",
    glowX: "54%",
    glowY: "58%",
    wash: "rgba(16, 8, 6, 0.42)",
    contrast: "contrast(1.06) saturate(1.08)",
  },
};

export function homeStage(slug: string): HomeStageDir {
  return HOME_STAGE[slug] ?? HOME_STAGE["neon-drift"];
}
