import type { Metadata } from "next";
import { NOINDEX_FOLLOW } from "@/lib/seo";

export const metadata: Metadata = { title: "Friends", ...NOINDEX_FOLLOW };

export default function FriendsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
