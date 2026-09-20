import type { Metadata } from "next";
import { NOINDEX_FOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "Play", ...NOINDEX_FOLLOW };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
