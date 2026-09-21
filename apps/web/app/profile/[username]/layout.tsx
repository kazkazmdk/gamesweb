import type { Metadata } from "next";
import { NOINDEX_FOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "Profile", ...NOINDEX_FOLLOW };

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
