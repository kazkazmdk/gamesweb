"use client";

import { analytics } from "@gamesweb/analytics";
import { GAME_MANIFESTS, getManifest, nextBestAction, utcDayKey, dailyArcadeEvents } from "@gamesweb/game-sdk";
import { useArcade } from "@/lib/social/use-arcade";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar, useAccent } from "@/components/shell/AppShell";
import { usePlayer, useStore } from "@/lib/player";
import { focusedGameContext } from "@/lib/platform/focus";
import { formatPlayScore } from "@/lib/platform/format";
import { loadPlayIndex, playModeOptions, savePlayIndex } from "@/lib/platform/modes";
import { GameRail, type RailMark } from "./GameRail";
import { HomeSocial } from "./HomeSocial";
import { HomeStage } from "./HomeStage";
import { TodayArcade } from "./TodayArcade";

export default function HomePage() {
  const player = usePlayer();
  const store = useStore();
  const router = useRouter();
  const [focus, setFocus] = useState(0);
  const [playIndex, setPlayIndex] = useState(0);
  const game = GAME_MANIFESTS[focus] ?? GAME_MANIFESTS[0];
  useAccent(game.accent);
  const reduced = player.settings.reducedMotion;

  useEffect(() => {
    setPlayIndex(loadPlayIndex(game.id));
  }, [game.id]);

  const board = store.leaderboard(game.id, focusedGameContext(player, game, playIndex, []).boardMode);
  const ctx = useMemo(
    () => focusedGameContext(player, game, playIndex, board),
    [player, game, playIndex, board],
  );

  useEffect(() => {
    void store.ensureBoard(game.id, ctx.boardMode);
  }, [store, game.id, ctx.boardMode]);

  const setFocusSafe = useCallback((delta: number) => {
    setFocus((current) => (current + delta + GAME_MANIFESTS.length) % GAME_MANIFESTS.length);
  }, []);

  useEffect(() => {
    analytics.track("home_game_focused", { gameId: game.id, index: focus });
  }, [game.id, focus]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable) return;
      if (document.querySelector('[role="dialog"][aria-label="Search"]')) return;
      if (el.closest('[role="tablist"]')) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setFocusSafe(1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setFocusSafe(-1);
      }
      if (e.key === "Enter") {
        if (el.closest("a,button")) return;
        e.preventDefault();
        analytics.track("home_game_play_clicked", { gameId: game.id, source: "enter" });
        router.push(`/play/${game.slug}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game.id, game.slug, router, setFocusSafe]);

  const modes = playModeOptions(game.id);
  const snap = useArcade();
  const day = utcDayKey();
  const openChallenges = snap.challenges.filter((c) => c.status === "open");
  const openCh = openChallenges[0];
  const dailies = dailyArcadeEvents(day);
  const dailyLeft = dailies.filter((e) => !(snap.daily.day === day && snap.daily.completed.includes(`${e.gameId}:${e.mode}`)));
  const nba = nextBestAction({
    recentRuns: player.history.slice(0, 8).map((h) => ({ gameId: h.gameId, score: h.score, result: h.result, at: h.at })),
    retries: player.history.filter((h) => h.gameId === game.id).length,
    lastGameId: player.history[0]?.gameId,
    gamesPlayed: store.playedIds(),
    daily: { remaining: Math.max(0, dailyLeft.length) },
    openChallenge: openCh
      ? { code: openCh.publicCode, gameId: openCh.gameId, from: openCh.challengerName }
      : undefined,
  });

  const played = new Set(store.playedIds());
  const dailyIds = new Set(dailies.map((e) => e.gameId));
  const challengeIds = new Set(openChallenges.map((c) => c.gameId));
  const lastRun = player.history[0];
  const lastGame = lastRun ? getManifest(lastRun.gameId) : undefined;
  const rival = snap.rivals[0];
  const gameChallenge = openChallenges.find((c) => c.gameId === game.id);
  const dailyHere = dailyLeft.find((e) => e.gameId === game.id);
  const friends = player.friends.filter((f) => f.status === "accepted");
  const online = friends.filter((f) => f.presence !== "offline");

  const primary = resolvePrimary({
    gameSlug: game.slug,
    playLabel: ctx.playLabel,
    challenge: gameChallenge,
    daily: dailyHere,
    continueHere: lastGame?.id === game.id,
  });
  const secondary = resolveSecondary(primary.kind, {
    playHref: `/play/${game.slug}`,
    challenge: gameChallenge,
    dailyLeft: dailyLeft.length,
    nba,
  });

  const marks: RailMark[] = GAME_MANIFESTS.map((g) => {
    if (challengeIds.has(g.id)) return "challenge";
    if (dailyIds.has(g.id)) return "daily";
    if (lastGame?.id === g.id) return "continue";
    if (!played.has(g.id)) return "new";
    return null;
  });

  const stepMode = (delta: number) => {
    if (modes.length < 2) return;
    const next = (playIndex + delta + modes.length) % modes.length;
    setPlayIndex(next);
    savePlayIndex(game.id, next);
  };

  return (
    <div className="relative min-h-dvh" data-testid="games-home">
      <HomeStage slug={game.slug} reduced={reduced} />

      <div className="relative flex min-h-dvh flex-col px-5 pb-8 pt-[calc(var(--header-h)+12px)] md:px-10 md:pb-10">
        <div className={`mt-6 max-w-xl md:mt-10 ${reduced ? "" : "home-copy-in"}`} key={game.id}>
          <p className="meta text-white/55">{game.genre}</p>
          <h1 className="display mt-2 text-[42px] text-white md:text-[72px]">{game.title}</h1>
          <p className="mt-3 max-w-md text-[15px] leading-snug text-white/70">{game.tagline}</p>

          <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-3">
            {ctx.pbLabel ? (
              <div>
                <p className="meta text-white/40">Personal best</p>
                <p className="metric mt-1 text-[28px] text-white md:text-[34px]">{ctx.pbLabel}</p>
              </div>
            ) : null}
            {rival ? (
              <Link href="/friends" className="flex items-center gap-2.5">
                <Avatar id={rival.otherId} size={32} />
                <span>
                  <span className="block text-[13px] text-white">{rival.otherName}</span>
                  <span className="stat block text-[12px] text-white/55">
                    {rival.winsA}–{rival.winsB}
                  </span>
                </span>
              </Link>
            ) : ctx.friendBest?.scoreLabel ? (
              <div>
                <p className="meta text-white/40">{ctx.friendBest.name}</p>
                <p className="stat mt-1 text-[18px] text-white">{ctx.friendBest.scoreLabel}</p>
              </div>
            ) : null}
            {dailyHere ? <p className="meta text-[var(--accent)]">Daily live</p> : null}
          </div>

          {modes.length > 1 ? (
            <div className="mt-4 flex items-center gap-2 text-[13px] text-white/70">
              <button type="button" className="grid h-11 w-11 place-items-center" aria-label="Previous mode" onClick={() => stepMode(-1)}>
                ‹
              </button>
              <span className="min-w-[8rem] text-center tracking-[0.08em] uppercase">{modes[playIndex]?.label ?? ctx.modeLabel}</span>
              <button type="button" className="grid h-11 w-11 place-items-center" aria-label="Next mode" onClick={() => stepMode(1)}>
                ›
              </button>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={primary.href}
              className="home-play inline-flex min-h-12 items-center justify-center px-8 text-[15px] font-semibold"
              onClick={() => analytics.track("home_game_play_clicked", { gameId: game.id, source: "cta" })}
            >
              {primary.label}
            </Link>
            {secondary ? (
              <Link
                href={secondary.href}
                className="inline-flex min-h-12 items-center px-2 text-[13px] text-white/70 underline decoration-white/20 underline-offset-4"
                onClick={() => analytics.track("home_event_opened", { href: secondary.href })}
              >
                {secondary.label}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-auto pt-10">
          <GameRail
            games={GAME_MANIFESTS}
            focus={focus}
            marks={marks}
            reduced={reduced}
            onFocus={(i) => setFocus(i)}
            onPlay={(i) => {
              const g = GAME_MANIFESTS[i];
              analytics.track("home_game_play_clicked", { gameId: g.id, source: "rail" });
              router.push(`/play/${g.slug}`);
            }}
          />
          {online.length ? (
            <p className="mt-3 text-[12px] text-white/45">
              {online.length} friend{online.length === 1 ? "" : "s"} online
            </p>
          ) : null}
        </div>
      </div>

      <TodayArcade dailies={dailies} remaining={dailyLeft.length} gpPoints={snap.grandPrix.points} />
      <HomeSocial friends={friends} rivals={snap.rivals} challenges={openChallenges} />
    </div>
  );
}

function resolvePrimary(input: {
  gameSlug: string;
  playLabel: "Play" | "Continue";
  challenge?: { publicCode: string; challengerName: string };
  daily?: { gameId: string };
  continueHere: boolean;
}) {
  if (input.challenge) {
    return { kind: "challenge" as const, href: `/c/${input.challenge.publicCode}`, label: `Beat ${input.challenge.challengerName}` };
  }
  if (input.continueHere) {
    return { kind: "continue" as const, href: `/play/${input.gameSlug}`, label: "Continue" };
  }
  if (input.daily) {
    return { kind: "daily" as const, href: `/play/${input.gameSlug}?daily=1`, label: "Play Daily" };
  }
  return { kind: "play" as const, href: `/play/${input.gameSlug}`, label: input.playLabel };
}

function resolveSecondary(
  primary: "challenge" | "continue" | "daily" | "play",
  input: {
    playHref: string;
    challenge?: { publicCode: string };
    dailyLeft: number;
    nba: { type: string; href: string; label: string };
  },
) {
  if (primary === "challenge") return { href: input.playHref, label: "Play" };
  if (input.challenge) return { href: `/c/${input.challenge.publicCode}`, label: "Challenge" };
  if (primary !== "daily" && input.dailyLeft > 0) return { href: "/daily", label: "Daily" };
  if (input.nba.type !== "play" && input.nba.href !== "/") return { href: input.nba.href, label: input.nba.label };
  return null;
}
