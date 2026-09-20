"use client";

import { analytics } from "@gamesweb/analytics";
import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { ChamferButton } from "@/components/visual/ChamferButton";

export function SeoTracker({ kind, slug }: { kind: string; slug: string }) {
  useEffect(() => {
    analytics.track("seo_landing_view", { source_page_type: kind, source_slug: slug });
  }, [kind, slug]);
  return null;
}

export function SeoGameLink({
  href,
  gameId,
  sourceType,
  sourceSlug,
  event = "seo_game_click",
  className,
  children,
}: {
  href: string;
  gameId: string;
  sourceType: string;
  sourceSlug: string;
  event?: "seo_game_click" | "seo_play_click" | "seo_guide_to_game" | "seo_collection_to_game";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() =>
        analytics.track(event, {
          source_page_type: sourceType,
          source_slug: sourceSlug,
          game_id: gameId,
        })
      }
    >
      {children}
    </Link>
  );
}

export function SeoPlayButton({
  href,
  gameId,
  sourceType,
  sourceSlug,
  children = "Play",
}: {
  href: string;
  gameId: string;
  sourceType: string;
  sourceSlug: string;
  children?: ReactNode;
}) {
  return (
    <ChamferButton
      href={href}
      prefetch={false}
      onClick={() =>
        analytics.track("seo_play_click", {
          source_page_type: sourceType,
          source_slug: sourceSlug,
          game_id: gameId,
        })
      }
    >
      {children}
    </ChamferButton>
  );
}
