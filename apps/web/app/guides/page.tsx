import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, RelatedRail } from "@/components/seo/PublicArticle";
import { allGuides } from "@/lib/content/guides";
import { entityMetadata } from "@/lib/content/metadata";
import { entityByPath } from "@/lib/content/registry";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/content/schema";
import { getManifest } from "@gamesweb/game-sdk";

const entity = entityByPath("/guides")!;

export const metadata: Metadata = entityMetadata(entity);

export default function GuidesIndexPage() {
  const guides = allGuides();
  return (
    <article className="px-5 py-10 md:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(entity.breadcrumbs)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListJsonLd("Guides", guides.map((g) => ({ name: g.entity.h1, href: g.entity.path })))),
        }}
      />
      <Breadcrumbs crumbs={entity.breadcrumbs} />
      <p className="meta mt-6">First-party</p>
      <h1 className="display mt-2 text-[44px] md:text-[72px]">{entity.h1}</h1>
      <p className="mt-3 max-w-2xl text-[16px] text-[var(--text-dim)]">{entity.description}</p>
      <ul className="mt-10 space-y-4">
        {guides.map((g) => {
          const game = getManifest(g.gameSlug);
          return (
            <li key={g.entity.path} className="border-t border-[var(--line)] pt-4">
              <p className="meta text-white/40">
                {game?.title} · {g.kind === "how-to-play" ? "How to play" : "Strategy"}
              </p>
              <Link href={g.entity.path} className="display mt-1 block text-[28px] hover:text-white">
                {g.entity.h1}
              </Link>
              <p className="mt-2 max-w-2xl text-[14px] text-[var(--text-dim)]">{g.lead}</p>
            </li>
          );
        })}
      </ul>
      <RelatedRail links={entity.relatedLinks} />
    </article>
  );
}
