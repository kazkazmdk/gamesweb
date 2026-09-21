import { getManifest } from "@gamesweb/game-sdk";
import type { Metadata } from "next";
import Link from "next/link";
import { SeoPage } from "@/components/seo/SeoPage";
import { guidePages } from "@/content/guides";
import { INDEX, metadataFromPage } from "@/lib/seo";

export const metadata: Metadata = {
  ...metadataFromPage({
    title: "Gamesweb guides",
    description: "How-to-play and strategy guides written from the live Gamesweb mechanics.",
    path: "/guides",
  }),
  ...INDEX,
};

export default function GuidesIndexPage() {
  const pages = guidePages();
  const slugs = [...new Set(pages.map((p) => p.slug))];
  return (
    <SeoPage
      kicker="Guides"
      title="Playbooks from the real loops"
      lede="Every card names the problem it solves. Nothing here is a keyword permutation of another game."
      crumbs={[
        { href: "/", label: "Home" },
        { href: "/guides", label: "Guides" },
      ]}
    >
      {slugs.map((slug) => {
        const game = getManifest(slug);
        const pair = pages.filter((p) => p.slug === slug);
        if (!game) return null;
        return (
          <section key={slug}>
            <h2 className="display text-[28px]">{game.title}</h2>
            <ul className="mt-3 space-y-3">
              {pair.map((g) => (
                <li key={g.kind} className="border-t border-white/10 pt-3">
                  <Link href={`/guides/${g.slug}/${g.kind}`} className="text-[16px] text-white">
                    {g.title}
                  </Link>
                  <p className="mt-1 text-[14px] text-white/60">{g.problem}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </SeoPage>
  );
}
