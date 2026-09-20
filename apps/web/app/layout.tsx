import { brand } from "@gamesweb/config";
import type { Metadata, Viewport } from "next";
import { Figtree, Syne } from "next/font/google";
import { headers } from "next/headers";
import { AppShell } from "@/components/shell/AppShell";
import { publicOrigin } from "@/lib/content/site";
import { PlayerProvider } from "@/lib/player";
import "./globals.css";

const body = Figtree({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(publicOrigin()),
  title: {
    default: `${brand.productName} — ${brand.tagline}`,
    template: `%s · ${brand.productName}`,
  },
  description: brand.description,
  applicationName: brand.productName,
  openGraph: {
    title: brand.productName,
    description: brand.description,
    type: "website",
    siteName: brand.productName,
  },
  twitter: {
    card: "summary_large_image",
    title: brand.productName,
    description: brand.description,
  },
};

export const viewport: Viewport = {
  themeColor: brand.themeColor,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: brand.productName,
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body className="ambient antialiased">
        <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <div className="grain" aria-hidden />
        <PlayerProvider>
          <AppShell>{children}</AppShell>
        </PlayerProvider>
      </body>
    </html>
  );
}
