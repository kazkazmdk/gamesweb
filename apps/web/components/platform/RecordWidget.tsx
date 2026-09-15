import type { GameManifest } from "@gamesweb/game-sdk";
import { GameArt } from "@/components/game/GameArt";
import { formatPlayScore, formatRank, hasRecord } from "@/lib/platform/format";
import { EmptyState } from "./EmptyState";
import { QuickAction } from "./QuickAction";
import { StatusPill } from "./StatusPill";

export function RecordWidget({
  game,
  score,
  modeLabel,
  rank,
  delta,
  verified,
}: {
  game: GameManifest;
  score: number;
  modeLabel?: string;
  rank?: number | null;
  delta?: number | null;
  verified?: "verified" | "unverified" | "flagged" | null;
}) {
  const label = formatPlayScore(game.id, score);
  if (!hasRecord(score) || !label) {
    return (
      <EmptyState
        title={`No record yet`}
        body={`Play ${game.title} to set one.`}
        action={<QuickAction href={`/play/${game.slug}`}>Play</QuickAction>}
      />
    );
  }
  const deltaLabel =
    delta === null || delta === undefined
      ? null
      : game.id === "velocity-run"
        ? `${delta <= 0 ? "" : "+"}${(delta / 1000).toFixed(3)}s`
        : `${delta >= 0 ? "+" : ""}${Math.round(delta).toLocaleString()}`;
  return (
    <article className="grid grid-cols-[72px_1fr] items-center gap-4">
      <div className="relative h-16 overflow-hidden">
        <GameArt slug={game.slug} className="h-full w-full object-cover" />
      </div>
      <div>
        <p className="stat text-[32px]">{label}</p>
        <p className="meta mt-1">
          {game.title}
          {modeLabel ? ` · ${modeLabel}` : ""}
          {rank ? ` · ${formatRank(rank)}` : ""}
        </p>
        <div className="mt-1 flex items-center gap-3 text-[12px] text-[var(--text-dim)]">
          {deltaLabel ? <span>{deltaLabel}</span> : null}
          {verified === "verified" ? <StatusPill kind="verified" /> : verified === "unverified" ? <StatusPill kind="review" /> : null}
          <QuickAction href={`/play/${game.slug}`} tone="quiet">
            Play
          </QuickAction>
        </div>
      </div>
    </article>
  );
}
