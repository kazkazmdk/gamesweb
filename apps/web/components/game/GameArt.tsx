const POSITION: Record<string, Record<string, string>> = {
  "neon-drift": { backdrop: "48% 52%", hero: "46% 58%", tile: "46% 58%" },
  "velocity-run": { backdrop: "22% 68%", hero: "18% 70%", tile: "20% 68%" },
  "swarm-protocol": { backdrop: "92% 42%", hero: "70% 50%", tile: "60% 48%" },
  "sky-stack": { backdrop: "50% 20%", hero: "50% 30%", tile: "50% 35%" },
  "knockout-circuit": { backdrop: "40% 60%", hero: "45% 55%", tile: "50% 50%" },
  "pocket-striker": { backdrop: "50% 50%", hero: "50% 50%", tile: "50% 50%" },
  "territory-rush": { backdrop: "50% 50%", hero: "50% 50%", tile: "50% 50%" },
  "crowd-control": { backdrop: "50% 70%", hero: "50% 60%", tile: "50% 55%" },
};

const JPG = new Set(["neon-drift", "velocity-run", "swarm-protocol"]);

export function GameArt({
  slug,
  className = "",
  variant = "hero",
}: {
  slug: string;
  className?: string;
  variant?: "hero" | "tile" | "backdrop";
}) {
  const file = variant === "tile" ? "hero" : variant === "backdrop" ? "backdrop" : "hero";
  const pos = POSITION[slug]?.[variant] ?? "center";
  const src = JPG.has(slug)
    ? `/art/${slug}-${file}.jpg`
    : `/art/${slug}-${variant === "tile" ? "card" : "hero"}.svg`;
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      className={`pointer-events-none h-full w-full object-cover ${className}`}
      style={{ objectPosition: pos }}
    />
  );
}
