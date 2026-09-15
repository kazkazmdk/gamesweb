import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = { title: "Arcade", ...NOINDEX };

export default function ArcadeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
