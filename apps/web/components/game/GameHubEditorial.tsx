import { getManifest } from "@gamesweb/game-sdk";
import Link from "next/link";
import { ClusterNav, RelatedGames } from "@/components/seo/SeoChrome";
import { COLLECTIONS, editorialFor } from "@/content";

export function GameHubEditorial({ slug }: { slug: string }) {
  const game = getManifest(slug);
  const ed = editorialFor(slug);
  if (!game) return null;
  const collections = COLLECTIONS.filter((c) => c.games.includes(slug));
  const related = collections[0]?.games.filter((id) => id !== slug).slice(0, 3) ?? [];
  return (
    <section className="border-t border-white/8 px-5 py-12 md:px-10" aria-label="About the game">
      <p className="meta">The game</p>
      <h2 className="display mt-3 max-w-[14ch] text-[36px] md:text-[52px]">{game.title}</h2>
      <p className="mt-4 max-w-2xl text-[16px] text-[var(--text-dim)]">{ed.hubDescription}</p>
      <p className="mt-4 max-w-2xl text-[15px] text-[var(--text-dim)]">{ed.whyDistinct}</p>
      <div className="mt-8 max-w-2xl">
        <h3 className="meta">How a run works</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-[15px] text-[var(--text-dim)]">
          {ed.run.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
      <div className="mt-8 max-w-2xl">
        <h3 className="meta">Controls</h3>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[14px]">
          {game.controls.map((c) => (
            <div key={c.input} className="border-t border-[var(--line)] pt-2">
              <dt className="meta">{c.input}</dt>
              <dd>{c.action}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="mt-8">
        <ClusterNav slug={slug} current={`/games/${slug}`} />
      </div>
      {collections.length ? (
        <p className="mt-6 text-[13px] text-[var(--text-dim)]">
          In{" "}
          {collections.map((c, i) => (
            <span key={c.slug}>
              {i ? ", " : ""}
              <Link href={`/collections/${c.slug}`}>{c.h1}</Link>
            </span>
          ))}
          .
        </p>
      ) : null}
      <div className="mt-10">
        <RelatedGames slugs={related} title="Related games" />
      </div>
    </section>
  );
}
