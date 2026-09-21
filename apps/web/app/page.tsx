import type { Metadata } from "next";
import HomePage from "@/components/home/HomePage";
import { metadataForPath } from "@/lib/seo";

export const metadata: Metadata = metadataForPath("/");

export default function Page() {
  return <HomePage />;
}
