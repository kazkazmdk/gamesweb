import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = { title: "Profile", ...NOINDEX };
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
