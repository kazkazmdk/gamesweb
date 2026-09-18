export type HomeStageDir = {
  crop: { desktop: string; laptop: string; mobile: string };
  tile: string;
  scale: { desktop: number; mobile: number };
  lift: string;
  glow: string;
  glowX: string;
  glowY: string;
  glowSize: string;
  wash: string;
  contrast: string;
  bloom: number;
};

export const HOME_STAGE: Record<string, HomeStageDir> = {
  "neon-drift": {
    crop: { desktop: "50% 40%", laptop: "48% 42%", mobile: "62% 36%" },
    tile: "48% 40%",
    scale: { desktop: 1.42, mobile: 1.28 },
    lift: "-4%",
    glow: "#5ad4f0",
    glowX: "62%",
    glowY: "36%",
    glowSize: "62% 54%",
    wash: "rgba(3, 8, 14, 0.28)",
    contrast: "contrast(1.12) saturate(1.18) brightness(1.04)",
    bloom: 1.35,
  },
  "velocity-run": {
    crop: { desktop: "24% 70%", laptop: "22% 72%", mobile: "16% 74%" },
    tile: "22% 72%",
    scale: { desktop: 1.62, mobile: 1.4 },
    lift: "-16%",
    glow: "#3ec6e8",
    glowX: "20%",
    glowY: "68%",
    glowSize: "70% 50%",
    wash: "rgba(4, 12, 20, 0.22)",
    contrast: "contrast(1.1) saturate(1.12) brightness(1.06)",
    bloom: 1.2,
  },
  "swarm-protocol": {
    crop: { desktop: "50% 48%", laptop: "50% 50%", mobile: "50% 46%" },
    tile: "50% 48%",
    scale: { desktop: 1.88, mobile: 1.55 },
    lift: "0%",
    glow: "#ff7a2e",
    glowX: "52%",
    glowY: "46%",
    glowSize: "78% 62%",
    wash: "rgba(22, 6, 4, 0.34)",
    contrast: "contrast(1.16) saturate(1.28) brightness(1.08)",
    bloom: 1.45,
  },
  "sky-stack": {
    crop: { desktop: "48% 74%", laptop: "50% 76%", mobile: "50% 70%" },
    tile: "50% 78%",
    scale: { desktop: 1.28, mobile: 1.2 },
    lift: "-12%",
    glow: "#9fd6ff",
    glowX: "48%",
    glowY: "28%",
    glowSize: "80% 56%",
    wash: "rgba(6, 16, 28, 0.12)",
    contrast: "contrast(1.06) saturate(1.1) brightness(1.08)",
    bloom: 1.15,
  },
  "knockout-circuit": {
    crop: { desktop: "22% 60%", laptop: "20% 62%", mobile: "18% 64%" },
    tile: "20% 62%",
    scale: { desktop: 1.5, mobile: 1.32 },
    lift: "-14%",
    glow: "#ffb703",
    glowX: "18%",
    glowY: "58%",
    glowSize: "64% 48%",
    wash: "rgba(10, 8, 4, 0.32)",
    contrast: "contrast(1.1) saturate(1.08) brightness(1.05)",
    bloom: 1.18,
  },
  "pocket-striker": {
    crop: { desktop: "30% 62%", laptop: "28% 64%", mobile: "26% 60%" },
    tile: "28% 58%",
    scale: { desktop: 1.32, mobile: 1.2 },
    lift: "-10%",
    glow: "#9ee0a4",
    glowX: "28%",
    glowY: "58%",
    glowSize: "58% 50%",
    wash: "rgba(8, 14, 10, 0.2)",
    contrast: "contrast(1.08) saturate(1.14) brightness(1.04)",
    bloom: 1.12,
  },
  "territory-rush": {
    crop: { desktop: "46% 48%", laptop: "44% 50%", mobile: "42% 48%" },
    tile: "48% 50%",
    scale: { desktop: 1.16, mobile: 1.1 },
    lift: "-2%",
    glow: "#ff4d6d",
    glowX: "58%",
    glowY: "42%",
    glowSize: "70% 58%",
    wash: "rgba(12, 6, 12, 0.26)",
    contrast: "contrast(1.1) saturate(1.16) brightness(1.04)",
    bloom: 1.22,
  },
  "crowd-control": {
    crop: { desktop: "50% 42%", laptop: "50% 44%", mobile: "50% 40%" },
    tile: "50% 40%",
    scale: { desktop: 1.12, mobile: 1.08 },
    lift: "-6%",
    glow: "#ff7a59",
    glowX: "50%",
    glowY: "18%",
    glowSize: "72% 46%",
    wash: "rgba(14, 6, 4, 0.24)",
    contrast: "contrast(1.08) saturate(1.1) brightness(1.03)",
    bloom: 1.16,
  },
};

export function homeStage(slug: string): HomeStageDir {
  return HOME_STAGE[slug] ?? HOME_STAGE["neon-drift"];
}
