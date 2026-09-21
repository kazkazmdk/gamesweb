import type { Metadata } from "next";
import { metadataForPath } from "@/lib/seo";

export const metadata: Metadata = metadataForPath("/terms");

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
