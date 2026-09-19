import type { ReactNode } from "react";
import { Avatar } from "@/components/shell/AppShell";
import { GameBackdrop } from "./GameBackdrop";

export function PlayerIdentity({
  name,
  username,
  avatar,
  level,
  stat,
  slug,
  action,
}: {
  name: string;
  username?: string;
  avatar: string;
  level?: number;
  stat?: string;
  slug?: string;
  action?: ReactNode;
}) {
  const body = (
    <div className="flex min-h-[280px] flex-col justify-end px-5 py-8 md:min-h-[360px] md:px-10">
      <p className="meta text-white/50">Player</p>
      <div className="mt-4 flex flex-wrap items-end gap-5">
        <Avatar id={avatar} size={88} />
        <div>
          <h1 className="display text-[48px] text-white md:text-[72px]">{name}</h1>
          <p className="mt-2 text-[14px] text-white/65">
            {username ? `@${username}` : null}
            {level ? ` · Lv ${level}` : null}
            {stat ? ` · ${stat}` : null}
          </p>
        </div>
      </div>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
  if (!slug) return <div className="gw-stage">{body}</div>;
  return (
    <GameBackdrop slug={slug} dim={0.22} priority>
      {body}
    </GameBackdrop>
  );
}
