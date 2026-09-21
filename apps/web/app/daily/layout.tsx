import type { Metadata } from "next";
import { NOINDEX_FOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "Daily Arcade", ...NOINDEX_FOLLOW };

export default function DailyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
