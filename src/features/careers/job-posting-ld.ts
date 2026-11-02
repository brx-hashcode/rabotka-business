import type { CareersCompany, CareersOffer } from "#/lib/api/careers-controller";

/** schema.org's employment types, as Google for Jobs reads them. */
const EMPLOYMENT_TYPE: Record<CareersOffer["employmentType"], string[]> = {
  MISSION: ["TEMPORARY"],
  CDD: ["FULL_TIME", "TEMPORARY"],
  CDI: ["FULL_TIME"],
  STAGE: ["INTERN"],
};

const SALARY_UNIT: Partial<Record<NonNullable<CareersOffer["paymentFlow"]>, string>> = {
  HOURLY: "HOUR",
  DAILY: "DAY",
  MONTHLY: "MONTH",
};

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The description as Google wants it: the full text, paragraphs kept. */
function descriptionHtml(text: string): string {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/**
 * The offer as Google for Jobs reads it, from what the page itself shows: the
 * same title, text, place and pay. Applying happens on the page (`directApply`).
 */
export function jobPostingLd(company: CareersCompany, offer: CareersOffer, url: string) {
  const unit = offer.paymentFlow ? SALARY_UNIT[offer.paymentFlow] : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: offer.title,
    description: descriptionHtml(offer.description),
    identifier: { "@type": "PropertyValue", name: company.name, value: offer.reference },
    datePosted: offer.publishedAt,
    ...(offer.closesAt ? { validThrough: offer.closesAt } : {}),
    employmentType: EMPLOYMENT_TYPE[offer.employmentType],
    hiringOrganization: {
      "@type": "Organization",
      name: company.name,
      ...(company.website ? { sameAs: company.website } : {}),
      ...(company.logoUrl ? { logo: company.logoUrl } : {}),
    },
    ...(offer.isRemote
      ? {
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: { "@type": "Country", name: offer.countryName ?? "Congo" },
        }
      : {
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              ...(offer.city ? { addressLocality: offer.city } : {}),
              addressCountry: offer.countryName ?? "Congo",
            },
          },
        }),
    ...(offer.amount !== null && unit
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "XAF",
            value: { "@type": "QuantitativeValue", value: offer.amount, unitText: unit },
          },
        }
      : {}),
    totalJobOpenings: offer.quantity,
    directApply: true,
    url,
  };
}

/** For a `<script type="application/ld+json">`: no `<` can close the tag early. */
export function ldScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
