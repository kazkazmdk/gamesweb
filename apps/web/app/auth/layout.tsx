import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = { title: "Save progress", ...NOINDEX };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
