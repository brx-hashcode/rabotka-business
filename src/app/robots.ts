import type { MetadataRoute } from "next";

import { OFFERED_LOCALES } from "#/i18n/config";
import { localizedPath } from "#/i18n/routing";
import { SOLUTIONS_PATH } from "#/features/landing/solutions";
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
        `${SOLUTIONS_PATH}/`,
        // The same pages in English, once offered: the sitemap and hreflang
        // send crawlers to /en/…, which nothing above lets them read.
        ...(OFFERED_LOCALES.includes("en")
          ? [
              "/en$",
              ...MARKETING_PATHS.filter((p) => p !== "/").map((p) => localizedPath(p, "en")),
              localizedPath(`${SOLUTIONS_PATH}/`, "en"),
            ]
          : []),
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
