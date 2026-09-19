"use client";

import { getManifest, GRAND_PRIX_PLAYLIST } from "@gamesweb/game-sdk";
import { useArcade } from "@/lib/social/use-arcade";
import { EventRoute, GameBackdrop } from "@/components/visual";
import { ChamferButton } from "@/components/visual/ChamferButton";
import { useAccent } from "@/components/shell/AppShell";

export default function GrandPrixPage() {
  const gp = useArcade().grandPrix;
  const rounds = GRAND_PRIX_PLAYLIST.map((round, i) => {
    const game = getManifest(round.gameId);
    const scored = gp.scores[i] != null;
    return { round, game, scored, points: gp.scores[i] ?? 0, index: i };
  });
  const current = rounds.find((r) => !r.scored) ?? rounds[rounds.length - 1];
  const currentIdx = current?.index ?? 0;
  const cleared = rounds.every((r) => r.scored);
  useAccent(current?.game?.accent);

  return (
    <div data-testid="grand-prix">
      <GameBackdrop slug={current?.game?.slug ?? "sky-stack"} className="min-h-[72vh] md:min-h-[82vh]" dim={0.2} priority>
        <div className="flex min-h-[72vh] flex-col justify-end px-5 pb-10 pt-20 md:min-h-[82vh] md:px-10 md:pb-14">
          <p className="meta text-white/50">Arcade Grand Prix</p>
          <h1 className="display mt-3 max-w-[14ch] text-[48px] text-white md:text-[76px]">
            {cleared ? "Cup complete" : `Round ${currentIdx + 1}`}
          </h1>
          <p className="mt-3 text-[15px] text-white/70">
            {current?.game?.title} · {gp.points} pts stacked
          </p>
          <div className="home-progress mt-6 max-w-sm" aria-hidden>
            {rounds.map((r) => (
              <span key={r.index} className={r.scored || r === current ? "on" : ""} />
            ))}
          </div>
          {current?.game ? (
            <div className="mt-7">
              <ChamferButton href={`/play/${current.game.slug}?gp=${gp.id ?? "daily"}&seed=gp-${current.index}`}>
                {cleared ? "Replay final" : "Race this round"}
              </ChamferButton>
            </div>
          ) : null}
        </div>
      </GameBackdrop>

      <section className="px-5 py-10 md:px-10">
        <p className="meta text-white/40">Cup route</p>
        <div className="mt-5">
          <EventRoute
            cols={5}
            steps={rounds.map((r) => {
              const locked = !r.scored && r.index > currentIdx;
              return {
                key: `${r.round.gameId}-${r.index}`,
                index: r.index,
                slug: r.game?.slug ?? r.round.gameId,
                title: r.game?.title ?? r.round.gameId,
                kicker: r.index === rounds.length - 1 ? "Final" : `R${r.index + 1}`,
                meta: r.scored ? `${r.points} pts` : r.round.mode.replace(/-/g, " "),
                status: r.scored ? "done" : r === current ? "current" : locked ? "locked" : "open",
                href: r.game ? `/play/${r.game.slug}?gp=${gp.id ?? "daily"}&seed=gp-${r.index}` : undefined,
              };
            })}
          />
        </div>
      </section>
    </div>
  );
}
