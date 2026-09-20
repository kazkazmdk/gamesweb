import type { CSSProperties } from "react";

const POSITION: Record<string, Record<string, string>> = {
  "neon-drift": { backdrop: "48% 38%", hero: "48% 40%", tile: "48% 40%" },
  "velocity-run": { backdrop: "40% 32%", hero: "40% 30%", tile: "40% 42%" },
  "swarm-protocol": { backdrop: "56% 46%", hero: "58% 46%", tile: "54% 46%" },
  "sky-stack": { backdrop: "50% 64%", hero: "50% 68%", tile: "50% 68%" },
  "knockout-circuit": { backdrop: "40% 48%", hero: "42% 48%", tile: "36% 50%" },
  "pocket-striker": { backdrop: "32% 58%", hero: "30% 56%", tile: "30% 56%" },
  "territory-rush": { backdrop: "48% 48%", hero: "48% 50%", tile: "48% 50%" },
  "crowd-control": { backdrop: "30% 62%", hero: "32% 64%", tile: "32% 64%" },
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
  alt = "",
}: {
  slug: string;
  className?: string;
  variant?: "hero" | "tile" | "backdrop";
  position?: string;
  priority?: boolean;
  style?: CSSProperties;
  alt?: string;
}) {
  const file = variant === "tile" ? "hero" : variant === "backdrop" ? "backdrop" : "hero";
  const pos = position ?? POSITION[slug]?.[variant] ?? "center";
  const src = JPG.has(slug)
    ? `/art/${slug}-${file}.jpg`
    : `/art/${slug}-${variant === "tile" ? "card" : "hero"}.svg`;
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      fetchPriority={priority ? "high" : "low"}
      loading={priority ? "eager" : "lazy"}
      className={`pointer-events-none h-full w-full object-cover ${className}`}
      style={{ objectPosition: pos, ...style }}
    />
  );
}
