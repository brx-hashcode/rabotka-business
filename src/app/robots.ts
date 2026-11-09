import type { MetadataRoute } from "next";

import { MARKETING_PATHS } from "#/lib/seo/marketing";
import { siteOrigin } from "#/lib/seo/site";

/**
 * Production lets crawlers into the public site (the landing and its pages)
 * and the careers pages, with what they need to render them: the scripts and
 * the public careers API. Never the space. Elsewhere, nothing.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const { origin, indexed } = await siteOrigin();
  if (!indexed) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      // The sitemap too: Google must be able to read it, not only be told where it is.
      // "/$" is the landing alone: "/" would open everything below it.
      allow: [
        "/$",
        ...MARKETING_PATHS.filter((p) => p !== "/"),
        "/carrieres",
        "/sitemap.xml",
        "/_next/",
        "/api/v1/public/careers",
      ],
      disallow: ["/"],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
