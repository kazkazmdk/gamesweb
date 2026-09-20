import type { Metadata } from "next";
import HomePage from "@/components/home/HomePage";
import { entryMetadata } from "@/lib/seo";
import { entryByPath } from "@/lib/seo-content/registry";

export const metadata: Metadata = entryMetadata(entryByPath("/")!);

export default function Page() {
  return <HomePage />;
}
