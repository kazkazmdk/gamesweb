import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = { title: "Challenge", ...NOINDEX };
export default function ChallengeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
