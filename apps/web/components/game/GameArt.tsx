import type { CSSProperties } from "react";

const POSITION: Record<string, Record<string, string>> = {
  "neon-drift": { backdrop: "50% 40%", hero: "48% 42%", tile: "48% 40%" },
  "velocity-run": { backdrop: "24% 70%", hero: "20% 72%", tile: "22% 72%" },
  "swarm-protocol": { backdrop: "50% 48%", hero: "50% 48%", tile: "50% 48%" },
  "sky-stack": { backdrop: "48% 74%", hero: "50% 76%", tile: "50% 78%" },
  "knockout-circuit": { backdrop: "22% 60%", hero: "20% 62%", tile: "20% 62%" },
  "pocket-striker": { backdrop: "30% 62%", hero: "28% 58%", tile: "28% 58%" },
  "territory-rush": { backdrop: "46% 48%", hero: "44% 50%", tile: "48% 50%" },
  "crowd-control": { backdrop: "50% 42%", hero: "50% 40%", tile: "50% 40%" },
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
