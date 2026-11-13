import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

/**
 * Licensed brand fonts (same system as Cramzo). They aren't committed; drop the
 * files into public/fonts/ and they're picked up at the next build.
 */
const BRAND_FONT_FILES = ["CursorGothic-Regular.woff2", "CursorGothic-Medium.woff2", "BerkeleyMono-Regular.woff2"];
const brandFonts = BRAND_FONT_FILES.filter((f) => fs.existsSync(path.join(process.cwd(), "public", "fonts", f)));

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  poweredByHeader: false,
  env: { BRAND_FONTS: brandFonts.join(",") },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
