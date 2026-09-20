import type { Metadata } from "next";
import { ContentUnitView } from "@/components/seo/ContentUnitPage";
import { findContentUnit, velocityCourses } from "@/lib/content/content-units";
import { entityMetadata } from "@/lib/content/metadata";

export function generateStaticParams() {
  return velocityCourses().map((c) => ({ course: c.sourceId }));
}

export async function generateMetadata({ params }: { params: Promise<{ course: string }> }): Promise<Metadata> {
  const { course } = await params;
  const unit = findContentUnit("velocity-run", "course", course);
  if (!unit) return { title: "Course" };
  return entityMetadata(unit.entity);
}

export default async function VelocityCoursePage({ params }: { params: Promise<{ course: string }> }) {
  const { course } = await params;
  return <ContentUnitView unit={findContentUnit("velocity-run", "course", course)} />;
}
