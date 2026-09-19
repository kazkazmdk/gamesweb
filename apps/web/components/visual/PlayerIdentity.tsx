import type { ReactNode } from "react";
import { Avatar } from "@/components/shell/AppShell";
import { GameBackdrop } from "./GameBackdrop";

export function PlayerIdentity({
  name,
  username,
  avatar,
  level,
  into,
  needed,
  stat,
  slug,
  action,
}: {
  name: string;
  username?: string;
  avatar: string;
  level?: number;
  into?: number;
  needed?: number;
  stat?: string;
  slug?: string;
  action?: ReactNode;
}) {
  const hasProgress = typeof level === "number" && typeof into === "number" && typeof needed === "number" && needed > 0;
  const pct = hasProgress ? Math.min(100, Math.round((into / needed) * 100)) : 0;
  const body = (
    <div className="relative flex min-h-[200px] flex-col justify-end px-5 py-6 md:min-h-[240px] md:px-10 md:py-8">
      {action ? <div className="absolute top-5 right-5 md:top-7 md:right-10">{action}</div> : null}
      <div className="flex flex-wrap items-end gap-4 md:gap-5">
        <span className="gw-avatar-frame">
          <Avatar id={avatar} size={88} />
        </span>
        <div className="min-w-0 pb-1">
          <h1 className="display text-[44px] text-white md:text-[68px]">{name}</h1>
          <p className="mt-2 text-[14px] text-white/65">
            {username ? `@${username}` : null}
            {stat ? `${username ? " · " : ""}${stat}` : null}
          </p>
        </div>
      </div>
      {hasProgress ? (
        <div className="mt-5 max-w-md">
          <div className="flex items-baseline justify-between gap-4">
            <p className="stat text-[32px] text-white md:text-[40px]">Lv {level}</p>
            <p className="stat text-[15px] text-white/80">
              {into.toLocaleString("en-US")}
              <span className="ml-1 text-[12px] font-normal text-white/45">/ {needed.toLocaleString("en-US")} XP</span>
            </p>
          </div>
          <div
            className="progress-track mt-2 h-1.5"
            role="progressbar"
            aria-label={`Level ${level} progress`}
            aria-valuemin={0}
            aria-valuemax={needed}
            aria-valuenow={Math.min(into, needed)}
          >
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-[12px] text-white/40">Next · Lv {level + 1}</p>
        </div>
      ) : null}
    </div>
  );
  if (!slug) return <div className="gw-stage">{body}</div>;
  return (
    <GameBackdrop slug={slug} dim={0.28} priority>
      {body}
    </GameBackdrop>
  );
}
