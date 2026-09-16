import type { ReactNode } from "react";
import { GameArt } from "@/components/game/GameArt";

export function EmptyState({
  title,
  body,
  action,
  slug,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  slug?: string;
}) {
  return (
    <div className="relative overflow-hidden py-6">
      {slug ? (
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <GameArt slug={slug} variant="tile" className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)] via-[var(--bg)]/70 to-transparent" />
        </div>
      ) : null}
      <div className="relative">
        <p className="text-[16px] text-[var(--text)]">{title}</p>
        {body ? <p className="mt-1 max-w-md text-[13px] text-[var(--text-dim)]">{body}</p> : null}
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}
