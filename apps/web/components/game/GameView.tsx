"use client";

import { analytics } from "@gamesweb/analytics";
import { dailyQuests, GAME_MANIFESTS, getManifest, recommend } from "@gamesweb/game-sdk";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAccent } from "@/components/shell/AppShell";
import { usePlayer, useStore } from "@/lib/player";
import { formatScore } from "@/lib/player-store";
import type { PlatformSDK } from "@gamesweb/game-sdk";
import type Phaser from "phaser";

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
  const [bootError, setBootError] = useState(false);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<null | {
    score: number;
    result: string;
    gameId: string;
    durationMs: number;
  }>(null);
  const [hud, setHud] = useState<Record<string, number>>({});
  const [intense, setIntense] = useState(false);
  const historyLen = useRef(player.history.length);

  useAccent(game?.accent);

  useEffect(() => {
    if (!game) return;
    analytics.track("game_selected", { gameId: game.id });
    analytics.track("game_load_started", { gameId: game.id });
    setBootError(false);
    const t = window.setInterval(() => setLoadPct((p) => Math.min(92, p + 8)), 120);
    let dead = false;
    const platform: PlatformSDK = store.createPlatform(game.id, {
      onPause: () => setPaused(true),
      onHud: (p) => {
        setHud(p);
        setIntense((p.combo ?? 0) > 4 || (p.score ?? 0) > 0);
      },
    });

    async function boot() {
      const parent = wrap.current;
      if (!parent) return;
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      let instance: Phaser.Game | null = null;
      if (game!.id === "neon-drift") {
        const mod = await import("@gamesweb/neon-drift");
        instance = mod.mountNeonDrift(parent, platform);
      } else if (game!.id === "velocity-run") {
        const mod = await import("@gamesweb/velocity-run");
        instance = mod.mountVelocityRun(parent, platform);
      } else {
        const mod = await import("@gamesweb/swarm-protocol");
        instance = mod.mountSwarmProtocol(parent, platform);
      }
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
      setLoaded(true);
      analytics.track("game_loaded", { gameId: game!.id });
      cleanupRo = () => {
        ro.disconnect();
      };
    }
    let cleanupRo: () => void = () => undefined;
    void boot().catch(() => {
      setBootError(true);
      analytics.track("game_boot_failed", { gameId: game!.id });
    });
    return () => {
      dead = true;
      window.clearInterval(t);
      cleanupRo();
      phaser.current?.destroy(true);
      phaser.current = null;
    };
  }, [game, store, boot]);

  useEffect(() => {
    if (player.history.length > historyLen.current) {
      const last = player.history[0];
      if (last && last.gameId === game?.id) {
        setResult({ score: last.score, result: last.result, gameId: last.gameId, durationMs: last.durationMs });
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
    };
    const onVis = () => {
      if (document.hidden) {
        setPaused(true);
        phaser.current?.events.emit("platform-pause");
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVis);
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
        <Link href="/play">Back</Link>
      </div>
    );
  }

  const pb = store.personalBest(
    game.id,
    game.id === "velocity-run" ? "course-1" : game.id === "swarm-protocol" ? "survival" : "circuit",
    game.id === "velocity-run",
  );
  const friendsHere = player.friends.filter((f) => f.status === "accepted" && f.gameId === game.id);

  function resume() {
    setPaused(false);
    phaser.current?.events.emit("platform-resume");
  }

  function retry() {
    setResult(null);
    setPaused(false);
    phaser.current?.destroy(true);
    phaser.current = null;
    setLoaded(false);
    setLoadPct(10);
    setBoot((n) => n + 1);
  }

  const needsLandscape = game.orientation === "landscape";

  return (
    <div className="relative h-dvh bg-black text-white" style={{ ["--accent" as string]: game.accent }}>
      <div
        className={`absolute inset-x-0 top-0 z-20 flex items-center justify-between px-3 py-2 transition-opacity ${intense && !paused && !result ? "opacity-0 hover:opacity-100" : "opacity-100"}`}
      >
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.push(`/games/${game.slug}`)} className="text-[13px] text-white/70">
            Back
          </button>
          <p className="text-[13px]">{game.title}</p>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-white/70">
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
            <button
              type="button"
              className="mt-6 rounded-full bg-white px-5 py-3 text-[14px] text-black"
              onClick={() => {
                setBootError(false);
                setLoaded(false);
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

      <div ref={wrap} className="absolute inset-0 overflow-hidden [&_canvas]:!h-full [&_canvas]:!w-full [&_canvas]:!max-h-full [&_canvas]:!max-w-full" />

      <div
        className={`absolute inset-x-0 bottom-0 z-20 flex justify-between px-4 py-3 text-[11px] text-white/55 transition-opacity ${intense && !paused && !result ? "opacity-0" : "opacity-100"}`}
      >
        <span>
          Record {Number.isFinite(pb) && pb > 0 && pb < 1e12 ? formatScore(game.id, pb) : "—"}
        </span>
        <span>
          {quests.find((q) => q.gameId === game.id)?.title ?? "Open challenge"}
        </span>
        <button
          type="button"
          className="text-white/80"
          onClick={async () => {
            await navigator.clipboard.writeText(store.inviteLink(game.slug));
            store.markInvite();
            analytics.track("game_shared", { gameId: game.id });
          }}
        >
          Invite
        </button>
      </div>

      {paused && !result ? (
        <div className="absolute inset-0 z-40 grid place-items-center bg-black/55 backdrop-blur-sm">
          <div className="w-[min(360px,90vw)] rounded-2xl border border-white/10 bg-[#121214] p-6">
            <p className="display text-[32px]">Paused</p>
            <div className="mt-5 flex flex-col gap-2 text-[14px]">
              <button type="button" className="rounded-full bg-[var(--accent)] py-3 text-[#140d12]" onClick={resume}>
                Resume
              </button>
              <button type="button" className="rounded-full border border-white/15 py-3" onClick={retry}>
                Restart
              </button>
              <details className="rounded-xl bg-white/5 px-3 py-2">
                <summary>Controls</summary>
                <ul className="mt-2 space-y-1 text-[12px] text-white/70">
                  {game.controls.map((c) => (
                    <li key={c.input}>
                      {c.input} — {c.action}
                    </li>
                  ))}
                </ul>
              </details>
              <Link href="/settings" className="py-2 text-center text-white/70">
                Audio
              </Link>
              <Link href={`/games/${game.slug}`} className="py-2 text-center text-white/70">
                Exit game
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {result ? (
        <Results
          gameId={result.gameId}
          score={result.score}
          result={result.result}
          durationMs={result.durationMs}
          onRetry={retry}
          nextSlug={next?.slug}
          nextTitle={next?.title}
        />
      ) : null}
    </div>
  );
}

function Results({
  gameId,
  score,
  result,
  durationMs,
  onRetry,
  nextSlug,
  nextTitle,
}: {
  gameId: string;
  score: number;
  result: string;
  durationMs: number;
  onRetry: () => void;
  nextSlug?: string;
  nextTitle?: string;
}) {
  const store = useStore();
  const player = usePlayer();
  const quests = dailyQuests(player.dayKey);
  const done = quests.filter((q) => player.questCompleted.includes(q.id)).length;
  const retries = player.history.filter((h) => h.gameId === gameId).length;
  const primary =
    done >= 1 && nextSlug
      ? "challenge"
      : retries >= 4
        ? "other"
        : "retry";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R" || e.key === " ") {
        e.preventDefault();
        onRetry();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onRetry]);

  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-black/60 backdrop-blur-sm">
      <div className="w-[min(420px,92vw)] rounded-2xl border border-white/10 bg-[#121214] p-6">
        <p className="text-[12px] uppercase tracking-[0.18em] text-white/45">{result}</p>
        <p className="display mt-2 text-[48px]">{formatScore(gameId, score)}</p>
        <p className="mt-2 text-[13px] text-white/55">{Math.round(durationMs / 1000)}s · Lv {store.view().level}</p>
        <p className="mt-1 text-[13px] text-white/55">{done}/3 challenges today</p>
        <p className="mt-2 text-[12px] text-white/45">
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
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            className={`rounded-full py-3 text-[14px] ${primary === "retry" ? "bg-[var(--accent)] text-[#140d12]" : "border border-white/15"}`}
            onClick={onRetry}
          >
            Retry
          </button>
          {nextSlug ? (
            <Link
              href={`/play/${nextSlug}`}
              onClick={() => analytics.track("recommendation_clicked", { from: gameId, to: nextSlug })}
              className={`rounded-full py-3 text-center text-[14px] ${primary !== "retry" ? "bg-[var(--accent)] text-[#140d12]" : "border border-white/15"}`}
            >
              {primary === "challenge" ? "Next challenge" : "Try another game"}
              {nextTitle ? ` — ${nextTitle}` : ""}
            </Link>
          ) : null}
        </div>
        <p className="mt-4 text-center text-[11px] text-white/35">R or Space retries</p>
      </div>
    </div>
  );
}
