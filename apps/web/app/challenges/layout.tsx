import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = { title: "Challenges", ...NOINDEX };

export default function ChallengesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
