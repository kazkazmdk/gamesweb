"use client";

import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, GameModeSelector, InlineError, QuickAction, RankWidget, SectionHeader } from "@/components/platform";
import { Avatar, useAccent } from "@/components/shell/AppShell";
import { usePlayer, useStore } from "@/lib/player";
import { friendsBoard, rankViewModel } from "@/lib/platform/adapters";
import { formatPlayScore, formatRank } from "@/lib/platform/format";
import { boardModeOptions, defaultBoardMode } from "@/lib/platform/modes";

export default function LeaderboardsPage() {
  useAccent();
  const store = useStore();
  const player = usePlayer();
  const [gameId, setGameId] = useState(GAME_MANIFESTS[0].id);
  const [mode, setMode] = useState(defaultBoardMode(GAME_MANIFESTS[0].id));
  const [scope, setScope] = useState<"global" | "friends">("global");
  const game = GAME_MANIFESTS.find((g) => g.id === gameId) ?? GAME_MANIFESTS[0];
  const modes = boardModeOptions(game.id);
  const allRows = store.leaderboard(game.id, mode);
  const personal = store.personalRank(game.id, mode);
  const rows = useMemo(
    () => (scope === "friends" ? friendsBoard(allRows, player.friends) : allRows),
    [allRows, player.friends, scope],
  );
  const rank = rankViewModel(rows, game.id, scope === "global" ? personal : null);
  const youOffTop = rank.rank !== null && rank.rank > 10;

  useEffect(() => {
    void store.ensureBoard(gameId, mode);
  }, [store, gameId, mode]);

  function selectGame(id: string) {
    setGameId(id);
    setMode(defaultBoardMode(id));
  }

  return (
    <div className="px-5 py-8 md:px-10">
      <h1 className="display text-[44px] md:text-[64px]">Leaderboards</h1>
      <p className="mt-2 max-w-xl text-[15px] text-[var(--text-dim)]">
        Verified when the run looks human. Flagged stays off the board.
      </p>

      <div className="mt-8 space-y-5">
        <GameModeSelector
          label="Game"
          options={GAME_MANIFESTS.map((g) => ({ id: g.id, label: g.title }))}
          value={game.id}
          onChange={selectGame}
        />
        <GameModeSelector label="Mode" options={modes} value={mode} onChange={setMode} />
        <GameModeSelector
          label="Board"
          options={[
            { id: "global", label: "Global" },
            { id: "friends", label: "Friends" },
          ]}
          value={scope}
          onChange={(id) => setScope(id as "global" | "friends")}
        />
      </div>

      {store.boardError(game.id, mode) ? (
        <div className="mt-8 max-w-xl">
          <InlineError
            title="Global board unavailable"
            body="Your local PB remains visible."
            onRetry={() => void store.ensureBoard(game.id, mode, true)}
          />
        </div>
      ) : null}

      <section className="mt-10 max-w-xl">
        <SectionHeader title="Your position" />
        <div className="mt-4">
          {rank.you ? (
            <>
              <RankWidget
                gameId={game.id}
                gameTitle={game.title}
                slug={game.slug}
                rows={rows}
                variant="compact"
                rank={rank.rank}
                youScore={rank.you.score}
                gap={rank.gap}
              />
              {rank.gap !== null && rank.rank && rank.rank > 1 ? (
                <p className="mt-2 text-[13px] text-[var(--text-dim)]">
                  {formatPlayScore(game.id, Math.abs(rank.gap))} to {formatRank(rank.rank - 1)}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-[14px] text-[var(--text-dim)]">Play to take a place on this board.</p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <SectionHeader title={scope === "friends" ? "Friends" : "Top 10"} />
        {scope === "friends" && !player.friends.some((f) => f.status === "accepted") ? (
          <EmptyState
            title="No friends on the board"
            body="Invite someone. Friend ranks only show when they actually have a score here."
            action={<QuickAction href="/friends">Invite</QuickAction>}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No leaderboard yet"
            body={`Play ${game.title} to set one.`}
            action={<QuickAction href={`/play/${game.slug}`}>Play</QuickAction>}
          />
        ) : (
          <ol className="mt-4 max-w-2xl">
            {rank.top10.map((r, i) => (
              <BoardRow key={`${r.name}-${i}`} rank={i + 1} name={r.name} score={formatPlayScore(game.id, r.score) ?? "—"} you={r.isYou} top={i < 3} avatar={r.isYou ? player.avatar : undefined} />
            ))}
            {youOffTop && rank.you ? (
              <BoardRow
                rank={rank.rank!}
                name={rank.you.name}
                score={formatPlayScore(game.id, rank.you.score) ?? "—"}
                you
                avatar={player.avatar}
              />
            ) : null}
          </ol>
        )}
      </section>
    </div>
  );
}

function BoardRow({
  rank,
  name,
  score,
  you,
  top,
  avatar,
}: {
  rank: number;
  name: string;
  score: string;
  you?: boolean;
  top?: boolean;
  avatar?: string;
}) {
  return (
    <li
      className={`flex items-center gap-3 border-t border-[var(--line)] py-3 ${top ? "pt-4" : ""} ${you ? "text-[var(--text)]" : "text-[var(--text-dim)]"}`}
    >
      <span className={`stat w-10 shrink-0 text-[18px] ${top ? "text-[var(--text)]" : ""}`}>{formatRank(rank)}</span>
      {avatar ? <Avatar id={avatar} size={28} /> : <span className="h-7 w-7 shrink-0 rounded-full bg-white/10" aria-hidden />}
      <span className="min-w-0 flex-1 truncate text-[15px]">
        {name}
        {you ? " · you" : ""}
      </span>
      <span className="stat text-[20px] text-[var(--text)]">{score}</span>
    </li>
  );
}
