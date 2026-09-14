import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = { title: "You", ...NOINDEX };

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
