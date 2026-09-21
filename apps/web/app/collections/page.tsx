import { getManifest } from "@gamesweb/game-sdk";
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/SeoChrome";
import { JsonLd } from "@/components/seo/JsonLd";
import { SeoLandingView } from "@/components/seo/SeoAnalytics";
import { COLLECTIONS, seoPageByPath } from "@/content";
import { breadcrumbJsonLd, itemListJsonLd, metadataForPath } from "@/lib/seo";

export const metadata: Metadata = metadataForPath("/collections");

export default function CollectionsIndexPage() {
  const page = seoPageByPath("/collections")!;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Collections", path: "/collections" },
  ];
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs),
          itemListJsonLd(
            "Gamesweb collections",
            COLLECTIONS.map((c) => ({ name: c.title, path: `/collections/${c.slug}` })),
          ),
        ]}
      />
      <SeoLandingView path="/collections" kind="collections" />
      <article className="px-5 py-10 md:px-10">
        <Breadcrumbs items={crumbs} />
        <h1 className="display mt-6 text-[48px] md:text-[72px]">{page.h1}</h1>
        <p className="mt-4 max-w-2xl text-[16px] text-[var(--text-dim)]">{page.description}</p>
        <ul className="mt-10 grid gap-8 md:grid-cols-2">
          {COLLECTIONS.map((col) => (
            <li key={col.slug} className="border-t border-[var(--line)] pt-5">
              <h2 className="display text-[32px]">
                <Link href={`/collections/${col.slug}`}>{col.h1}</Link>
              </h2>
              <p className="mt-2 text-[14px] text-[var(--text-dim)]">{col.rationale}</p>
              <p className="mt-3 text-[13px] text-[var(--text-faint)]">
                {col.games.map((slug) => getManifest(slug)?.title ?? slug).join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      </article>
    </>
  );
}
