import type { Metadata } from "next";
import { NOINDEX_FOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "Challenge", ...NOINDEX_FOLLOW };

export default function ChallengeCodeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
