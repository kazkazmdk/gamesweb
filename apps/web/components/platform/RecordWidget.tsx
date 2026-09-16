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
        title="No record yet"
        body={`Set your first ${game.title} score.`}
        slug={game.slug}
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
    <article className="relative min-h-[168px] overflow-hidden">
      <div className="absolute inset-0">
        <GameArt slug={game.slug} variant="tile" className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/35 to-transparent" />
      </div>
      <div className="relative flex h-full min-h-[168px] flex-col justify-end p-4">
        <p className="meta text-white/60">{game.title}{modeLabel ? ` · ${modeLabel}` : ""}</p>
        <p className="stat mt-1 text-[40px] text-white">{label}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-white/70">
          {rank ? <span>{formatRank(rank)}</span> : null}
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
