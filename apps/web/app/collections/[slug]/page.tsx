import { getManifest } from "@gamesweb/game-sdk";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GameArt } from "@/components/game/GameArt";
import { Breadcrumbs, RelatedRail } from "@/components/seo/PublicArticle";
import { allCollections, buildCollectionEntity, getCollection } from "@/lib/content/collections";
import { entityMetadata } from "@/lib/content/metadata";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/content/schema";

export function generateStaticParams() {
  return allCollections().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const def = getCollection(slug);
  if (!def) return { title: "Collection" };
  return entityMetadata(buildCollectionEntity(def));
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const def = getCollection(slug);
  if (!def) notFound();
  const entity = buildCollectionEntity(def);
  if (!entity.indexable) notFound();
  return (
    <article className="px-5 py-10 md:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(entity.breadcrumbs)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            itemListJsonLd(
              def.title,
              def.games.map((id) => ({ name: getManifest(id)!.title, href: `/games/${id}` })),
            ),
          ),
        }}
      />
      <Breadcrumbs crumbs={entity.breadcrumbs} />
      <p className="meta mt-6">Collection</p>
      <h1 className="display mt-2 max-w-[16ch] text-[40px] md:text-[64px]">{entity.h1}</h1>
      <p className="mt-3 max-w-2xl text-[16px] text-[var(--text-dim)]">{def.description}</p>
      <section className="mt-10 max-w-2xl">
        <h2 className="meta">Why these games</h2>
        <p className="mt-3 text-[15px] text-[var(--text-dim)]">{def.why}</p>
      </section>
      <section className="mt-8 max-w-2xl">
        <h2 className="meta">Compare</h2>
        <p className="mt-3 text-[15px] text-[var(--text-dim)]">{def.comparison}</p>
      </section>
      <ol className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {def.games.map((id) => {
          const game = getManifest(id)!;
          return (
            <li key={id} className="gw-stage overflow-hidden">
              <Link href={`/games/${id}`}>
                <GameArt slug={id} variant="tile" className="h-36 w-full" />
                <div className="p-4">
                  <h2 className="display text-[24px]">{game.title}</h2>
                  <p className="mt-1 text-[13px] text-[var(--text-dim)]">
                    {game.sessionHint} · {game.genre}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
      <RelatedRail links={entity.relatedLinks} />
    </article>
  );
}
