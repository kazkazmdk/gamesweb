import { brand } from "@gamesweb/config";
import type { Metadata } from "next";
import HomePage from "@/components/home/HomePage";
import { INDEX } from "@/lib/seo";

export const metadata: Metadata = {
  title: `${brand.productName} — ${brand.tagline}`,
  description: brand.description,
  alternates: { canonical: "/" },
  ...INDEX,
  openGraph: {
    title: `${brand.productName} — ${brand.tagline}`,
    description: brand.description,
    url: "/",
  },
};

export default function Page() {
  return <HomePage />;
}
