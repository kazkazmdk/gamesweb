import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = { title: "Daily Arcade", ...NOINDEX };

export default function DailyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
