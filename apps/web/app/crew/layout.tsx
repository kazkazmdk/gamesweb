import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = { title: "Crew", ...NOINDEX };

export default function CrewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
