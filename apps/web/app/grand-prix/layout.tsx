import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = { title: "Grand Prix", ...NOINDEX };
export default function GrandPrixLayout({ children }: { children: React.ReactNode }) {
  return children;
}
