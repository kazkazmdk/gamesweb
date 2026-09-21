import type { Metadata } from "next";
import { NOINDEX_FOLLOW } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: "Play",
    ...NOINDEX_FOLLOW,
    alternates: { canonical: `/games/${slug}` },
  };
}

export default function PlayGameLayout({ children }: { children: React.ReactNode }) {
  return children;
}
