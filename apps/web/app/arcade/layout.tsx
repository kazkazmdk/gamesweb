import type { Metadata } from "next";
import { NOINDEX_FOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "Arcade", ...NOINDEX_FOLLOW };

export default function ArcadeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
