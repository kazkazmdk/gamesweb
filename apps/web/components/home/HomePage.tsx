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
import { loadPlayIndex, playModeOptions, savePlayIndex } from "@/lib/platform/modes";
import { GameRail, type RailMark, type RailPresence } from "./GameRail";
import { HomeSocial } from "./HomeSocial";
import { HomeStage } from "./HomeStage";
import { TodayArcade } from "./TodayArcade";
import { HomeDiscover } from "./HomeDiscover";
import { homeStage } from "./home-stage";

export default function HomePage() {
  const player = usePlayer();
  const store = useStore();
  const router = useRouter();
  const [focus, setFocus] = useState(0);
  const [playIndex, setPlayIndex] = useState(0);
  const [travel, setTravel] = useState(1);
  const game = GAME_MANIFESTS[focus] ?? GAME_MANIFESTS[0];
  useAccent(game.accent);
  const reduced = player.settings.reducedMotion;
  const stage = homeStage(game.slug);

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
    setTravel(delta >= 0 ? 1 : -1);
    setFocus((current) => (current + delta + GAME_MANIFESTS.length) % GAME_MANIFESTS.length);
  }, []);

  const setFocusAt = useCallback(
    (index: number) => {
      setTravel(index >= focus ? 1 : -1);
      setFocus(index);
    },
    [focus],
  );

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

  const dailyIds = new Set(dailyLeft.map((e) => e.gameId));
  const challengeIds = new Set(openChallenges.map((c) => c.gameId));
  const lastRun = player.history[0];
  const lastGame = lastRun ? getManifest(lastRun.gameId) : undefined;
  const rival = snap.rivals[0];
  const gameChallenge = openChallenges.find((c) => c.gameId === game.id);
  const dailyHere = dailyLeft.find((e) => e.gameId === game.id);
  const friends = player.friends.filter((f) => f.status === "accepted");

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
    return null;
  });

  const presence: RailPresence[] = GAME_MANIFESTS.map((g) =>
    friends
      .filter((f) => f.presence === "playing" && f.gameId === g.id)
      .slice(0, 2)
      .map((f) => ({ name: f.displayName, avatar: f.avatar })),
  );

  const stepMode = (delta: number) => {
    if (modes.length < 2) return;
    const next = (playIndex + delta + modes.length) % modes.length;
    setPlayIndex(next);
    savePlayIndex(game.id, next);
  };

  const showRival = Boolean(rival && !gameChallenge);
  const showPb = Boolean(ctx.pbLabel);

  return (
    <div className="relative min-h-dvh" data-testid="games-home">
      <HomeStage slug={game.slug} reduced={reduced} step={travel} />

      <div className="relative flex min-h-dvh flex-col px-5 pb-[calc(var(--bottom-nav)+12px)] pt-[calc(var(--header-h)+8px)] md:px-10 md:pb-8">
        <div
          className={
            stage.copy === "low" ? "min-h-[20vh] flex-1 md:min-h-[26vh]" : "min-h-[12vh] flex-1 md:min-h-[16vh]"
          }
        />

        <div
          className={`max-w-xl ${reduced ? "" : "home-copy-in"} ${stage.copy === "offset" ? "md:ml-[10%]" : ""}`}
          key={game.id}
        >
          <p className="meta text-white/50">{game.genre}</p>
          <h1
            className={`display mt-1.5 text-white ${
              stage.family === "vertical" ? "text-[42px] md:text-[60px] xl:text-[72px]" : "text-[40px] md:text-[56px] xl:text-[68px]"
            }`}
          >
            {game.title}
          </h1>
          <p className="mt-2 max-w-md text-[14px] leading-snug text-white/68 md:text-[15px]">{game.tagline}</p>

          {showPb || showRival ? (
            <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-3">
              {showPb ? (
                <div>
                  <p className="meta text-white/38">Personal best</p>
                  <p className="metric mt-1 text-[30px] text-white md:text-[36px]">{ctx.pbLabel}</p>
                </div>
              ) : null}
              {showRival && rival ? (
                <Link
                  href="/friends"
                  className="flex items-center gap-3"
                  onClick={() => analytics.track("home_social_action", { kind: "rival" })}
                >
                  <Avatar id={player.avatar} size={30} />
                  <span className="home-versus" aria-hidden>
                    VS
                  </span>
                  <Avatar id={rival.otherId} size={30} />
                  <span>
                    <span className="block text-[14px] text-white">{rival.otherName}</span>
                    <span className="stat block text-[13px] text-white/60">
                      {rival.winsA}–{rival.winsB}
                    </span>
                  </span>
                </Link>
              ) : null}
            </div>
          ) : null}

          {modes.length > 1 ? (
            <div className="home-mode mt-5 inline-flex items-center">
              <button type="button" className="grid h-11 w-11 place-items-center text-white/80" aria-label="Previous mode" onClick={() => stepMode(-1)}>
                ‹
              </button>
              <span className="min-w-[9.5rem] px-1 text-center text-[12px] tracking-[0.14em] text-white uppercase">
                {modes[playIndex]?.label ?? ctx.modeLabel}
              </span>
              <button type="button" className="grid h-11 w-11 place-items-center text-white/80" aria-label="Next mode" onClick={() => stepMode(1)}>
                ›
              </button>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-5">
            <Link
              href={primary.href}
              className="home-play inline-flex min-h-12 items-center justify-center gap-3 px-7 py-3 text-[16px] font-semibold md:min-h-14 md:px-8"
              onClick={() => analytics.track("home_game_play_clicked", { gameId: game.id, source: "cta" })}
            >
              <span className="home-play-mark" aria-hidden />
              {primary.label}
            </Link>
            {secondary ? (
              <Link
                href={secondary.href}
                className="home-secondary inline-flex min-h-11 items-center"
                onClick={() => analytics.track("home_event_opened", { href: secondary.href })}
              >
                {secondary.label}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-7 md:mt-8">
          <GameRail
            games={GAME_MANIFESTS}
            focus={focus}
            marks={marks}
            presence={presence}
            reduced={reduced}
            onFocus={setFocusAt}
            onPlay={(i) => {
              const g = GAME_MANIFESTS[i];
              analytics.track("home_game_play_clicked", { gameId: g.id, source: "rail" });
              router.push(`/play/${g.slug}`);
            }}
          />
        </div>
      </div>

      <TodayArcade dailies={dailies} remaining={dailyLeft.length} gpPoints={snap.grandPrix.points} />
      <HomeSocial
        friends={friends}
        rivals={snap.rivals}
        challenges={openChallenges}
        you={{ name: player.displayName || "You", avatar: player.avatar }}
      />
      <HomeDiscover />
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
  if (primary === "challenge") return { href: input.playHref, label: "Play ›" };
  if (input.challenge) return { href: `/c/${input.challenge.publicCode}`, label: "View challenge ›" };
  if (primary !== "daily" && input.dailyLeft > 0) return { href: "/daily", label: "Daily ›" };
  if (input.nba.type !== "play" && input.nba.href !== "/") return { href: input.nba.href, label: `${input.nba.label} ›` };
  return null;
}
