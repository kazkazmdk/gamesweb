import type { ReactNode } from "react";
import { GameBackdrop } from "./GameBackdrop";

export function EmptyStateStage({
  kicker,
  title,
  body,
  action,
  slug,
}: {
  kicker?: string;
  title: string;
  body?: string;
  action?: ReactNode;
  slug?: string;
}) {
  const copy = (
    <div className="flex min-h-[240px] flex-col justify-end px-5 py-8 md:min-h-[320px] md:px-8">
      {kicker ? <p className="meta text-white/45">{kicker}</p> : null}
      <p className="display mt-2 max-w-[16ch] text-[36px] text-white md:text-[52px]">{title}</p>
      {body ? <p className="mt-3 max-w-md text-[15px] text-white/65">{body}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
  if (!slug) {
    return <div className="gw-stage">{copy}</div>;
  }
  return (
    <GameBackdrop slug={slug} className="min-h-[240px] md:min-h-[320px]" dim={0.28}>
      {copy}
    </GameBackdrop>
  );
}
