import { GAME_MANIFESTS, getManifest } from "@gamesweb/game-sdk";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHero, Prose, RelatedRail } from "@/components/seo/PublicArticle";
import { hasStrategyPage } from "@/lib/content/games";
import { buildStrategy } from "@/lib/content/guides";
import { entityMetadata } from "@/lib/content/metadata";
import { breadcrumbJsonLd } from "@/lib/content/schema";

export function generateStaticParams() {
  return GAME_MANIFESTS.filter((g) => hasStrategyPage(g.slug)).map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = buildStrategy(slug);
  if (!page) return { title: "Strategy" };
  return entityMetadata(page.entity);
}

export default async function StrategyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getManifest(slug)) notFound();
  const page = buildStrategy(slug);
  if (!page) notFound();
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(page.entity.breadcrumbs)) }} />
      <PublicHero
        slug={slug}
        kicker="Strategy"
        h1={page.entity.h1}
        lead={page.lead}
        crumbs={page.entity.breadcrumbs}
        actions={
          <>
            <Link href={`/games/${slug}/how-to-play`} className="home-secondary">
              How to play ›
            </Link>
            <Link href={`/games/${slug}`} className="home-secondary">
              Game hub ›
            </Link>
          </>
        }
      />
      <div className="px-5 py-12 md:px-10">
        <Prose>
          {page.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="meta text-[var(--text)]">{s.heading}</h2>
              <p className="mt-3">{s.body}</p>
            </section>
          ))}
        </Prose>
        <RelatedRail links={page.entity.relatedLinks} />
      </div>
    </article>
  );
}
