import type { Metadata } from "next";
import Link from "next/link";
import { SeoPage } from "@/components/seo/SeoPage";
import { COLLECTIONS } from "@/content/collections";
import { INDEX, metadataFromPage } from "@/lib/seo";

export const metadata: Metadata = {
  ...metadataFromPage({
    title: "Gamesweb collections",
    description: "Small editorial groupings of Gamesweb games that actually share a use case.",
    path: "/collections",
  }),
  ...INDEX,
};

export default function CollectionsIndexPage() {
  return (
    <SeoPage
      kicker="Collections"
      title="Useful groupings only"
      lede="Five collections. Each one has at least four real Gamesweb games and a reason to choose between them."
      crumbs={[
        { href: "/", label: "Home" },
        { href: "/collections", label: "Collections" },
      ]}
    >
      <ul className="space-y-6">
        {COLLECTIONS.map((c) => (
          <li key={c.slug} className="border-t border-white/10 pt-4">
            <Link href={`/collections/${c.slug}`} className="display text-[28px]">
              {c.title}
            </Link>
            <p className="mt-2 text-[14px] text-white/65">{c.intro}</p>
          </li>
        ))}
      </ul>
    </SeoPage>
  );
}
