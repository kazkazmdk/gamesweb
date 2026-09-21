import type { Metadata } from "next";
import { NOINDEX_FOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "You", ...NOINDEX_FOLLOW };

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
