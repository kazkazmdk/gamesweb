import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = { title: "Inbox", ...NOINDEX };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
