import type { Metadata } from "next";
import { NOINDEX_FOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "Leaderboards", ...NOINDEX_FOLLOW };

export default function LeaderboardsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
