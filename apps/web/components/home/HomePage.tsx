"use client";

import { GAME_MANIFESTS, getManifest, nextBestAction, utcDayKey, dailyArcadeEvents } from "@gamesweb/game-sdk";
import { useArcade } from "@/lib/social/use-arcade";
import { levelFromXp } from "@gamesweb/config";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GameArt } from "@/components/game/GameArt";
import { ActivityCard, ActivityRail, EmptyState, QuickAction, SectionHeader } from "@/components/platform";
import { useAccent } from "@/components/shell/AppShell";
import { usePlayer, useStore } from "@/lib/player";
import { focusedGameContext } from "@/lib/platform/focus";
import { formatPlayScore, hasRecord } from "@/lib/platform/format";
import { loadPlayIndex, playModeOptions, savePlayIndex } from "@/lib/platform/modes";

export default function HomePage() {
  const player = usePlayer();
  const store = useStore();
  const router = useRouter();
  const [focus, setFocus] = useState(0);
  const [playIndex, setPlayIndex] = useState(0);
  const [modeOpen, setModeOpen] = useState(false);
  const game = GAME_MANIFESTS[focus] ?? GAME_MANIFESTS[0];
  useAccent(game.accent);
  const lv = levelFromXp(player.xp);
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
        router.push(`/play/${game.slug}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game.slug, router, setFocusSafe]);

  const modes = playModeOptions(game.id);
  const fade = reduced ? "" : "duration-[320ms] ease-[var(--ease-out)]";
  const line = ctx.pbLabel ? `${ctx.modeLabel} · Personal best ${ctx.pbLabel}` : ctx.modeLabel;
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
  const touristLeft = Math.max(0, 5 - played.size);

  return (
    <div className="relative min-h-dvh" data-testid="games-home">
      <div className={`absolute inset-0 overflow-hidden ${reduced ? "" : "transition-opacity duration-[320ms]"}`}>
        <GameArt
          slug={game.slug}
          variant="backdrop"
          className="absolute inset-0 h-full w-full max-md:scale-125 max-md:object-[62%_38%]"
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[min(58%,42rem)] bg-gradient-to-r from-black/78 via-black/36 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[min(38%,28rem)] bg-gradient-to-l from-black/55 to-transparent md:block" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      <div className="relative flex min-h-[min(88dvh,920px)] flex-col px-5 pb-10 pt-[calc(var(--header-h)+16px)] md:px-10">
        <div className="mt-auto grid gap-8 pb-4 pt-20 md:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] md:items-end">
          <div className={reduced ? "" : "transition-all duration-[300ms]"}>
            <p className="meta text-white/60">{game.genre}</p>
            <h1 className="display mt-2 text-[40px] text-white md:text-[64px]">{game.title}</h1>
            <p className="mt-2 max-w-md text-[15px] text-white/72">{game.tagline}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <QuickAction href={`/play/${game.slug}`}>{ctx.playLabel}</QuickAction>
              <QuickAction href="/daily" tone="ghost">
                Daily Arcade
              </QuickAction>
              <QuickAction href="/party" tone="ghost">
                Party
              </QuickAction>
              <QuickAction href="/grand-prix" tone="ghost">
                Grand Prix
              </QuickAction>
            </div>
            {nba.type !== "play" ? (
              <p className="mt-3 text-[13px] text-white/80">
                <Link href={nba.href} className="underline decoration-white/25">
                  {nba.label}
                </Link>
                <span className="text-white/45"> · {nba.reason}</span>
              </p>
            ) : null}
            <p className="mt-3 text-[13px] text-white/55">
              {line || "Set a first record"}
              {modes.length > 1 ? (
                <button
                  type="button"
                  className="ml-3 text-[12px] text-white/40"
                  aria-expanded={modeOpen}
                  onClick={() => setModeOpen((v) => !v)}
                >
                  Change
                </button>
              ) : null}
            </p>
            {modeOpen && modes.length > 1 ? (
              <div className="relative">
                <div className="absolute left-0 top-2 z-10 min-w-[180px] bg-black/80 py-1" role="listbox">
                  {modes.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      role="option"
                      aria-selected={String(playIndex) === m.id}
                      className={`block min-h-9 w-full px-3 text-left text-[12px] ${
                        String(playIndex) === m.id ? "text-white" : "text-white/50"
                      }`}
                      onClick={() => {
                        setPlayIndex(Number(m.id));
                        savePlayIndex(game.id, Number(m.id));
                        setModeOpen(false);
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <aside className="hidden space-y-3 md:block" aria-label="Focused game status">
            <HomePanel kicker="Record" title={ctx.pbLabel ?? "No record yet"} body={ctx.pbLabel ? ctx.modeLabel : `Set your first ${game.title} score.`} />
            <HomePanel
              kicker="Rival"
              title={rival ? rival.otherName : "No rivalry yet"}
              body={rival ? `${rival.winsA}–${rival.winsB} · ${rival.totalMatches} matches` : "Beat a challenge to start one."}
            />
            <HomePanel
              kicker="Daily"
              title={dailyLeft[0] ? dailyLeft[0].label : "Daily clear"}
              body={dailyLeft[0] ? `${dailyLeft.length} event${dailyLeft.length === 1 ? "" : "s"} left today` : "Every event is done. Come back tomorrow."}
            />
          </aside>
        </div>
      </div>

      <section className="relative px-5 pb-12 md:px-10" aria-label="All games">
        <SectionHeader title="All games" meta={`${GAME_MANIFESTS.length} worlds · ${lv.level}`} />
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4" role="listbox" aria-label="Games">
          {GAME_MANIFESTS.map((g, i) => {
            const on = i === focus;
            const badges = [
              dailyIds.has(g.id) ? "Daily" : null,
              challengeIds.has(g.id) ? "Challenge" : null,
              played.has(g.id) ? "Played" : null,
            ].filter(Boolean) as string[];
            return (
              <button
                key={g.id}
                type="button"
                role="option"
                aria-selected={on}
                aria-label={g.title}
                onClick={() => setFocus(i)}
                className={`group relative overflow-hidden text-left ${fade} ${on ? "ring-2 ring-white/80" : "opacity-85 hover:opacity-100"}`}
                style={{ aspectRatio: "16 / 9" }}
              >
                <GameArt slug={g.slug} variant="tile" className="h-full w-full transition-transform duration-300 group-hover:scale-[1.04]" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-3">
                  <span className="meta block text-white/60">{g.genre}</span>
                  <span className="display mt-0.5 block text-[18px] text-white md:text-[22px]">{g.title}</span>
                  {badges.length ? (
                    <span className="mt-1 flex flex-wrap gap-1">
                      {badges.map((b) => (
                        <span key={b} className="rounded-full bg-white/12 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/80">
                          {b}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {openChallenges.length ? (
        <section className="relative px-5 pb-10 md:px-10" aria-label="Challenges">
          <SectionHeader title="Challenges" meta={`${openChallenges.length} open`} action={<QuickAction href="/inbox" tone="quiet">Inbox</QuickAction>} />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {openChallenges.slice(0, 3).map((c) => {
              const g = getManifest(c.gameId);
              return (
                <Link key={c.id} href={`/c/${c.publicCode}`} className="relative min-h-[140px] overflow-hidden">
                  {g ? <GameArt slug={g.slug} variant="tile" className="absolute inset-0 h-full w-full" /> : null}
                  <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                  <span className="relative flex h-full flex-col justify-end p-4">
                    <span className="meta text-white/65">{c.challengerName}</span>
                    <span className="display mt-1 text-[24px] text-white">{g?.title ?? c.gameId}</span>
                    <span className="mt-1 text-[12px] text-white/70">{c.type.replace("-", " ")}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {dailyLeft.length ? (
        <section className="relative px-5 pb-10 md:px-10" aria-label="Daily Arcade">
          <SectionHeader title="Daily Arcade" meta={`${dailyLeft.length} remaining`} action={<QuickAction href="/daily" tone="quiet">Open</QuickAction>} />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {dailyLeft.slice(0, 3).map((e) => {
              const g = getManifest(e.gameId);
              if (!g) return null;
              return (
                <Link key={`${e.gameId}:${e.mode}`} href={`/play/${g.slug}?daily=1`} className="relative min-h-[132px] overflow-hidden">
                  <GameArt slug={g.slug} variant="tile" className="absolute inset-0 h-full w-full" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <span className="relative flex h-full flex-col justify-end p-4">
                    <span className="meta text-white/65">Daily</span>
                    <span className="display mt-1 text-[24px] text-white">{e.label}</span>
                    <span className="mt-1 text-[12px] text-white/70">{e.mode}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {snap.rivals.length ? (
        <section className="relative px-5 pb-10 md:px-10" aria-label="Rivals">
          <SectionHeader title="Rivals" action={<QuickAction href="/friends" tone="quiet">Friends</QuickAction>} />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {snap.rivals.slice(0, 3).map((r) => (
              <div key={r.otherId} className="bg-black/35 px-4 py-4">
                <p className="meta text-white/55">Rivalry</p>
                <p className="display mt-1 text-[26px] text-white">{r.otherName}</p>
                <p className="mt-1 text-[13px] text-white/70">
                  {r.winsA}–{r.winsB}
                  {r.draws ? ` · ${r.draws} draws` : ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {lastGame ? (
        <section className="relative px-5 pb-10 md:px-10" aria-label="Continue">
          <SectionHeader title="Continue" />
          <Link href={`/play/${lastGame.slug}`} className="relative mt-4 block min-h-[160px] overflow-hidden md:min-h-[200px]">
            <GameArt slug={lastGame.slug} variant="hero" className="absolute inset-0 h-full w-full" />
            <span className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
            <span className="relative flex min-h-[160px] flex-col justify-end p-5 md:min-h-[200px]">
              <span className="meta text-white/65">Last run</span>
              <span className="display mt-1 text-[32px] text-white">{lastGame.title}</span>
              <span className="mt-1 text-[13px] text-white/70">
                {formatPlayScore(lastGame.id, lastRun.score) ?? lastGame.sessionHint}
              </span>
            </span>
          </Link>
        </section>
      ) : null}

      <section className="relative px-5 pb-16 md:px-10" aria-label="Activities">
        <p className="meta">Activities</p>
        <div className="mt-4">
          {played.size === 0 ? (
            <div className="space-y-4">
              <EmptyState
                title="Arcade Tourist"
                body="Play 5 different games. The next-best-action loop starts after your first finish."
                slug={game.slug}
                action={<QuickAction href={`/play/${game.slug}`}>Start with {game.title}</QuickAction>}
              />
              <ActivityRail>
                {GAME_MANIFESTS.slice(0, 3).map((g, i) => (
                  <ActivityCard
                    key={g.id}
                    featured={i === 0}
                    slug={g.slug}
                    kicker={g.genre}
                    title={g.title}
                    meta={g.tagline}
                    href={`/play/${g.slug}`}
                    cta="Play"
                  />
                ))}
              </ActivityRail>
            </div>
          ) : (
            <ActivityRail>
              {ctx.daily ? (
                <ActivityCard
                  featured
                  slug={game.slug}
                  kicker="Daily"
                  title={ctx.daily.label}
                  progress={Number(ctx.daily.current.replace(/[^\d.-]/g, "")) || 0}
                  target={Number(ctx.daily.target.replace(/[^\d.-]/g, "")) || 1}
                  reward={ctx.daily.done ? "Complete" : "+XP"}
                  href={`/play/${game.slug}`}
                  cta={ctx.daily.done ? "Replay" : "Continue"}
                />
              ) : touristLeft > 0 ? (
                <ActivityCard
                  featured
                  slug={GAME_MANIFESTS.find((g) => !played.has(g.id))?.slug ?? game.slug}
                  kicker="Arcade Tourist"
                  title={`${touristLeft} worlds left`}
                  meta="Play 5 different games to unlock the tourist trophy."
                  href={`/play/${GAME_MANIFESTS.find((g) => !played.has(g.id))?.slug ?? game.slug}`}
                  cta="Play"
                />
              ) : (
                <ActivityCard
                  featured
                  slug={game.slug}
                  kicker="Session"
                  title={game.title}
                  meta={`${lv.level} · ${ctx.pbLabel ?? "set a first record"}`}
                  href={`/play/${game.slug}`}
                  cta={ctx.playLabel}
                />
              )}
              {ctx.nextTrophy ? (
                <ActivityCard
                  slug={game.slug}
                  kicker="Next trophy"
                  title={ctx.nextTrophy.name}
                  meta={ctx.nextTrophy.description}
                  href={`/achievements`}
                  cta="Trophies"
                  reward=""
                />
              ) : (
                <ActivityCard
                  slug={GAME_MANIFESTS[(focus + 2) % GAME_MANIFESTS.length].slug}
                  kicker="World tour"
                  title={GAME_MANIFESTS[(focus + 2) % GAME_MANIFESTS.length].title}
                  meta={GAME_MANIFESTS[(focus + 2) % GAME_MANIFESTS.length].tagline}
                  href={`/play/${GAME_MANIFESTS[(focus + 2) % GAME_MANIFESTS.length].slug}`}
                  cta="Play"
                />
              )}
              {ctx.friendBest?.scoreLabel ? (
                <ActivityCard
                  slug={game.slug}
                  kicker="Friend score"
                  title={ctx.friendBest.name}
                  meta={ctx.friendBest.scoreLabel}
                  href={`/friends`}
                  cta="Friends"
                />
              ) : (
                <ActivityCard
                  slug={GAME_MANIFESTS[(focus + 1) % GAME_MANIFESTS.length].slug}
                  kicker={hasRecord(ctx.pb) ? "Record" : "Next up"}
                  title={hasRecord(ctx.pb) ? (ctx.pbLabel ?? game.title) : GAME_MANIFESTS[(focus + 1) % GAME_MANIFESTS.length].title}
                  meta={hasRecord(ctx.pb) ? ctx.modeLabel : GAME_MANIFESTS[(focus + 1) % GAME_MANIFESTS.length].tagline}
                  href={hasRecord(ctx.pb) ? `/play/${game.slug}` : `/play/${GAME_MANIFESTS[(focus + 1) % GAME_MANIFESTS.length].slug}`}
                  cta="Play"
                />
              )}
            </ActivityRail>
          )}
        </div>
      </section>
    </div>
  );
}

function HomePanel({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <div className="bg-black/45 px-4 py-3 backdrop-blur-sm">
      <p className="meta text-white/50">{kicker}</p>
      <p className="mt-1 text-[16px] text-white">{title}</p>
      <p className="mt-0.5 text-[12px] text-white/60">{body}</p>
    </div>
  );
}
