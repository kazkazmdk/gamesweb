import { brand } from "@gamesweb/config";
import type { Metadata } from "next";
import PlayPage from "@/components/play/PlayIndex";
import { INDEX } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Play",
  description: `Jump into a ${brand.productName} game instantly. No account required.`,
  alternates: { canonical: "/play" },
  ...INDEX,
};

export default function Page() {
  return <PlayPage />;
}
