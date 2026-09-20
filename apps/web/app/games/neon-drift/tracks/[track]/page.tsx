import type { Metadata } from "next";
import { ContentUnitView } from "@/components/seo/ContentUnitPage";
import { findContentUnit, neonTracks } from "@/lib/content/content-units";
import { entityMetadata } from "@/lib/content/metadata";

export function generateStaticParams() {
  return neonTracks().map((t) => ({ track: t.sourceId }));
}

export async function generateMetadata({ params }: { params: Promise<{ track: string }> }): Promise<Metadata> {
  const { track } = await params;
  const unit = findContentUnit("neon-drift", "track", track);
  if (!unit) return { title: "Track" };
  return entityMetadata(unit.entity);
}

export default async function NeonTrackPage({ params }: { params: Promise<{ track: string }> }) {
  const { track } = await params;
  return <ContentUnitView unit={findContentUnit("neon-drift", "track", track)} />;
}
