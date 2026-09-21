import type { Metadata } from "next";
import { NOINDEX_FOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "Challenges", ...NOINDEX_FOLLOW };

export default function ChallengesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
