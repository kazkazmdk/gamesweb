import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Play",
  ...NOINDEX,
};

export default function PlayGameLayout({ children }: { children: React.ReactNode }) {
  return children;
}
