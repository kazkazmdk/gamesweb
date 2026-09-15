import Link from "next/link";
import { formatPlayScore, formatRank } from "@/lib/platform/format";
import { EmptyState } from "./EmptyState";
import { QuickAction } from "./QuickAction";

export function RankWidget({
  gameId,
  gameTitle,
  slug,
  rows,
  variant = "full",
  friend,
  gap,
  rank,
  youScore,
}: {
  gameId: string;
  gameTitle: string;
  slug: string;
  rows: Array<{ name: string; score: number; isYou?: boolean }>;
  variant?: "compact" | "full";
  friend?: { name: string; score: number } | null;
  gap?: number | null;
  rank?: number | null;
  youScore?: number;
}) {
  const scoreLabel = youScore !== undefined ? formatPlayScore(gameId, youScore) : null;
  if (!rows.length && !scoreLabel) {
    return (
      <EmptyState
        title="No board yet"
        body={`Play ${gameTitle} to set the pace.`}
        action={<QuickAction href={`/play/${slug}`}>Play</QuickAction>}
      />
    );
  }

  if (variant === "compact") {
    return (
      <div>
        <p className="stat text-[40px]">{formatRank(rank ?? null)}</p>
        <p className="meta mt-1">{scoreLabel ?? "YOUR RANK"}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="stat text-[48px]">{formatRank(rank ?? null)}</p>
          <p className="meta mt-1">{scoreLabel ? `${scoreLabel} · your best` : "YOUR RANK"}</p>
        </div>
        {gap !== null && gap !== undefined && rank && rank > 1 ? (
          <p className="text-right text-[13px] text-[var(--text-dim)]">
            {formatPlayScore(gameId, Math.abs(gap)) ?? Math.abs(gap)}
            <span className="meta mt-1 block">to next</span>
          </p>
        ) : null}
      </div>
      <ol className="mt-5 space-y-2">
        {rows.slice(0, 3).map((row, i) => (
          <li key={`${row.name}-${i}`} className="flex items-baseline justify-between text-[14px]">
            <span className={row.isYou ? "text-[var(--text)]" : "text-[var(--text-dim)]"}>
              {i + 1} {row.name}
              {row.isYou ? " · you" : ""}
            </span>
            <span className="stat text-[16px]">{formatPlayScore(gameId, row.score)}</span>
          </li>
        ))}
      </ol>
      {friend ? (
        <p className="mt-4 text-[13px] text-[var(--text-dim)]">
          Friend best · {friend.name} · {formatPlayScore(gameId, friend.score)}
        </p>
      ) : null}
      <Link href="/leaderboards" className="mt-4 inline-flex min-h-11 items-center text-[13px] text-[var(--accent)]">
        View leaderboard
      </Link>
    </div>
  );
}
