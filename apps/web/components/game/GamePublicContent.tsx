import Link from "next/link";
import { GameArt } from "@/components/game/GameArt";
import type { GameEditorial } from "@/lib/content/games";
import { unitsForGame } from "@/lib/content/content-units";
import { allCollections } from "@/lib/content/collections";
import { PublicHero, RelatedRail } from "@/components/seo/PublicArticle";

export function GamePublicHero({ editorial }: { editorial: GameEditorial }) {
  const e = editorial.entity;
  return (
    <PublicHero
      slug={e.gameSlug ?? e.slug}
      kicker={e.kind === "game-hub" ? undefined : e.title}
      h1={e.h1}
      lead={editorial.overview}
      crumbs={e.breadcrumbs}
      actions={
        <>
          <Link href={`/play/${e.gameSlug}`} className="home-play inline-flex min-h-12 items-center px-7 font-semibold">
            Play
          </Link>
          <Link href={`/games/${e.gameSlug}/how-to-play`} className="home-secondary">
            How to play ›
          </Link>
          {editorial.strategyPath ? (
            <Link href={editorial.strategyPath} className="home-secondary">
              Strategy ›
            </Link>
          ) : null}
        </>
      }
    />
  );
}

export function GamePublicEditorial({ editorial }: { editorial: GameEditorial }) {
  const units = unitsForGame(editorial.entity.slug);
  const collections = allCollections().filter((c) => c.games.includes(editorial.entity.slug));
  return (
    <div className="px-5 py-12 md:px-10">
      <div className="grid gap-12 md:grid-cols-[1.3fr_.7fr]">
        <div className="max-w-2xl space-y-10">
          <section>
            <h2 className="meta">The game</h2>
            <p className="mt-3 text-[16px] text-[var(--text)]">{editorial.overview}</p>
            <p className="mt-3 text-[15px] text-[var(--text-dim)]">{editorial.objective}</p>
          </section>
          <section>
            <h2 className="meta">Scoring</h2>
            <p className="mt-3 text-[15px] text-[var(--text-dim)]">{editorial.scoring}</p>
          </section>
          <section>
            <h2 className="meta">Session</h2>
            <p className="mt-3 text-[15px] text-[var(--text-dim)]">{editorial.session}</p>
            <p className="mt-2 text-[15px] text-[var(--text-dim)]">{editorial.socialTruth}</p>
          </section>
          <section>
            <h2 className="meta">How it plays</h2>
            <ul className="mt-3 space-y-2 text-[15px] text-[var(--text-dim)]">
              {editorial.howToPlay.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="meta">Controls</h2>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[14px]">
              {editorial.controls.map((c) => (
                <div key={c.input} className="border-t border-[var(--line)] pt-2">
                  <dt className="meta">{c.input}</dt>
                  <dd>{c.action}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section>
            <h2 className="meta">Modes</h2>
            <p className="mt-3 text-[15px] text-[var(--text-dim)]">{editorial.modesNote}</p>
          </section>
          <section>
            <h2 className="meta">Tips</h2>
            <ul className="mt-3 space-y-2 text-[15px] text-[var(--text-dim)]">
              {editorial.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="meta">FAQ</h2>
            {editorial.faq.map((f) => (
              <div key={f.q} className="mt-3 border-t border-[var(--line)] pt-3">
                <p className="text-[14px] text-[var(--text)]">{f.q}</p>
                <p className="text-[13px] text-[var(--text-dim)]">{f.a}</p>
              </div>
            ))}
          </section>
        </div>
        <aside className="space-y-8">
          <section>
            <h2 className="meta">Screens</h2>
            <div className="mt-3 space-y-3">
              {editorial.screenshots.map((s) => (
                <figure key={s.src} className="overflow-hidden">
                  <GameArt slug={editorial.entity.slug} variant={s.src.includes("backdrop") ? "backdrop" : "hero"} className="h-40 w-full" />
                  <figcaption className="mt-1 text-[12px] text-[var(--text-faint)]">{s.alt}</figcaption>
                </figure>
              ))}
            </div>
          </section>
          {units.length ? (
            <section>
              <h2 className="meta">
                {editorial.contentUnitKind === "track"
                  ? "Tracks"
                  : editorial.contentUnitKind === "course"
                    ? "Courses"
                    : editorial.contentUnitKind === "map"
                      ? "Maps"
                      : "Tables"}
              </h2>
              <ul className="mt-3 space-y-2 text-[14px]">
                {units.map((u) => (
                  <li key={u.sourceId}>
                    <Link href={u.entity.path} className="text-white/75 hover:text-white">
                      {u.entity.h1} ›
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {collections.length ? (
            <section>
              <h2 className="meta">Collections</h2>
              <ul className="mt-3 space-y-2 text-[14px]">
                {collections.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/collections/${c.slug}`} className="text-white/75 hover:text-white">
                      {c.title} ›
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
      <RelatedRail links={editorial.entity.relatedLinks} title="Related" />
    </div>
  );
}
