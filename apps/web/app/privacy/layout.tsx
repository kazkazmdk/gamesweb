import type { Metadata } from "next";
import { metadataForPath } from "@/lib/seo";

export const metadata: Metadata = metadataForPath("/privacy");

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
