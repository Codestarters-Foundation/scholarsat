import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getUser } from "@/lib/auth";
import { ThemeProvider, type Theme, type AccentColor } from "@/components/ThemeProvider";

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

const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('ss_theme') || 'system';
    var a = localStorage.getItem('ss_accent') || 'red';
    var c = localStorage.getItem('ss_compact') === 'true';
    var r = localStorage.getItem('ss_reduce_motion') === 'true';
    var d = document.documentElement;
    d.dataset.theme = t;
    d.dataset.accent = a;
    if (t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      d.classList.add('dark');
    } else {
      d.classList.remove('dark');
    }
    if (c) d.classList.add('compact');
    if (r) d.classList.add('reduce-motion');
  } catch(e) {}
})();
`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getUser();

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {brandFontCss ? <style dangerouslySetInnerHTML={{ __html: brandFontCss }} /> : null}
      </head>
      <body className="min-h-dvh">
        <ThemeProvider
          signedIn={!!user}
          initialTheme={(user?.theme as Theme) || "system"}
          initialAccent={(user?.accent_color as AccentColor) || "red"}
          initialCompact={!!user?.compact_mode}
          initialReduceMotion={!!user?.reduce_animations}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
