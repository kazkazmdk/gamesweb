import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = { title: "Play", ...NOINDEX };

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
