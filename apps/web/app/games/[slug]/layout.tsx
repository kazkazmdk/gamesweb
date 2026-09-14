import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import type { Metadata } from "next";
import { brand } from "@gamesweb/config";
import { INDEX } from "@/lib/seo";

export function generateStaticParams() {
  return GAME_MANIFESTS.map((g) => ({ slug: g.slug }));
}

export const metadata: Metadata = {
  description: brand.description,
  ...INDEX,
};

export default function GameHubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
