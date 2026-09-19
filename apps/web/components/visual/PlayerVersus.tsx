import { getManifest } from "@gamesweb/game-sdk";
import { Avatar } from "@/components/shell/AppShell";
import { GameArt } from "@/components/game/GameArt";
import { ChamferButton } from "./ChamferButton";

export function PlayerVersus({
  left,
  right,
  gameId,
  stake,
  expires,
  href,
  cta,
}: {
  left: { name: string; avatar?: string; score?: string };
  right: { name: string; avatar?: string; score?: string };
  gameId?: string;
  stake?: string;
  expires?: string;
  href?: string;
  cta?: string;
}) {
  const game = gameId ? getManifest(gameId) : null;
  return (
    <article className="gw-stage relative min-h-[168px] overflow-hidden">
      {game ? (
        <div className="absolute inset-0">
          <GameArt slug={game.slug} variant="tile" className="h-full w-full opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/70" />
        </div>
      ) : null}
      <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-4 md:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar id={left.avatar ?? left.name} size={44} />
          <div className="min-w-0">
            <p className="truncate text-[15px] text-white">{left.name}</p>
            {left.score ? <p className="stat mt-1 text-[20px] text-white">{left.score}</p> : null}
          </div>
        </div>
        <p className="gw-versus shrink-0">VS</p>
        <div className="flex min-w-0 items-center justify-end gap-3 text-right">
          <div className="min-w-0">
            <p className="truncate text-[15px] text-white">{right.name}</p>
            {right.score ? <p className="stat mt-1 text-[20px] text-white">{right.score}</p> : null}
          </div>
          <Avatar id={right.avatar ?? right.name} size={44} />
        </div>
      </div>
      <div className="relative flex flex-wrap items-center justify-between gap-3 px-4 pb-4 md:px-5">
        <p className="text-[12px] tracking-[0.08em] text-white/50 uppercase">
          {[game?.title, stake, expires].filter(Boolean).join(" · ")}
        </p>
        {href && cta ? <ChamferButton href={href}>{cta}</ChamferButton> : null}
      </div>
    </article>
  );
}
