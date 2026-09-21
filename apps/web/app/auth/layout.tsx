import type { Metadata } from "next";
import { NOINDEX_FOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "Save progress", ...NOINDEX_FOLLOW };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
