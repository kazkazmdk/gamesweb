import type { Metadata } from "next";
import { NOINDEX_FOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "Settings", ...NOINDEX_FOLLOW };

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
