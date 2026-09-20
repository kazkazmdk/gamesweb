"use client";

import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, GameModeSelector, InlineError, QuickAction } from "@/components/platform";
import { Avatar, useAccent } from "@/components/shell/AppShell";
import { usePlayer, useStore } from "@/lib/player";
import { useArcade } from "@/lib/social/use-arcade";
import { friendsBoard, rankViewModel } from "@/lib/platform/adapters";
import { formatPlayScore, formatRank } from "@/lib/platform/format";
import { boardModeOptions, defaultBoardMode } from "@/lib/platform/modes";
import { GameBackdrop, RankPodium } from "@/components/visual";
import { GameArt } from "@/components/game/GameArt";
import { homeStage } from "@/components/home/home-stage";

export default function LeaderboardsPage() {
  const store = useStore();
  const player = usePlayer();
  const arcade = useArcade();
  const [gameId, setGameId] = useState(GAME_MANIFESTS[0].id);
  const [mode, setMode] = useState(defaultBoardMode(GAME_MANIFESTS[0].id));
  const [scope, setScope] = useState<"global" | "friends" | "rivals">("global");
  const game = GAME_MANIFESTS.find((g) => g.id === gameId) ?? GAME_MANIFESTS[0];
  useAccent(game.accent);
  const modes = boardModeOptions(game.id);
  const allRows = store.leaderboard(game.id, mode);
  const personal = store.personalRank(game.id, mode);
  const rows = useMemo(() => {
    if (scope === "friends") return friendsBoard(allRows, player.friends);
    if (scope === "rivals") {
      const rivalNames = new Set(arcade.rivals.map((r) => r.otherName.toLowerCase()));
      return allRows.filter((r) => r.isYou || (r.name && rivalNames.has(r.name.toLowerCase())));
    }
    return allRows;
  }, [allRows, arcade.rivals, player.friends, scope]);
  const rank = rankViewModel(rows, game.id, scope === "global" ? personal : null);
  const youOffTop = rank.rank !== null && rank.rank > 10;
  const podium = rank.top3.map((r) => ({
    name: r.name,
    score: formatPlayScore(game.id, r.score) ?? "—",
    you: r.isYou,
    avatar: r.isYou ? player.avatar : undefined,
  }));

  useEffect(() => {
    void store.ensureBoard(gameId, mode);
  }, [store, gameId, mode]);

  function selectGame(id: string) {
    setGameId(id);
    setMode(defaultBoardMode(id));
  }

  return (
    <div>
      <GameBackdrop slug={game.slug} className="min-h-[28vh] md:min-h-[42vh]" dim={0.28} priority>
        <div className="flex min-h-[28vh] flex-col justify-end px-5 pb-6 pt-16 md:min-h-[42vh] md:px-10 md:pb-8 md:pt-20">
          <p className="meta text-white/50">Competition</p>
          <h1 className="display mt-2 text-[36px] text-white md:text-[64px]">Leaderboards</h1>
          <p className="mt-2 max-w-xl text-[14px] text-white/65 md:text-[15px]">Verified when the run looks human. Flagged stays off the board.</p>
        </div>
      </GameBackdrop>

      <div className="px-5 py-6 md:px-10 md:py-8">
        <div
          role="tablist"
          aria-label="Game"
          className="flex gap-3 overflow-x-auto scrollbar-none"
        >
          {GAME_MANIFESTS.map((g) => {
            const selected = g.id === game.id;
            const dir = homeStage(g.slug);
            return (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={`relative h-24 w-40 shrink-0 overflow-hidden md:h-[7.5rem] md:w-52 ${selected ? "gw-frame" : "opacity-50"}`}
                onClick={() => selectGame(g.id)}
              >
                <GameArt slug={g.slug} variant="tile" position={dir.tile} className="h-full w-full" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-2 pt-6 text-left text-[12px] text-white md:text-[13px]">
                  {g.title}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-8">
          <GameModeSelector label="Mode" options={modes} value={mode} onChange={setMode} />
          <GameModeSelector
            label="Board"
            options={[
              { id: "global", label: "Global" },
              { id: "friends", label: "Friends" },
              { id: "rivals", label: "Rivals" },
            ]}
            value={scope}
            onChange={(id) => setScope(id as "global" | "friends" | "rivals")}
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

        {scope === "friends" && !player.friends.some((f) => f.status === "accepted") ? (
          <div className="mt-10">
            <EmptyState
              title="No friends on the board"
              body="Invite someone. Friend ranks only show when they actually have a score here."
              action={<QuickAction href="/friends">Invite</QuickAction>}
            />
          </div>
        ) : scope === "rivals" && !arcade.rivals.length ? (
          <div className="mt-10">
            <EmptyState title="No rivals yet" body="Rivals appear after a real challenge result." />
          </div>
        ) : rows.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              slug={game.slug}
              title={`No ${game.title} board yet`}
              body={`This board stays empty until someone finishes a verified ${game.title} run. Play ${game.sessionHint} and the first score becomes the standing.`}
              action={<QuickAction href={`/play/${game.slug}`}>Set the first time</QuickAction>}
            />
          </div>
        ) : (
          <>
            {podium.length ? (
              <section className="mt-6 md:mt-8">
                <p className="meta text-white/40">{podium.length === 1 ? "Standing" : "Podium"}</p>
                <div className="mt-4">
                  <RankPodium rows={podium} />
                </div>
              </section>
            ) : null}
            <ol className="mt-8 max-w-2xl">
              {rank.top10.slice(3).map((r, i) => (
                <BoardRow
                  key={`${r.name}-${i + 4}`}
                  rank={i + 4}
                  name={r.name}
                  score={formatPlayScore(game.id, r.score) ?? "—"}
                  you={r.isYou}
                  avatar={r.isYou ? player.avatar : undefined}
                />
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
          </>
        )}
      </div>
    </div>
  );
}

function BoardRow({
  rank,
  name,
  score,
  you,
  avatar,
}: {
  rank: number;
  name: string;
  score: string;
  you?: boolean;
  avatar?: string;
}) {
  return (
    <li className={`sticky-you flex items-center gap-3 border-t border-[var(--line)] py-3 ${you ? "sticky bottom-16 bg-[var(--bg)] text-[var(--text)]" : "text-[var(--text-dim)]"}`}>
      <span className="stat w-10 shrink-0 text-[18px]">{formatRank(rank)}</span>
      {avatar ? <Avatar id={avatar} size={28} /> : <span className="gw-avatar h-7 w-7 shrink-0 bg-white/10" aria-hidden />}
      <span className="min-w-0 flex-1 truncate text-[15px]">
        {name}
        {you ? " · you" : ""}
      </span>
      <span className="stat text-[20px] text-[var(--text)]">{score}</span>
    </li>
  );
}
