import type { Metadata } from "next";
import { INDEX } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms for playing Gamesweb in the browser.",
  alternates: { canonical: "/terms" },
  ...INDEX,
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
