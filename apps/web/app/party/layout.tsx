import type { Metadata } from "next";
import { NOINDEX_FOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "Party", ...NOINDEX_FOLLOW };

export default function PartyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
