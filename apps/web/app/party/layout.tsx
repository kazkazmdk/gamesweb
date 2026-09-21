import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = { title: "Party", ...NOINDEX };
export default function PartyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
