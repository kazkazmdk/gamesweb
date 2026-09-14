import { brand } from "@gamesweb/config";
import type { Metadata } from "next";
import { INDEX } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About",
  description: `${brand.productName} is a browser arcade with one player identity across instant games.`,
  alternates: { canonical: "/about" },
  ...INDEX,
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
