import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = { title: "Inbox", ...NOINDEX };
export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return children;
}
