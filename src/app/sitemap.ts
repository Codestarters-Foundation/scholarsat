import type { MetadataRoute } from "next";

const SITE = process.env.SITE_URL ?? "https://scholarsat.com";

/** Public, signed-out-indexable pages. Anything behind login lives behind /api and the app shell. */
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/practice", "/tutor", "/resources", "/privacy", "/terms"].map((path) => ({
    url: `${SITE}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.5,
  }));
}
