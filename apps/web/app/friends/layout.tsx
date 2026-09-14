import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = { title: "Friends", ...NOINDEX };

export default function FriendsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
