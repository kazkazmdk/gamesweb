import type { Metadata } from "next";
import { entryMetadata } from "@/lib/seo";
import { entryByPath } from "@/lib/seo-content/registry";

export const metadata: Metadata = entryMetadata(entryByPath("/terms")!);

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
