import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", axes: ["opsz"] });

const SITE = process.env.SITE_URL ?? "https://scholarsat.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "ScholarSAT · Free, open-source SAT prep", template: "%s · ScholarSAT" },
  description:
    "Free SAT practice with thousands of questions, full-length timed mock tests, instant explanations, and progress tracking. No paywalls, ever. Open source.",
  openGraph: {
    title: "ScholarSAT · Free, open-source SAT prep",
    description: "Thousands of practice questions, full-length mock tests, and progress tracking. 100% free.",
    url: SITE,
    siteName: "ScholarSAT",
    images: [{ url: "/icon-512.png", width: 512, height: 512 }],
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#a50c26" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
