import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { DEFAULT_LOCALE, OFFERED_LOCALES, OG_LOCALE, type Locale } from "#/i18n/config";
import { localizedPath } from "#/i18n/routing";
import { NOINDEX } from "./indexed-host";
import { siteOrigin } from "./site";

/**
 * The share card (src/app/opengraph-image.tsx). Named here because a page
 * that sets `openGraph` replaces its parent's whole object: without this the
 * file's image is dropped and WhatsApp shows the bare logo.
 */
export const SHARE_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
} as const;

/** The public site's pages, as robots.txt lets crawlers in and the sitemap lists them. */
export const MARKETING_PATHS = ["/", "/fonctionnalites", "/ressources", "/a-propos", "/contact", "/demo"] as const;

/**
 * A marketing page's metadata: its own title, description and canonical,
 * indexed on business.rabotka.work only (develop and previews stay out).
 */
/** What a business searches for, on every marketing page; a page adds its own. */
const BASE_KEYWORDS: Record<Locale, string[]> = {
  fr: [
    "logiciel de recrutement",
    "ATS",
    "recrutement Afrique",
    "recrutement Congo",
    "analyse de CV",
    "offre d'emploi",
    "page carrières",
    "entretien en visio",
    "Rabotka",
  ],
  en: [
    "recruitment software",
    "ATS",
    "hiring in Africa",
    "applicant tracking system",
    "CV screening",
    "job posting",
    "careers page",
    "video interview",
    "Rabotka",
  ],
};

/**
 * The page's URL in each offered language, for hreflang; x-default is the
 * French one. Empty while only French is offered.
 */
export function languageAlternates(path: string): Record<string, string> | undefined {
  if (OFFERED_LOCALES.length < 2) return undefined;
  return {
    ...Object.fromEntries(OFFERED_LOCALES.map((l) => [l, localizedPath(path, l)])),
    "x-default": localizedPath(path, DEFAULT_LOCALE),
  };
}

export async function marketingMetadata({
  title,
  description,
  path,
  keywords = [],
}: Readonly<{ title: string; description: string; path: string; keywords?: string[] }>): Promise<Metadata> {
  const { indexed } = await siteOrigin();
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("site.pages.seo");
  const full = path === "/" ? title : t("suffix", { title });
  const url = localizedPath(path, locale);
  return {
    title: full,
    description,
    keywords: [...new Set([...keywords, ...BASE_KEYWORDS[locale]])],
    robots: indexed ? { index: true, follow: true } : NOINDEX,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type: "website",
      siteName: "Rabotka",
      locale: OG_LOCALE[locale],
      title: full,
      description,
      url,
      images: [{ ...SHARE_IMAGE, alt: t("shareAlt") }],
    },
    twitter: { card: "summary_large_image", title: full, description, images: [SHARE_IMAGE.url] },
  };
}

/** schema.org Organization for the home and « À propos » pages; `description` in the page's language. */
export function organizationLd(origin: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Rabotka Business",
    url: origin,
    logo: `${origin}/icon-512.png`,
    description,
    parentOrganization: { "@type": "Organization", name: "Rabotka", url: "https://www.rabotka.work" },
  };
}

/** A JSON-LD script's content, safe inside <script>. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
