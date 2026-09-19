import type { CSSProperties, ReactNode } from "react";
import { GameArt } from "@/components/game/GameArt";
import { homeStage } from "@/components/home/home-stage";

export function GameBackdrop({
  slug,
  children,
  className = "",
  variant = "backdrop",
  priority = false,
  dim = 0.42,
}: {
  slug: string;
  children?: ReactNode;
  className?: string;
  variant?: "hero" | "tile" | "backdrop";
  priority?: boolean;
  dim?: number;
}) {
  const dir = homeStage(slug);
  return (
    <div className={`gw-stage ${className}`}>
      <div className="absolute inset-0">
        <GameArt
          slug={slug}
          variant={variant}
          priority={priority}
          className="gw-backdrop-art h-full w-full"
          style={
            {
              objectPosition: dir.crop.desktop,
              filter: dir.contrast,
              ["--gw-crop-desktop" as string]: dir.crop.desktop,
              ["--gw-crop-laptop" as string]: dir.crop.laptop,
              ["--gw-crop-mobile" as string]: dir.crop.mobile,
            } as CSSProperties
          }
        />
        <div className="absolute inset-0" style={{ background: dir.leftWash }} />
        <div className="absolute inset-0" style={{ background: dir.bottomWash }} />
        <div className="absolute inset-0 bg-black" style={{ opacity: dim }} />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
