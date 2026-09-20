import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, RelatedRail } from "@/components/seo/PublicArticle";
import { allCollections, collectionIndexEntity } from "@/lib/content/collections";
import { entityMetadata } from "@/lib/content/metadata";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/content/schema";
import { getManifest } from "@gamesweb/game-sdk";

const entity = collectionIndexEntity();

export const metadata: Metadata = entityMetadata(entity);

export default function CollectionsIndexPage() {
  const collections = allCollections();
  return (
    <article className="px-5 py-10 md:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(entity.breadcrumbs)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListJsonLd("Collections", collections.map((c) => ({ name: c.title, href: `/collections/${c.slug}` })))),
        }}
      />
      <Breadcrumbs crumbs={entity.breadcrumbs} />
      <p className="meta mt-6">Browse</p>
      <h1 className="display mt-2 text-[44px] md:text-[72px]">{entity.h1}</h1>
      <p className="mt-3 max-w-2xl text-[16px] text-[var(--text-dim)]">{entity.description}</p>
      <ul className="mt-10 grid gap-6 md:grid-cols-2">
        {collections.map((c) => (
          <li key={c.slug} className="gw-stage p-5">
            <Link href={`/collections/${c.slug}`}>
              <h2 className="display text-[28px]">{c.h1}</h2>
              <p className="mt-2 text-[14px] text-[var(--text-dim)]">{c.intent}</p>
              <p className="mt-3 text-[12px] text-[var(--text-faint)]">{c.games.map((id) => getManifest(id)?.title).join(" · ")}</p>
            </Link>
          </li>
        ))}
      </ul>
      <RelatedRail links={entity.relatedLinks} />
    </article>
  );
}
