import type { MetadataRoute } from "next";

import { FEATURES } from "#/features/landing/content";
import { GUIDES } from "#/features/landing/site-content";
import { careersSitemapServer } from "#/lib/api/careers-server";
import { MARKETING_PATHS } from "#/lib/seo/marketing";
import { siteOrigin } from "#/lib/seo/site";

/** The public site's pages and the careers pages; empty anywhere but production. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { origin, indexed } = await siteOrigin();
  if (!indexed) return [];
  const site: MetadataRoute.Sitemap = [
    ...MARKETING_PATHS.map((p) => ({ url: `${origin}${p === "/" ? "" : p}`, changeFrequency: "weekly" as const })),
    ...FEATURES.map((f) => ({ url: `${origin}${f.href}`, changeFrequency: "monthly" as const })),
    ...GUIDES.map((g) => ({ url: `${origin}/ressources/${g.slug}`, changeFrequency: "monthly" as const })),
  ];
  const map = await careersSitemapServer();
  if (!map) return [...site, { url: `${origin}/carrieres` }];
  return [
    ...site,
    { url: `${origin}/carrieres`, changeFrequency: "daily" },
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
