import { cache } from "react";
import { headers } from "next/headers";

import type { CareersCompany, CareersOffer, CareersOfferSummary, CareersPartner } from "./careers-controller";

/** The careers API read from the server, for what search engines get in the HTML. */
async function getPublic<T>(path: string): Promise<T | null | undefined> {
  const backend = process.env.BACKEND_URL;
  if (!backend) return undefined;
  // The visitor's address, so the backend's per-address limit counts them,
  // not this container serving every crawler.
  const xff = (await headers()).get("x-forwarded-for");
  try {
    const res = await fetch(new URL(`/api/v1/public/careers${path}`, backend), {
      headers: xff ? { "x-forwarded-for": xff } : {},
      cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) return undefined;
    return (await res.json()) as T;
  } catch {
    return undefined;
  }
}

/** Null: there is no such open offer. Undefined: it could not be read now. */
export const careersOfferServer = cache((slug: string, reference: string) =>
  getPublic<{ company: CareersCompany; offer: CareersOffer }>(
    `/${encodeURIComponent(slug)}/offers/${encodeURIComponent(reference)}`,
  ),
);

/** The directory, for its HTML (it is indexed). */
export const careersCompaniesServer = cache(() =>
  getPublic<(CareersCompany & { openOffers: number })[]>(""),
);

/** « Ils recrutent avec Rabotka »: empty when none could be read. */
export const careersPartnersServer = cache(async () => (await getPublic<CareersPartner[]>("/partners")) ?? []);

export const careersCompanyServer = cache((slug: string) =>
  getPublic<{ company: CareersCompany; offers: CareersOfferSummary[] }>(`/${encodeURIComponent(slug)}`),
);

export type CareersSitemap = {
  companies: { slug: string; updatedAt: string }[];
  offers: { slug: string; reference: string; updatedAt: string }[];
};

export const careersSitemapServer = () => getPublic<CareersSitemap>("/sitemap");
