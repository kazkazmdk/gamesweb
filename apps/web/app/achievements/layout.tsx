import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = { title: "Achievements", ...NOINDEX };

export default function AchievementsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
