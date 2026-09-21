import { getManifest } from "@gamesweb/game-sdk";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { RelatedGames, SeoArticle } from "@/components/seo/SeoChrome";
import { SeoLandingView } from "@/components/seo/SeoAnalytics";
import { COLLECTIONS, editorialFor, SEO_PAGES, seoPageByPath } from "@/content";
import { articleJsonLd, breadcrumbJsonLd, metadataForPath } from "@/lib/seo";

const TOPICS = [
  "guide",
  "how-to-play",
  "controls",
  "strategy",
  "achievements",
  "tracks",
  "courses",
  "scoring",
] as const;

export function generateStaticParams() {
  return SEO_PAGES.filter((p) => p.gameSlug && p.topic !== "hub").map((p) => ({
    slug: p.gameSlug!,
    topic: p.path.split("/").pop()!,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; topic: string }>;
}): Promise<Metadata> {
  const { slug, topic } = await params;
  return metadataForPath(`/games/${slug}/${topic}`);
}

export default async function GameTopicPage({
  params,
}: {
  params: Promise<{ slug: string; topic: string }>;
}) {
  const { slug, topic } = await params;
  if (!TOPICS.includes(topic as (typeof TOPICS)[number])) notFound();
  const game = getManifest(slug);
  const page = seoPageByPath(`/games/${slug}/${topic}`);
  if (!game || !page) notFound();
  const ed = editorialFor(slug);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Games", path: "/games" },
    { name: game.title, path: `/games/${slug}` },
    { name: page.h1, path: page.path },
  ];
  const related = COLLECTIONS.filter((c) => c.games.includes(slug)).slice(0, 2);
  const siblingHubs = game.tags.includes("skill")
    ? ["neon-drift", "velocity-run", "knockout-circuit"].filter((id) => id !== slug)
    : ["sky-stack", "pocket-striker", "crowd-control"].filter((id) => id !== slug);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs),
          articleJsonLd({
            title: page.title,
            description: page.description,
            path: page.path,
            image: game.hero,
            updatedAt: page.updatedAt,
          }),
        ]}
      />
      <SeoLandingView path={page.path} kind={topic} />
      <SeoArticle page={page} crumbs={crumbs}>
        {topic === "guide" ? (
          <>
            <section>
              <h2 className="meta text-[var(--text)]">Why it is distinct</h2>
              <p className="mt-3">{ed.whyDistinct}</p>
            </section>
            <section>
              <h2 className="meta text-[var(--text)]">How a run works</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5">
                {ed.run.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
            <section>
              <h2 className="meta text-[var(--text)]">From the live build</h2>
              <ul className="mt-3 space-y-2">
                {game.howToPlay.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </section>
          </>
        ) : null}

        {topic === "how-to-play" ? (
          <>
            <p>{ed.howToLead}</p>
            <ol className="list-decimal space-y-2 pl-5">
              {game.howToPlay.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
            {game.faq.map((f) => (
              <div key={f.q}>
                <p className="text-[var(--text)]">{f.q}</p>
                <p className="mt-1">{f.a}</p>
              </div>
            ))}
          </>
        ) : null}

        {topic === "controls" ? (
          <>
            <p>{ed.controlsLead}</p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              {game.controls.map((c) => (
                <div key={c.input} className="border-t border-[var(--line)] pt-2">
                  <dt className="meta">{c.input}</dt>
                  <dd className="text-[var(--text)]">{c.action}</dd>
                </div>
              ))}
            </dl>
            <p>Inputs: {game.inputMethods.join(", ")}. Devices: {game.supportedDevices.join(", ")}.</p>
          </>
        ) : null}

        {topic === "strategy" ? (
          <ol className="list-decimal space-y-3 pl-5">
            {ed.strategy.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        ) : null}

        {topic === "achievements" ? (
          <ol className="space-y-3">
            {game.achievements.map((a) => (
              <li key={a.key} className="border-t border-[var(--line)] pt-3">
                <p className="text-[var(--text)]">{a.name}</p>
                <p>
                  {a.description} · {a.xp} XP
                </p>
              </li>
            ))}
          </ol>
        ) : null}

        {topic === "tracks" && ed.tracks ? (
          <ul className="space-y-5">
            {ed.tracks.map((t) => (
              <li key={t.id} className="border-t border-[var(--line)] pt-4">
                <h2 className="display text-[28px] text-[var(--text)]">{t.name}</h2>
                <p className="meta mt-1">{t.subtitle}</p>
                <p className="mt-2">{t.note}</p>
              </li>
            ))}
          </ul>
        ) : null}

        {topic === "courses" && ed.courses ? (
          <ul className="space-y-4">
            {ed.courses.map((c) => (
              <li key={c.id} className="border-t border-[var(--line)] pt-3">
                <h2 className="display text-[26px] text-[var(--text)]">{c.name}</h2>
                <p className="meta mt-1">
                  {c.world} · {c.subtitle}
                </p>
                <p className="mt-2">{c.medals}</p>
              </li>
            ))}
          </ul>
        ) : null}

        {topic === "scoring" && ed.scoring ? (
          <>
            <p>{ed.scoring.lead}</p>
            <ul className="list-disc space-y-2 pl-5">
              {ed.scoring.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </>
        ) : null}

        <p>
          <Link href={`/games/${slug}`} className="text-[var(--text)]">
            Back to the {game.title} hub
          </Link>
        </p>
        {related.length ? (
          <p className="text-[13px]">
            Also in{" "}
            {related.map((c, i) => (
              <span key={c.slug}>
                {i ? " · " : ""}
                <Link href={`/collections/${c.slug}`}>{c.h1}</Link>
              </span>
            ))}
          </p>
        ) : null}
        <RelatedGames slugs={siblingHubs.slice(0, 3)} />
      </SeoArticle>
    </>
  );
}
