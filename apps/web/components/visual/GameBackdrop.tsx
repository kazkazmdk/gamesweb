import type { ReactNode } from "react";
import { homeStage } from "@/components/home/home-stage";
import { PlatformScene } from "./PlatformScene";
import { SceneEnrichment } from "./SceneEnrichment";

export function GameBackdrop({
  slug,
  children,
  className = "",
  variant: _variant = "backdrop",
  priority: _priority = false,
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
        <PlatformScene slug={slug} className="gw-art-drift h-full w-full" />
        <SceneEnrichment slug={slug} />
        <div className="absolute inset-0" style={{ background: dir.leftWash }} />
        <div className="absolute inset-0" style={{ background: dir.bottomWash }} />
        <div className="gw-atmosphere" aria-hidden />
        <div className="gw-vignette" aria-hidden />
        <div className="gw-stage-grain" aria-hidden />
        <div className="absolute inset-0 bg-black" style={{ opacity: dim }} />
        <div className="gw-inner-edge" aria-hidden />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
