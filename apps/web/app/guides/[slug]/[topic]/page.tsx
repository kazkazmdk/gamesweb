import { getManifest } from "@gamesweb/game-sdk";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SeoCta, SeoPage } from "@/components/seo/SeoPage";
import { getGuide, guidePages, type GuideKind } from "@/content/guides";
import { breadcrumbJsonLd, INDEX, metadataFromPage } from "@/lib/seo";
import { requestOrigin } from "@/lib/origin";

const TOPICS: GuideKind[] = ["how-to-play", "tips"];

export function generateStaticParams() {
  return guidePages().map((g) => ({ slug: g.slug, topic: g.kind }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; topic: string }>;
}): Promise<Metadata> {
  const { slug, topic } = await params;
  const guide = getGuide(slug, topic as GuideKind);
  if (!guide) return { title: "Guide" };
  return {
    ...metadataFromPage({
      title: `${guide.title} | Gamesweb`,
      description: guide.description,
      path: `/guides/${slug}/${topic}`,
    }),
    ...INDEX,
  };
}

export default async function GuideArticlePage({
  params,
}: {
  params: Promise<{ slug: string; topic: string }>;
}) {
  const { slug, topic } = await params;
  if (!TOPICS.includes(topic as GuideKind)) notFound();
  const guide = getGuide(slug, topic as GuideKind);
  const game = getManifest(slug);
  if (!guide || !game) notFound();
  const origin = await requestOrigin();
  const sibling = topic === "how-to-play" ? "tips" : "how-to-play";
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Guides", path: "/guides" },
    { name: game.title, path: `/games/${slug}` },
    { name: guide.title, path: `/guides/${slug}/${topic}` },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(origin, crumbs)) }} />
      <SeoPage
        kicker={topic === "how-to-play" ? "How to play" : "Strategy"}
        title={guide.title}
        lede={guide.problem}
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/guides", label: "Guides" },
          { href: `/games/${slug}`, label: game.title },
        ]}
      >
        {guide.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="meta">{s.heading}</h2>
            <ul className="mt-3 space-y-2 text-[15px] text-white/70">
              {s.body.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ))}
        <div className="flex flex-wrap gap-4">
          <SeoCta href={`/play/${slug}`}>Play {game.title} ›</SeoCta>
          <Link href={`/games/${slug}`} className="text-[14px] text-white/70">
            {game.title} hub
          </Link>
          <Link href={`/guides/${slug}/${sibling}`} className="text-[14px] text-white/70">
            {sibling === "tips" ? "Strategy" : "How to play"}
          </Link>
        </div>
      </SeoPage>
    </>
  );
}
