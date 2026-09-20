import { getManifest } from "@gamesweb/game-sdk";
import Link from "next/link";
import { SeoFaq, SeoSection } from "./SeoChrome";
import { SeoGameLink } from "./SeoTracker";
import { hubCopy } from "@/lib/seo-content/hubs";
import { entryByPath, relatedEntries } from "@/lib/seo-content/registry";

export function GameEditorial({ gameId }: { gameId: string }) {
  const game = getManifest(gameId);
  const entry = entryByPath(`/games/${gameId}`);
  const copy = hubCopy(gameId);
  if (!game || !entry || !copy) return null;
  const related = relatedEntries(entry);
  return (
    <section id="about-the-game" className="space-y-14 border-t border-white/8 px-5 py-14 md:px-10" data-seo-page="game-editorial">
      <header className="max-w-2xl">
        <p className="meta">Overview</p>
        <h2 className="display mt-3 text-[36px] md:text-[48px]">The game</h2>
        <p className="mt-4 text-[16px] leading-7 text-[var(--text-dim)]">{entry.summary}</p>
      </header>
      {entry.sections.map((s) => (
        <SeoSection key={s.heading} heading={s.heading} body={s.body} />
      ))}
      <section className="max-w-2xl">
        <h2 className="display text-[28px] md:text-[34px]">How to play</h2>
        <ul className="mt-4 space-y-2 text-[15px] text-[var(--text-dim)]">
          {game.howToPlay.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
      <section className="max-w-2xl">
        <h2 className="display text-[28px] md:text-[34px]">Controls</h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[14px]">
          {game.controls.map((c) => (
            <div key={c.input} className="border-t border-[var(--line)] pt-2">
              <dt className="meta">{c.input}</dt>
              <dd>{c.action}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="max-w-2xl">
        <h2 className="display text-[28px] md:text-[34px]">Beginner tips</h2>
        <p className="mt-3 text-[15px] leading-7 text-[var(--text-dim)]">{copy.sections[1]?.body ?? game.howToPlay[0]}</p>
      </section>
      <SeoFaq faqs={entry.faqs} />
      <section>
        <h2 className="meta">Guides</h2>
        <ul className="mt-4 grid gap-2 md:grid-cols-2">
          {related.guides.map((g) => (
            <li key={g.id}>
              <Link href={g.path} className="block border-t border-[var(--line)] py-3">
                <span className="display text-[22px]">{g.h1}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="meta">Collections</h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          {related.collections.map((c) => (
            <li key={c.id}>
              <Link href={c.path} className="home-secondary">
                {c.h1}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="meta">Related games</h2>
        <ul className="mt-4 flex flex-wrap gap-4">
          {related.games.map((g) => (
            <li key={g.id}>
              <SeoGameLink href={g.path} gameId={g.gameId ?? g.slug} sourceType="game-hub" sourceSlug={gameId}>
                {g.h1}
              </SeoGameLink>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
