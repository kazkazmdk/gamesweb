import { getManifest } from "@gamesweb/game-sdk";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameCatalogGrid } from "@/components/seo/SeoChrome";
import { JsonLd } from "@/components/seo/JsonLd";
import { SeoLandingView, TrackedLink } from "@/components/seo/SeoAnalytics";
import { Breadcrumbs } from "@/components/seo/SeoChrome";
import { COLLECTIONS, collectionBySlug, seoPageByPath } from "@/content";
import { breadcrumbJsonLd, itemListJsonLd, metadataForPath } from "@/lib/seo";

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return metadataForPath(`/collections/${slug}`);
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const col = collectionBySlug(slug);
  const page = seoPageByPath(`/collections/${slug}`);
  if (!col || !page) notFound();
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Collections", path: "/collections" },
    { name: col.h1, path: page.path },
  ];
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs),
          itemListJsonLd(
            col.title,
            col.games.map((id) => ({ name: getManifest(id)?.title ?? id, path: `/games/${id}` })),
          ),
        ]}
      />
      <SeoLandingView path={page.path} kind="collection" />
      <article className="px-5 py-10 md:px-10">
        <Breadcrumbs items={crumbs} />
        <h1 className="display mt-6 text-[48px] md:text-[72px]">{page.h1}</h1>
        <p className="mt-4 max-w-2xl text-[16px] text-[var(--text-dim)]">{col.rationale}</p>
        <p className="mt-4 max-w-2xl text-[15px] text-[var(--text-dim)]">{col.audience}</p>
        <p className="mt-3 max-w-2xl text-[15px] text-[var(--text-dim)]">{col.pick}</p>
        <div className="mt-10">
          <GameCatalogGrid slugs={col.games} />
        </div>
        <ul className="mt-8 flex flex-wrap gap-3 text-[13px]">
          {col.games.map((id) => (
            <li key={id}>
              <TrackedLink
                href={`/games/${id}`}
                event="collection_to_game"
                props={{ collection: slug, gameId: id }}
                className="text-[var(--text-dim)] hover:text-[var(--text)]"
              >
                Open {getManifest(id)?.title} hub ›
              </TrackedLink>
            </li>
          ))}
        </ul>
      </article>
    </>
  );
}
