import type { Metadata } from "next";
import { NOINDEX_FOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "Crew", ...NOINDEX_FOLLOW };

export default function CrewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
