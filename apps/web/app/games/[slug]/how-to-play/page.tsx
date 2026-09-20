import { GAME_MANIFESTS, getManifest } from "@gamesweb/game-sdk";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHero, Prose, RelatedRail } from "@/components/seo/PublicArticle";
import { buildHowToPlay } from "@/lib/content/guides";
import { entityMetadata } from "@/lib/content/metadata";
import { breadcrumbJsonLd } from "@/lib/content/schema";

export function generateStaticParams() {
  return GAME_MANIFESTS.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!getManifest(slug)) return { title: "How to play" };
  return entityMetadata(buildHowToPlay(slug).entity);
}

export default async function HowToPlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getManifest(slug)) notFound();
  const page = buildHowToPlay(slug);
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(page.entity.breadcrumbs)) }} />
      <PublicHero
        slug={slug}
        kicker="How to play"
        h1={page.entity.h1}
        lead={page.lead}
        crumbs={page.entity.breadcrumbs}
        actions={
          <>
            <Link href={`/play/${slug}`} className="home-play inline-flex min-h-12 items-center px-7 font-semibold">
              Play
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
              {s.bullets ? (
                <ul className="mt-3 space-y-1">
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
          <section>
            <h2 className="meta text-[var(--text)]">FAQ</h2>
            {page.faq.map((f) => (
              <div key={f.q} className="mt-3 border-t border-[var(--line)] pt-3">
                <p className="text-[var(--text)]">{f.q}</p>
                <p className="mt-1">{f.a}</p>
              </div>
            ))}
          </section>
        </Prose>
        <RelatedRail links={page.entity.relatedLinks} />
      </div>
    </article>
  );
}
