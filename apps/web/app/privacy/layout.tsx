import type { Metadata } from "next";
import { entryMetadata } from "@/lib/seo";
import { entryByPath } from "@/lib/seo-content/registry";

export const metadata: Metadata = entryMetadata(entryByPath("/privacy")!);

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
