import { GAME_MANIFESTS } from "@gamesweb/game-sdk";

export function generateStaticParams() {
  return GAME_MANIFESTS.map((g) => ({ slug: g.slug }));
}

export default function GameHubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
