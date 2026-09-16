const POSITION: Record<string, Record<string, string>> = {
  "neon-drift": { backdrop: "58% 52%", hero: "46% 58%", tile: "52% 54%" },
  "velocity-run": { backdrop: "22% 68%", hero: "18% 70%", tile: "20% 68%" },
  "swarm-protocol": { backdrop: "82% 58%", hero: "88% 62%", tile: "84% 58%" },
};

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
  return (
    <img
      src={`/art/${slug}-${file}.jpg`}
      alt=""
      draggable={false}
      className={`pointer-events-none h-full w-full object-cover ${className}`}
      style={{ objectPosition: pos }}
    />
  );
}
