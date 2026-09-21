import { getManifest } from "@gamesweb/game-sdk";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GameTile } from "@/components/platform";
import { SeoPage } from "@/components/seo/SeoPage";
import { COLLECTIONS, getCollection } from "@/content/collections";
import { breadcrumbJsonLd, INDEX, itemListJsonLd, metadataFromPage } from "@/lib/seo";
import { requestOrigin } from "@/lib/origin";

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const col = getCollection(slug);
  if (!col) return { title: "Collection" };
  return {
    ...metadataFromPage({
      title: `${col.title} | Gamesweb`,
      description: col.description,
      path: `/collections/${slug}`,
    }),
    ...INDEX,
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const col = getCollection(slug);
  if (!col) notFound();
  const games = col.games.map((id) => getManifest(id)).filter(Boolean);
  const origin = await requestOrigin();
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Collections", path: "/collections" },
    { name: col.title, path: `/collections/${slug}` },
  ];
  const items = games.map((g) => ({ name: g!.title, path: `/games/${g!.slug}` }));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(origin, crumbs)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd(origin, col.title, items)) }} />
      <SeoPage
        kicker="Collection"
        title={col.title}
        lede={col.intro}
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/collections", label: "Collections" },
        ]}
      >
        <section>
          <h2 className="meta">Why these games</h2>
          <p className="mt-3 text-[15px] text-white/70">{col.description}</p>
        </section>
        <section>
          <h2 className="meta">Compare</h2>
          <ul className="mt-3 space-y-1 text-[14px] text-white/65">
            {col.compare.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </section>
        <ul className="space-y-6">
          {games.map((game) => (
            <li key={game!.id} className="border-t border-white/10 pt-4">
              <GameTile game={game!} variant="wide" />
              <div className="mt-3 flex gap-4 text-[13px]">
                <Link href={`/games/${game!.slug}`}>Hub</Link>
                <Link href={`/guides/${game!.slug}/how-to-play`}>How to play</Link>
                <Link href={`/guides/${game!.slug}/tips`}>Tips</Link>
              </div>
            </li>
          ))}
        </ul>
      </SeoPage>
    </>
  );
}
