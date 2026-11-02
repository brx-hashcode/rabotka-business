import type { MetadataRoute } from "next";

import { siteOrigin } from "#/lib/seo/site";

/**
 * Production lets crawlers into the careers pages only, with what they need to
 * render them: the scripts and the public careers API. Elsewhere, nothing.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const { origin, indexed } = await siteOrigin();
  if (!indexed) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      // The sitemap too: Google must be able to read it, not only be told where it is.
      allow: ["/carrieres", "/sitemap.xml", "/_next/", "/api/v1/public/careers"],
      disallow: ["/"],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
