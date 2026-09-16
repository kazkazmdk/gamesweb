import { Avatar } from "@/components/shell/AppShell";
import { StatusPill, type StatusKind } from "./StatusPill";

export function PlayerCard({
  name,
  username,
  avatar,
  level,
  status,
  stat,
  size = "md",
  heading = false,
  gameLabel,
}: {
  name: string;
  username?: string;
  avatar: string;
  level?: number;
  status?: StatusKind;
  stat?: string;
  size?: "sm" | "md" | "hero";
  heading?: boolean;
  gameLabel?: string;
}) {
  const px = size === "sm" ? 40 : size === "hero" ? 112 : 72;
  const Name = heading ? "h1" : "p";
  return (
    <div className={`flex items-center gap-4 ${size === "hero" ? "gap-6" : ""}`}>
      <div className="relative shrink-0">
        <Avatar id={avatar} size={px} />
        {status === "playing" || status === "online" ? (
          <span className={`absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full ${status === "playing" ? "bg-[var(--accent)]" : "bg-[var(--ok)]"}`} />
        ) : null}
      </div>
      <div className="min-w-0">
        <Name className={size === "sm" ? "truncate text-[15px]" : size === "hero" ? "display truncate text-[48px] md:text-[64px]" : "display truncate text-[28px] md:text-[36px]"}>
          {name}
        </Name>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-[var(--text-dim)]">
          {username ? <span>@{username}</span> : null}
          {level ? <span>Lv {level}</span> : null}
          {status ? <StatusPill kind={status} /> : null}
          {stat ? <span>{stat}</span> : null}
          {gameLabel ? <span>{gameLabel}</span> : null}
        </p>
      </div>
    </div>
  );
}
