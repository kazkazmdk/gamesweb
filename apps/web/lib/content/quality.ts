import type { IndexStatus, IndexableEntity } from "./types";

const PLACEHOLDER = /\b(lorem|ipsum|todo|tbd|placeholder|coming soon)\b/i;
const GENERIC = /\b(exciting and fun|master your|best .* online|ultimate browser)\b/i;

export type GateInput = {
  uniqueIntent: boolean;
  uniqueTitle: boolean;
  uniqueH1: boolean;
  firstPartyFacts: boolean;
  internalLinks: number;
  duplicateCanonical: boolean;
  gameBacked: boolean;
  title: string;
  h1: string;
  description: string;
  bodyText: string;
  hasImage: boolean;
  imageAlt: string;
  contradictory: boolean;
  placeholder: boolean;
  appSurface: boolean;
  thin?: boolean;
};

export function evaluateGate(input: GateInput): { status: IndexStatus; reason: string } {
  if (input.appSurface) return { status: "NOINDEX_APP", reason: "Application or personalized surface" };
  if (input.placeholder || PLACEHOLDER.test(`${input.title} ${input.bodyText}`)) {
    return { status: "NOINDEX_PLACEHOLDER", reason: "Placeholder or unfinished copy" };
  }
  if (input.duplicateCanonical) return { status: "NOINDEX_DUPLICATE", reason: "Canonical already claimed by another page" };
  if (input.contradictory) return { status: "NOINDEX_THIN", reason: "Contradictory game facts" };
  if (input.thin) return { status: "NOINDEX_THIN", reason: "Not enough distinct first-party value" };

  const missing: string[] = [];
  if (!input.uniqueIntent) missing.push("unique intent");
  if (!input.uniqueTitle) missing.push("unique title");
  if (!input.uniqueH1) missing.push("unique H1");
  if (!input.firstPartyFacts) missing.push("first-party facts");
  if (input.internalLinks < 2) missing.push("internal links");
  if (!input.gameBacked) missing.push("game-backed data");
  if (!input.hasImage || !input.imageAlt.trim()) missing.push("image");
  if (!input.description.trim() || input.description.length < 40) missing.push("description");
  if (GENERIC.test(`${input.title} ${input.description} ${input.bodyText}`)) missing.push("generic filler");
  if (missing.length) return { status: "NOINDEX_THIN", reason: `Failed: ${missing.join(", ")}` };
  return { status: "INDEXABLE", reason: "Distinct first-party page with crawlable graph links" };
}

export function applyGate<T extends IndexableEntity>(entity: T, bodyText: string, extras: Partial<GateInput> = {}): T {
  const gate = evaluateGate({
    uniqueIntent: true,
    uniqueTitle: true,
    uniqueH1: true,
    firstPartyFacts: true,
    internalLinks: entity.relatedLinks.length,
    duplicateCanonical: false,
    gameBacked: Boolean(entity.gameSlug || entity.kind === "home" || entity.kind === "catalog" || entity.kind === "legal" || entity.kind === "guides-index" || entity.kind === "collection" || entity.kind === "collection-index"),
    title: entity.title,
    h1: entity.h1,
    description: entity.description,
    bodyText,
    hasImage: Boolean(entity.image),
    imageAlt: entity.imageAlt,
    contradictory: false,
    placeholder: false,
    appSurface: entity.kind === "app",
    ...extras,
  });
  return {
    ...entity,
    indexable: gate.status === "INDEXABLE",
    indexStatus: gate.status,
    indexReason: gate.reason,
  };
}
