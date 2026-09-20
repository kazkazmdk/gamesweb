import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHero, Prose, RelatedRail } from "@/components/seo/PublicArticle";
import type { ContentUnit } from "@/lib/content/content-units";
import { breadcrumbJsonLd } from "@/lib/content/schema";

export function ContentUnitView({ unit }: { unit: ContentUnit | undefined }) {
  if (!unit) notFound();
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(unit.entity.breadcrumbs)) }} />
      <PublicHero
        slug={unit.gameSlug}
        kicker={unit.unitKind}
        h1={unit.entity.h1}
        lead={unit.entity.description}
        crumbs={unit.entity.breadcrumbs}
        actions={
          <>
            <Link href={`/play/${unit.gameSlug}`} className="home-play inline-flex min-h-12 items-center px-7 font-semibold">
              Play
            </Link>
            <Link href={`/games/${unit.gameSlug}`} className="home-secondary">
              Game hub ›
            </Link>
            <Link href={`/games/${unit.gameSlug}/strategy`} className="home-secondary">
              Strategy ›
            </Link>
          </>
        }
      />
      <div className="px-5 py-12 md:px-10">
        <Prose>
          <section>
            <h2 className="meta text-[var(--text)]">Place</h2>
            <p className="mt-3">{unit.environment}</p>
          </section>
          <section>
            <h2 className="meta text-[var(--text)]">From the data</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-[14px]">
              {Object.entries(unit.facts).map(([k, v]) => (
                <div key={k} className="border-t border-[var(--line)] pt-2">
                  <dt className="meta">{k}</dt>
                  <dd className="text-[var(--text)]">{String(v)}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section>
            <h2 className="meta text-[var(--text)]">How to take it</h2>
            <p className="mt-3">{unit.advice}</p>
          </section>
        </Prose>
        <RelatedRail
          links={[
            ...unit.entity.relatedLinks,
            ...unit.siblings.map((s) => ({ href: s.href, label: s.label })),
          ]}
        />
      </div>
    </article>
  );
}
