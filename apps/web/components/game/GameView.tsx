"use client";

import { analytics } from "@gamesweb/analytics";
import {
  dailyArcadeEvents,
  dailyQuests,
  defaultChallengeType,
  GAME_MANIFESTS,
  getManifest,
  nextBestAction,
  normalizePerformance,
  recommend,
  utcDayKey,
} from "@gamesweb/game-sdk";
import { lowerIsBetter } from "@gamesweb/database";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAccent } from "@/components/shell/AppShell";
import { usePlayer, useStore } from "@/lib/player";
import { boardModeFromPlayIndex, resolvePlayIndex } from "@/lib/platform/modes";
import { formatScore } from "@/lib/player-store";
import { arcadeStore } from "@/lib/social/arcade-store";
import { PauseOverlay } from "@/components/game/PauseOverlay";
import { GameArt } from "@/components/game/GameArt";
import { ChamferButton } from "@/components/visual/ChamferButton";
import type { PlatformSDK } from "@gamesweb/game-sdk";
import type Phaser from "phaser";

const RESULT_INPUT_GRACE_MS = 450;

export function GameView({ slug }: { slug: string }) {
  const game = getManifest(slug);
  const store = useStore();
  const player = usePlayer();
  const router = useRouter();
  const wrap = useRef<HTMLDivElement>(null);
  const phaser = useRef<Phaser.Game | null>(null);
  const [boot, setBoot] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [loadPct, setLoadPct] = useState(12);
  const [bootError, setBootError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<null | {
    score: number;
    result: string;
    gameId: string;
    durationMs: number;
    metadata?: Record<string, number | string | boolean>;
  }>(null);
  const [intense, setIntense] = useState(false);
  const historyLen = useRef(0);
  const acceptHistory = useRef(false);
  const historyCount = useRef(0);
  historyCount.current = player.history.length;
  const runEndedAt = useRef(0);
  const retries = useRef(0);
  const loadedRef = useRef(false);

  useAccent(game?.accent);

  useEffect(() => {
    if (!game) return;
    const host = window.location.hostname;
    const params = new URLSearchParams(window.location.search);
    if (host === "localhost" || host === "127.0.0.1" || host === "::1" || params.has("gwinput")) {
      (window as Window & { __GW_ALLOW_DEBUG__?: boolean }).__GW_ALLOW_DEBUG__ = true;
    }
    analytics.track("game_selected", { gameId: game.id });
    analytics.track("game_load_started", { gameId: game.id });
    setBootError(null);
    setLoaded(false);
    loadedRef.current = false;
    const t = window.setInterval(() => setLoadPct((p) => Math.min(92, p + 8)), 120);
    let dead = false;
    let stage: "import" | "mount" | "create" | "first-frame" = "import";
    const platform: PlatformSDK = store.createPlatform(game.id, {
      onPause: () => setPaused(true),
      onReady: () => {
        if (dead) return;
        stage = "first-frame";
        setLoaded(true);
        loadedRef.current = true;
        setLoadPct(100);
        analytics.track("game_loaded", { gameId: game.id });
        acceptHistory.current = true;
        historyLen.current = historyCount.current;
        window.requestAnimationFrame(() => {
          const canvas = wrap.current?.querySelector("canvas");
          if (canvas instanceof HTMLCanvasElement) {
            canvas.tabIndex = 0;
            canvas.focus({ preventScroll: true });
          }
        });
      },
    });

    async function boot() {
      const parent = wrap.current;
      if (!parent) return;
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      let instance: Phaser.Game | null = null;
      stage = "import";
      const daily = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("daily") === "1";
      const playIndex = resolvePlayIndex(game!.id);
      if (game!.id === "neon-drift") {
        const mod = await import("@gamesweb/neon-drift");
        stage = "mount";
        instance = mod.mountNeonDrift(parent, platform, daily, playIndex);
      } else if (game!.id === "velocity-run") {
        const mod = await import("@gamesweb/velocity-run");
        stage = "mount";
        instance = mod.mountVelocityRun(parent, platform, playIndex);
      } else if (game!.id === "swarm-protocol") {
        const mod = await import("@gamesweb/swarm-protocol");
        stage = "mount";
        instance = mod.mountSwarmProtocol(parent, platform);
      } else if (game!.id === "sky-stack") {
        const mod = await import("@gamesweb/sky-stack");
        stage = "mount";
        instance = mod.mountSkyStack(parent, platform);
      } else if (game!.id === "knockout-circuit") {
        const mod = await import("@gamesweb/knockout-circuit");
        stage = "mount";
        instance = mod.mountKnockoutCircuit(parent, platform, playIndex);
      } else if (game!.id === "pocket-striker") {
        const mod = await import("@gamesweb/pocket-striker");
        stage = "mount";
        instance = mod.mountPocketStriker(parent, platform, playIndex);
      } else if (game!.id === "territory-rush") {
        const mod = await import("@gamesweb/territory-rush");
        stage = "mount";
        instance = mod.mountTerritoryRush(parent, platform, playIndex);
      } else {
        const mod = await import("@gamesweb/crowd-control");
        stage = "mount";
        instance = mod.mountCrowdControl(parent, platform, playIndex);
      }
      stage = "create";
      if (dead) {
        instance.destroy(true);
        return;
      }
      const fit = () => {
        const w = parent.clientWidth;
        const h = parent.clientHeight;
        if (w > 0 && h > 0) instance?.scale.resize(w, h);
      };
      fit();
      const ro = new ResizeObserver(fit);
      ro.observe(parent);
      phaser.current = instance;
      cleanupRo = () => {
        ro.disconnect();
      };
    }
    let cleanupRo: () => void = () => undefined;
    const watchdog = window.setTimeout(() => {
      if (dead || loadedRef.current) return;
      setBootError(`timeout:${stage}`);
      analytics.track("game_boot_failed", { gameId: game.id, stage, message: `timeout:${stage}` });
    }, 12_000);
    void boot().catch((err: unknown) => {
      const message = err instanceof Error ? err.message : "boot_failed";
      setBootError(`${stage}:${message.slice(0, 80)}`);
      analytics.track("game_boot_failed", { gameId: game.id, stage, message: message.slice(0, 160) });
    });
    return () => {
      dead = true;
      window.clearInterval(t);
      window.clearTimeout(watchdog);
      cleanupRo();
      phaser.current?.destroy(true);
      phaser.current = null;
    };
  }, [game, store, boot]);

  useEffect(() => {
    if (!acceptHistory.current) {
      historyLen.current = player.history.length;
      return;
    }
    if (player.history.length > historyLen.current) {
      const last = player.history[0];
      if (last && last.gameId === game?.id && last.result !== "attempt-death" && last.metadata?.hideResult !== true) {
        runEndedAt.current = Date.now();
        setResult({
          score: last.score,
          result: last.result,
          gameId: last.gameId,
          durationMs: last.durationMs,
          metadata: last.metadata,
        });
      }
    }
    historyLen.current = player.history.length;
  }, [player.history, game?.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setPaused((p) => {
          const next = !p;
          phaser.current?.events.emit(next ? "platform-pause" : "platform-resume");
          return next;
        });
      }
      if (e.key === "r" || e.key === "R") {
        if (runEndedAt.current && Date.now() - runEndedAt.current < RESULT_INPUT_GRACE_MS) return;
        setPaused(false);
        setResult(null);
        phaser.current?.events.emit("platform-resume");
      }
    };
    const onVis = () => {
      if (document.hidden) {
        setPaused(true);
        phaser.current?.events.emit("platform-pause");
      }
    };
    const onWindowBlur = () => {
      const kb = phaser.current?.input?.keyboard as { resetKeys?: () => void } | undefined;
      kb?.resetKeys?.();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onWindowBlur);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, []);

  const quests = dailyQuests(player.dayKey);
  const next = useMemo(() => {
    const ids = recommend({
      history: player.history.map((h) => ({ gameId: h.gameId, durationMs: h.durationMs, at: h.at })),
      playedIds: store.playedIds(),
      challengeGameIds: quests.map((q) => q.gameId).filter((id): id is string => Boolean(id)),
      friendsPlaying: [],
      lastResult: result
        ? { gameId: result.gameId, improved: true, retries: player.history.filter((h) => h.gameId === result.gameId).length }
        : undefined,
    });
    return GAME_MANIFESTS.find((g) => g.id === ids.find((id) => id !== game?.id)) ?? GAME_MANIFESTS.find((g) => g.id !== game?.id);
  }, [player, quests, result, store, game?.id]);

  if (!game) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <p>Unknown game.</p>
        <Link href="/">Back</Link>
      </div>
    );
  }

  const gameId = game.id;

  const daily = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("daily") === "1";
  const pbMode = boardModeFromPlayIndex(gameId, resolvePlayIndex(gameId), daily);
  const pb = store.personalBest(gameId, pbMode, lowerIsBetter(gameId));
  const friendsHere = player.friends.filter((f) => f.status === "accepted" && f.gameId === gameId);

  function resume() {
    setPaused(false);
    phaser.current?.events.emit("platform-resume");
  }

  function retry() {
    retries.current += 1;
    const since = runEndedAt.current ? Date.now() - runEndedAt.current : 0;
    analytics.track("game_retry", {
      gameId,
      time_since_run_end_ms: since,
      retry_count_session: retries.current,
    });
    setResult(null);
    setPaused(false);
    const g = phaser.current as (Phaser.Game & { restartRun?: () => void }) | null;
    if (g?.restartRun) {
      g.restartRun();
      return;
    }
    phaser.current?.destroy(true);
    phaser.current = null;
    setLoaded(false);
    loadedRef.current = false;
    setLoadPct(10);
    setBoot((n) => n + 1);
  }

  const needsLandscape = game.orientation === "landscape";

  return (
    <div className="relative h-dvh bg-black text-white" style={{ ["--accent" as string]: game.accent }}>
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-3 py-2 transition-opacity ${intense && !paused && !result ? "opacity-0 hover:opacity-100" : "opacity-100"}`}
      >
        <div className="pointer-events-auto flex items-center gap-3">
          <button type="button" onClick={() => router.push(`/games/${game.slug}`)} className="text-[13px] text-white/70">
            Back
          </button>
          <p className="text-[13px]">{game.title}</p>
        </div>
        <div className="pointer-events-auto flex items-center gap-3 text-[12px] text-white/70">
          {friendsHere[0] ? <span>{friendsHere[0].displayName} is playing</span> : null}
          <Link href="/settings">Settings</Link>
          <button
            type="button"
            onClick={() => {
              const el = wrap.current?.parentElement;
              void el?.requestFullscreen?.();
            }}
          >
            Fullscreen
          </button>
        </div>
      </div>

      {!loaded && !bootError ? (
        <div className="absolute inset-0 z-10 grid place-items-center bg-[var(--bg)]">
          <div className="w-[min(420px,90vw)] text-center">
            <p className="display text-[40px]">{game.title}</p>
            <p className="mt-2 text-[13px] text-white/55">{game.howToPlay[0]}</p>
            <div className="mx-auto mt-6 h-1 w-48 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-[var(--accent)]" style={{ width: `${loadPct}%` }} />
            </div>
          </div>
        </div>
      ) : null}

      {bootError ? (
        <div className="absolute inset-0 z-30 grid place-items-center bg-black">
          <div className="w-[min(360px,90vw)] text-center">
            <p className="display text-[36px]">Game failed to load</p>
            <p className="mt-2 text-[13px] text-white/55">The world did not boot. Your progress is still on this device.</p>
            {process.env.NODE_ENV !== "production" ? (
              <p className="mt-2 font-mono text-[11px] text-white/40">{bootError}</p>
            ) : null}
            <button
              type="button"
              className="mt-6 rounded-full bg-white px-5 py-3 text-[14px] text-black"
              onClick={() => {
                setBootError(null);
                setLoaded(false);
                loadedRef.current = false;
                setLoadPct(10);
                setBoot((n) => n + 1);
              }}
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}

      {needsLandscape ? (
        <div className="pointer-events-none absolute inset-0 z-30 hidden items-center justify-center bg-black/80 portrait:flex">
          <p className="pointer-events-auto px-8 text-center text-[15px]">Rotate your device</p>
        </div>
      ) : null}

      <div
        ref={wrap}
        className="absolute inset-0 z-0 overflow-hidden [&_canvas]:!h-full [&_canvas]:!w-full [&_canvas]:!max-h-full [&_canvas]:!max-w-full"
        onPointerDown={() => {
          const canvas = wrap.current?.querySelector("canvas");
          if (canvas instanceof HTMLCanvasElement) canvas.focus({ preventScroll: true });
        }}
      />

      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-between px-4 py-3 text-[11px] text-white/55 transition-opacity ${intense && !paused && !result ? "opacity-0" : "opacity-100"}`}
      >
        <span>
          Record {Number.isFinite(pb) && pb > 0 && pb < 1e12 ? formatScore(game.id, pb) : "—"}
        </span>
        <span>
          {quests.find((q) => q.gameId === game.id)?.title ?? "Open challenge"}
        </span>
        <button
          type="button"
          className="pointer-events-auto text-white/80"
          onClick={async () => {
            await navigator.clipboard.writeText(store.inviteLink(game.slug));
            store.markInvite();
            analytics.track("game_shared", { gameId: game.id });
          }}
        >
          Invite
        </button>
      </div>

      {paused && !result ? <PauseOverlay game={game} onResume={resume} onRestart={retry} /> : null}

      {result ? (
        <Results
          gameId={result.gameId}
          score={result.score}
          result={result.result}
          durationMs={result.durationMs}
          metadata={result.metadata}
          onRetry={retry}
          onContinueEndless={() => {
            setResult(null);
            phaser.current?.events.emit("continue-endless");
          }}
          nextSlug={next?.slug}
          nextTitle={next?.title}
        />
      ) : null}
      <InputProbe />
    </div>
  );
}

function Results({
  gameId,
  score,
  result,
  durationMs,
  metadata,
  onRetry,
  onContinueEndless,
  nextSlug,
  nextTitle,
}: {
  gameId: string;
  score: number;
  result: string;
  durationMs: number;
  metadata?: Record<string, number | string | boolean>;
  onRetry: () => void;
  onContinueEndless?: () => void;
  nextSlug?: string;
  nextTitle?: string;
}) {
  const store = useStore();
  const player = usePlayer();
  const quests = dailyQuests(player.dayKey);
  const done = quests.filter((q) => player.questCompleted.includes(q.id)).length;
  const retries = player.history.filter((h) => h.gameId === gameId).length;
  const params = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const challengeCode = (params.get("c") ?? params.get("challenge") ?? "").toUpperCase();
  const payload = params.get("p");
  const daily = params.get("daily") === "1";
  const partyCode = params.get("party");
  const gpRound = params.get("gp");
  const [copied, setCopied] = useState(false);
  const [challengeOutcome, setChallengeOutcome] = useState<string | null>(null);
  const applied = useRef(false);

  const pbImproved =
    typeof metadata?.pbDelta === "number" &&
    (lowerIsBetter(gameId) ? metadata.pbDelta <= 0 : Number(metadata.pbDelta) > 0);

  const friendsAhead = player.friends
    .filter((f) => f.status === "accepted")
    .slice(0, 2)
    .map((f) => ({
      name: f.displayName,
      gameId,
      deltaLabel: f.gameId === gameId ? "playing now" : "challenge them",
      href: `/play/${gameId}`,
    }));

  const arcade = arcadeStore.view();
  const day = utcDayKey();
  const dailyEvents = dailyArcadeEvents(day);
  const dailyDone = arcade.daily.day === day ? arcade.daily.completed.length : 0;
  const openLocal = arcade.challenges.find((c) => c.status === "open" && c.challengerId !== player.id);

  // Once the challenge is beaten, "Beat challenger" would loop back to the magic
  // page; the meaningful next action is to send the rematch.
  const wonChallenge = challengeOutcome === "win";
  const action = nextBestAction({
    recentRuns: player.history.slice(0, 8).map((h) => ({ gameId: h.gameId, score: h.score, result: h.result, at: h.at })),
    retries,
    pbImproved,
    lastGameId: gameId,
    gamesPlayed: [...new Set(player.history.map((h) => h.gameId))],
    friendsAhead: friendsAhead.length ? friendsAhead : undefined,
    openChallenge: wonChallenge
      ? undefined
      : challengeCode && challengeCode !== "NEW"
        ? { code: challengeCode, gameId, from: "challenger" }
        : openLocal
          ? { code: openLocal.publicCode, gameId: openLocal.gameId, from: openLocal.challengerName }
          : undefined,
    daily: daily ? { remaining: Math.max(0, dailyEvents.length - dailyDone) } : undefined,
    party: partyCode ? { code: partyCode, nextRound: true } : undefined,
  });
  const continueEndless = metadata?.continueEndless === true;

  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    analytics.track("game_finished", { gameId, score });
    arcadeStore.contributeCrew();
    if (challengeCode && challengeCode !== "NEW") {
      const r = arcadeStore.completeChallenge(
        challengeCode,
        {
          id: crypto.randomUUID?.() ?? `att-${Date.now()}`,
          playerId: player.id,
          playerName: player.displayName || "Guest",
          score,
          runId: null,
          trust: player.syncStatus === "saved" ? "verified" : "unverified",
          createdAt: Date.now(),
          metadata: { durationMs },
        },
        payload,
      );
      if (r.ok && r.outcome !== "pending") setChallengeOutcome(r.outcome);
    }
    if (daily) {
      const event = dailyEvents.find((e) => e.gameId === gameId);
      arcadeStore.dailyProgress(day, `${gameId}:${event?.mode ?? "daily"}`, normalizePerformance(gameId, score));
    }
    if (partyCode) {
      arcadeStore.scorePartyRound(partyCode, [{ id: player.id, name: player.displayName || "You", score }], gameId);
    }
    if (gpRound) arcadeStore.gpScore(Math.max(0, Number(metadata?.gpRound ?? 0)), 10);
  }, [
    challengeCode,
    daily,
    day,
    dailyEvents,
    durationMs,
    gameId,
    gpRound,
    metadata?.gpRound,
    partyCode,
    payload,
    player.displayName,
    player.id,
    player.syncStatus,
    score,
  ]);

  function makeChallenge() {
    const game = getManifest(gameId);
    const made = arcadeStore.createChallenge({
      gameId,
      mode: boardModeFromPlayIndex(gameId, resolvePlayIndex(gameId), daily),
      seed: params.get("seed") ?? `${gameId}:${Date.now()}`,
      type: game ? defaultChallengeType(game) : "beat-score",
      challengerId: player.id,
      challengerName: player.displayName || "Player",
      score,
      trust: player.syncStatus === "saved" ? "verified" : "unverified",
    });
    void navigator.clipboard.writeText(`${window.location.origin}${made.url}`);
    setCopied(true);
    analytics.track("challenge_shared", { gameId, code: made.challenge.publicCode });
    analytics.track("social_action_after_result", { gameId, type: "challenge" });
  }

  const pbDelta = typeof metadata?.pbDelta === "number" ? metadata.pbDelta : null;
  const retryHint = typeof metadata?.retryHint === "string" ? metadata.retryHint : null;
  const bestCombo = typeof metadata?.bestCombo === "number" ? metadata.bestCombo : null;
  const bestDrift = typeof metadata?.bestDrift === "number" ? metadata.bestDrift : null;
  const cleanSectors = typeof metadata?.cleanSectors === "number" ? metadata.cleanSectors : null;
  const medal = typeof metadata?.medal === "string" ? metadata.medal : null;
  const nextMedal = typeof metadata?.nextMedal === "string" ? metadata.nextMedal : null;
  const medalGap = typeof metadata?.medalGap === "number" ? metadata.medalGap : null;
  const kills = typeof metadata?.kills === "number" ? metadata.kills : null;
  const level = typeof metadata?.level === "number" ? metadata.level : null;
  const buildHint = typeof metadata?.buildHint === "string" ? metadata.buildHint : null;
  const boss = metadata?.boss === true || metadata?.boss === "defeated";

  const hollow = score === 0;
  const shownAt = useRef(0);
  if (shownAt.current === 0 && typeof performance !== "undefined") shownAt.current = performance.now();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R" || e.key === " ") {
        e.preventDefault();
        // A tap still in the play rhythm should not skip the recap.
        if (performance.now() - shownAt.current < RESULT_INPUT_GRACE_MS) return;
        onRetry();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onRetry]);

  const game = getManifest(gameId);
  const pbTone =
    pbDelta === null
      ? ""
      : lowerIsBetter(gameId)
        ? pbDelta <= 0
          ? "text-emerald-300"
          : "text-rose-300"
        : pbDelta >= 0
          ? "text-emerald-300"
          : "text-rose-300";
  const pbLabel =
    pbDelta === null
      ? null
      : lowerIsBetter(gameId)
        ? pbDelta <= 0
          ? `PB ${(pbDelta / 1000).toFixed(3)}s`
          : `PB +${(pbDelta / 1000).toFixed(3)}s`
        : pbDelta >= 0
          ? `PB +${Math.round(pbDelta).toLocaleString()}`
          : `${Math.abs(Math.round(pbDelta)).toLocaleString()} off PB`;

  const primary = hollow ? (
    <ChamferButton onClick={onRetry}>Play again</ChamferButton>
  ) : continueEndless ? (
    <ChamferButton onClick={() => onContinueEndless?.()}>Continue Endless</ChamferButton>
  ) : wonChallenge ? (
    <ChamferButton
      onClick={() => {
        analytics.track("meaningful_action_after_result", { gameId, type: "rematch" });
        makeChallenge();
      }}
    >
      {copied ? "Rematch link copied" : "Send rematch"}
    </ChamferButton>
  ) : action.href.startsWith("/play/") && (action.type === "retry_pb" || action.type === "challenge_friend" || action.type === "beat_friend") ? (
    <ChamferButton
      onClick={() => {
        analytics.track("meaningful_action_after_result", { gameId, type: action.type });
        if (action.type === "challenge_friend") makeChallenge();
        else onRetry();
      }}
    >
      {action.type === "challenge_friend" ? (copied ? "Link copied" : action.label) : action.label}
    </ChamferButton>
  ) : (
    <ChamferButton href={action.href} onClick={() => analytics.track("meaningful_action_after_result", { gameId, type: action.type })}>
      {action.label}
    </ChamferButton>
  );

  return (
    <div className="absolute inset-0 z-40 overflow-auto bg-black/50">
      {game ? (
        <div className="pointer-events-none absolute inset-0">
          <GameArt slug={game.slug} variant="backdrop" className="h-full w-full opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25" />
        </div>
      ) : null}
      <div className="relative mx-auto flex min-h-full w-[min(560px,94vw)] flex-col justify-end px-5 py-10 md:px-8">
        <p className="meta text-white/50">{result}</p>
        {hollow ? (
          <>
            <p className="display mt-3 text-[48px] leading-none text-white md:text-[72px]">No score banked</p>
            {gameId === "neon-drift" ? (
              <p className="mt-5 text-[15px] tracking-[0.08em] text-white/80">HOLD DRIFT → COMBO → BANK IT</p>
            ) : (
              <p className="mt-5 text-[15px] text-white/70">{retryHint ?? "Run it again. The score is still waiting."}</p>
            )}
          </>
        ) : (
          <p className="display mt-3 text-[88px] leading-none text-white md:text-[128px]">{formatScore(gameId, score)}</p>
        )}
        {challengeOutcome ? (
          <p className="mt-3 text-[16px] text-emerald-300">
            {challengeOutcome === "win" ? "You won" : challengeOutcome === "draw" ? "Draw" : "They still lead"}
          </p>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 text-[13px] text-white/60">
          {pbLabel ? <p className={pbTone}>{pbLabel}</p> : null}
          {medal ? (
            <p>
              {medal}
              {nextMedal && medalGap !== null ? ` · ${nextMedal} in ${(medalGap / 1000).toFixed(3)}s` : ""}
            </p>
          ) : null}
          {bestCombo !== null ? <p>Combo {bestCombo}x</p> : null}
          {bestDrift !== null ? <p>Best drift {Math.round(bestDrift).toLocaleString()}</p> : null}
          {cleanSectors !== null ? <p>Clean sectors {cleanSectors}</p> : null}
          {kills !== null ? (
            <p>
              {kills} kills · lv {level ?? 1}
              {boss ? " · boss down" : ""}
            </p>
          ) : null}
        </div>
        {retryHint ? <p className="mt-3 text-[14px] text-white/75">{retryHint}</p> : null}
        {buildHint ? <p className="mt-1 text-[13px] text-white/55">{buildHint}</p> : null}

        <p className="mt-5 text-[13px] text-white/50">
          +run · Lv {store.view().level} · {done}/3 dailies
        </p>
        <p className="mt-1 text-[12px] text-white/40">
          {player.syncStatus === "saving"
            ? "Saving…"
            : player.syncStatus === "offline"
              ? "Saved locally"
              : player.syncStatus === "review"
                ? "Score under review"
                : player.syncStatus === "saved"
                  ? "Saved"
                  : null}
        </p>

        <div className="mt-8 flex flex-col items-start gap-3">
          {primary}
          {copied ? <p className="text-[12px] text-white/50">Challenge link copied</p> : null}
          {action.type !== "retry_pb" && !continueEndless && !hollow ? (
            <ChamferButton tone="ghost" cue={false} onClick={onRetry}>
              Play again
            </ChamferButton>
          ) : null}
          {action.type !== "challenge_friend" && !wonChallenge ? (
            <ChamferButton tone="quiet" cue={false} onClick={makeChallenge}>
              Share challenge
            </ChamferButton>
          ) : nextSlug ? (
            <Link
              href={`/play/${nextSlug}`}
              onClick={() => analytics.track("recommendation_clicked", { from: gameId, to: nextSlug })}
              className="home-secondary"
            >
              Try {nextTitle ?? "another game"} ›
            </Link>
          ) : null}
        </div>
        <p className="mt-5 text-[11px] text-white/35">R or Space retries</p>
      </div>
    </div>
  );
}

function InputProbe() {
  const [on, setOn] = useState(false);
  const [line, setLine] = useState("");
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!new URLSearchParams(window.location.search).has("gwinput")) return;
    setOn(true);
    const t = window.setInterval(() => {
      const d = (window as Window & { __GW_DEBUG__?: Record<string, unknown> }).__GW_DEBUG__;
      const a = document.activeElement;
      const canvas = document.querySelector("canvas");
      const kb = (window as Window & { __GW_KEYS__?: Record<string, boolean> }).__GW_KEYS__;
      setLine(
        [
          `doc=${document.hasFocus()} win=${document.hasFocus()} el=${a?.tagName ?? "?"}`,
          `canvas=${canvas instanceof HTMLCanvasElement ? `${canvas.width}x${canvas.height} tab=${canvas.tabIndex}` : "none"}`,
          `th=${d?.throttle ?? "-"} st=${d?.speed ?? "-"} x=${Math.round(Number(d?.playerX ?? 0))} y=${Math.round(Number(d?.playerY ?? 0))} ang=${Number(d?.playerAngle ?? 0).toFixed?.(2) ?? "-"}`,
          `tick=${d?.tick ?? "-"} paused=${d?.paused ?? "-"} ended=${d?.ended ?? "-"} scene=${d?.scene ?? "-"} src=${d?.inputSource ?? "-"}`,
          kb ? `W${kb.up ? 1 : 0}A${kb.left ? 1 : 0}S${kb.down ? 1 : 0}D${kb.right ? 1 : 0}Sp${kb.jump ? 1 : 0}` : "",
        ].join(" | "),
      );
    }, 120);
    return () => window.clearInterval(t);
  }, []);
  if (!on) return null;
  return (
    <p className="pointer-events-none absolute bottom-14 left-3 z-50 font-mono text-[10px] text-white/70">{line}</p>
  );
}
