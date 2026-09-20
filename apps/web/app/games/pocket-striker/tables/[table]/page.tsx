import type { Metadata } from "next";
import { ContentUnitView } from "@/components/seo/ContentUnitPage";
import { findContentUnit, pocketTables } from "@/lib/content/content-units";
import { entityMetadata } from "@/lib/content/metadata";

export function generateStaticParams() {
  return pocketTables().map((t) => ({ table: t.sourceId }));
}

export async function generateMetadata({ params }: { params: Promise<{ table: string }> }): Promise<Metadata> {
  const { table } = await params;
  const unit = findContentUnit("pocket-striker", "table", table);
  if (!unit) return { title: "Table" };
  return entityMetadata(unit.entity);
}

export default async function PocketTablePage({ params }: { params: Promise<{ table: string }> }) {
  const { table } = await params;
  return <ContentUnitView unit={findContentUnit("pocket-striker", "table", table)} />;
}
