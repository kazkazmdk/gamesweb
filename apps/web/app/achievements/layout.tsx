import type { Metadata } from "next";
import { NOINDEX_FOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "Achievements", ...NOINDEX_FOLLOW };

export default function AchievementsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
