"use client";

import { analytics } from "@gamesweb/analytics";
import { useEffect } from "react";

export function SeoLandingView({ path, kind }: { path: string; kind: string }) {
  useEffect(() => {
    analytics.track("seo_landing_view", { path, kind });
  }, [path, kind]);
  return null;
}

export function TrackedLink({
  href,
  event,
  props,
  className,
  children,
}: {
  href: string;
  event: "game_hub_to_play" | "guide_to_play" | "collection_to_game" | "related_game_click";
  props?: Record<string, string | number | boolean | null | undefined>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => analytics.track(event, { href, ...props })}
    >
      {children}
    </a>
  );
}
