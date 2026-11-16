import type { MetadataRoute } from "next";

import { FEATURE_SLUGS } from "#/features/landing/content";
import { GUIDE_SLUGS } from "#/features/landing/site-content";
import { OFFERED_LOCALES } from "#/i18n/config";
import { localizedPath } from "#/i18n/routing";
import { careersSitemapServer } from "#/lib/api/careers-server";
import { languageAlternates, MARKETING_PATHS } from "#/lib/seo/marketing";
import { siteOrigin } from "#/lib/seo/site";

/** The public site's pages and the careers pages; empty anywhere but production. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { origin, indexed } = await siteOrigin();
  if (!indexed) return [];
  // Each public page once per offered language, each listing the others (hreflang).
  const absolute = (path: string) => `${origin}${path === "/" ? "" : path}`;
  const page = (path: string, changeFrequency: "weekly" | "monthly") =>
    OFFERED_LOCALES.map((locale) => {
      const languages = languageAlternates(path);
      return {
        url: absolute(localizedPath(path, locale)),
        changeFrequency,
        ...(languages && {
          alternates: { languages: Object.fromEntries(Object.entries(languages).map(([l, p]) => [l, absolute(p)])) },
        }),
      };
    });
  const site: MetadataRoute.Sitemap = [
    ...MARKETING_PATHS.flatMap((p) => page(p, "weekly")),
    ...FEATURE_SLUGS.flatMap((slug) => page(`/fonctionnalites/${slug}`, "monthly")),
    ...GUIDE_SLUGS.flatMap((slug) => page(`/ressources/${slug}`, "monthly")),
  ];
  const map = await careersSitemapServer();
  if (!map) return site;
  return [
    ...site,
    ...map.companies.map((c) => ({
      url: `${origin}/carrieres/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "daily" as const,
    })),
    ...map.offers.map((o) => ({
      url: `${origin}/carrieres/${o.slug}/${o.reference}`,
      lastModified: o.updatedAt,
    })),
  ];
}
