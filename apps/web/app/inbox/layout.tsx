import type { Metadata } from "next";
import { NOINDEX_FOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "Inbox", ...NOINDEX_FOLLOW };

export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return children;
}
