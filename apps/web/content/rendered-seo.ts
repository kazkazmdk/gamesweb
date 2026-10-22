import type { SeoTopic } from "./types";

export type RenderedSeoRow = {
  url: string;
  status: number;
  title: string;
  description: string;
  canonical: string;
  robots: string;
  h1: string;
  h2s: string[];
  visibleWords: number;
  uniqueTokens: number;
  internalLinks: string[];
  breadcrumbs: string[];
  jsonld: string[];
  playCta: boolean;
  imageAlts: string[];
  nearestURL: string | null;
  similarity: number;
  qualityGate: "pass" | "thin" | "near-duplicate" | "orphan" | "canonical" | "intent";
};

export function tokenize(text: string) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

export function jaccard(a: Set<string>, b: Set<string>) {
  if (!a.size && !b.size) return 1;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  return inter / (a.size + b.size - inter);
}

export function intentGate(
  topic: SeoTopic,
  row: Pick<RenderedSeoRow, "visibleWords" | "internalLinks" | "playCta" | "h1" | "h2s">,
): "pass" | "intent" {
  const links = row.internalLinks.join(" ");
  if (topic === "controls") {
    return row.visibleWords >= 20 && row.playCta && /guide|how-to|play/.test(links) ? "pass" : "intent";
  }
  if (topic === "achievements") {
    return row.visibleWords >= 40 && /xp|achievement/i.test(row.h1 + row.h2s.join(" ")) ? "pass" : "intent";
  }
  if (topic === "collection") {
    return row.visibleWords >= 40 && row.internalLinks.filter((h) => h.startsWith("/games/")).length >= 3 ? "pass" : "intent";
  }
  if (topic === "strategy") {
    return row.visibleWords >= 80 ? "pass" : "intent";
  }
  if (topic === "how-to-play" || topic === "guide" || topic === "hub") {
    return row.visibleWords >= 60 && row.playCta ? "pass" : "intent";
  }
  if (topic === "scoring" || topic === "tracks" || topic === "courses") {
    return row.visibleWords >= 40 ? "pass" : "intent";
  }
  if (topic === "home" || topic === "catalog") {
    return row.playCta && row.internalLinks.some((h) => h.startsWith("/games")) ? "pass" : "intent";
  }
  return row.visibleWords >= 20 ? "pass" : "intent";
}
