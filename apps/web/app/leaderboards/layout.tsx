import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = { title: "Leaderboards", ...NOINDEX };

export default function LeaderboardsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
