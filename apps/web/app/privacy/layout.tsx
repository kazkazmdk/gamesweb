import type { Metadata } from "next";
import { INDEX } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Gamesweb stores guest progress, optional accounts, and analytics.",
  alternates: { canonical: "/privacy" },
  ...INDEX,
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
