import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Typography matches Cramzo: CursorGothic for UI, berkeleyMono for timers/code.
// Inter (400/500) is the fallback until the licensed files are dropped into public/fonts.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["400", "500"], display: "swap" });

const BRAND_FACES: Record<string, { family: string; weight: number }> = {
  "CursorGothic-Regular.woff2": { family: "CursorGothic", weight: 400 },
  "CursorGothic-Medium.woff2": { family: "CursorGothic", weight: 500 },
  "BerkeleyMono-Regular.woff2": { family: "berkeleyMono", weight: 400 },
};

/** @font-face rules for the licensed files present in public/fonts at build time (see next.config.ts). */
const brandFontCss = (process.env.BRAND_FONTS ?? "")
  .split(",")
  .filter((file) => BRAND_FACES[file])
  .map((file) => `@font-face{font-family:"${BRAND_FACES[file].family}";src:url("/fonts/${file}") format("woff2");font-weight:${BRAND_FACES[file].weight};font-style:normal;font-display:swap}`)
  .join("");

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

export const viewport: Viewport = { themeColor: "#a50c26", viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      {brandFontCss ? (
        <head>
          <style dangerouslySetInnerHTML={{ __html: brandFontCss }} />
        </head>
      ) : null}
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
