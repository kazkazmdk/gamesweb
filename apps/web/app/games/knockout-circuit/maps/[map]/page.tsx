import type { Metadata } from "next";
import { ContentUnitView } from "@/components/seo/ContentUnitPage";
import { findContentUnit, knockoutMaps } from "@/lib/content/content-units";
import { entityMetadata } from "@/lib/content/metadata";

export function generateStaticParams() {
  return knockoutMaps().map((m) => ({ map: m.sourceId }));
}

export async function generateMetadata({ params }: { params: Promise<{ map: string }> }): Promise<Metadata> {
  const { map } = await params;
  const unit = findContentUnit("knockout-circuit", "map", map);
  if (!unit) return { title: "Map" };
  return entityMetadata(unit.entity);
}

export default async function KnockoutMapPage({ params }: { params: Promise<{ map: string }> }) {
  const { map } = await params;
  return <ContentUnitView unit={findContentUnit("knockout-circuit", "map", map)} />;
}
