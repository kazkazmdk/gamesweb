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
}: {
  name: string;
  username?: string;
  avatar: string;
  level?: number;
  status?: StatusKind;
  stat?: string;
  size?: "sm" | "md";
  heading?: boolean;
}) {
  const px = size === "sm" ? 32 : 48;
  const Name = heading ? "h1" : "p";
  return (
    <div className="flex items-center gap-3">
      <Avatar id={avatar} size={px} />
      <div className="min-w-0">
        <Name className={size === "sm" ? "truncate text-[14px]" : "display truncate text-[32px] md:text-[40px]"}>{name}</Name>
        <p className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--text-dim)]">
          {username ? <span>@{username}</span> : null}
          {level ? <span>Lv {level}</span> : null}
          {status ? <StatusPill kind={status} /> : null}
          {stat ? <span>{stat}</span> : null}
        </p>
      </div>
    </div>
  );
}
