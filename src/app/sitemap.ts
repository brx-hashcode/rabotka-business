import type { MetadataRoute } from "next";

import { careersSitemapServer } from "#/lib/api/careers-server";
import { siteOrigin } from "#/lib/seo/site";

/** The careers pages search engines may list; empty anywhere but production. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { origin, indexed } = await siteOrigin();
  if (!indexed) return [];
  const map = await careersSitemapServer();
  if (!map) return [{ url: `${origin}/carrieres` }];
  return [
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
