import type { Metadata } from "next";
import { NOINDEX_FOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "Grand Prix", ...NOINDEX_FOLLOW };

export default function GrandPrixLayout({ children }: { children: React.ReactNode }) {
  return children;
}
