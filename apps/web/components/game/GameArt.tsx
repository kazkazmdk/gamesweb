import type { CSSProperties } from "react";

const POSITION: Record<string, Record<string, string>> = {
  "neon-drift": { backdrop: "48% 52%", hero: "46% 58%", tile: "46% 58%" },
  "velocity-run": { backdrop: "22% 68%", hero: "18% 70%", tile: "20% 68%" },
  "swarm-protocol": { backdrop: "92% 42%", hero: "70% 50%", tile: "60% 48%" },
  "sky-stack": { backdrop: "50% 62%", hero: "48% 68%", tile: "50% 70%" },
  "knockout-circuit": { backdrop: "28% 72%", hero: "22% 74%", tile: "30% 72%" },
  "pocket-striker": { backdrop: "50% 48%", hero: "38% 42%", tile: "42% 45%" },
  "territory-rush": { backdrop: "42% 58%", hero: "36% 62%", tile: "40% 58%" },
  "crowd-control": { backdrop: "50% 58%", hero: "55% 62%", tile: "50% 55%" },
};

const JPG = new Set([
  "neon-drift",
  "velocity-run",
  "swarm-protocol",
  "sky-stack",
  "knockout-circuit",
  "pocket-striker",
  "territory-rush",
  "crowd-control",
]);

export function GameArt({
  slug,
  className = "",
  variant = "hero",
  position,
  priority = false,
  style,
}: {
  slug: string;
  className?: string;
  variant?: "hero" | "tile" | "backdrop";
  position?: string;
  priority?: boolean;
  style?: CSSProperties;
}) {
  const file = variant === "tile" ? "hero" : variant === "backdrop" ? "backdrop" : "hero";
  const pos = position ?? POSITION[slug]?.[variant] ?? "center";
  const src = JPG.has(slug)
    ? `/art/${slug}-${file}.jpg`
    : `/art/${slug}-${variant === "tile" ? "card" : "hero"}.svg`;
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      fetchPriority={priority ? "high" : "low"}
      loading={priority ? "eager" : "lazy"}
      className={`pointer-events-none h-full w-full object-cover ${className}`}
      style={{ objectPosition: pos, ...style }}
    />
  );
}
