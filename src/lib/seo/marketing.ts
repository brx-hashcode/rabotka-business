import type { Metadata } from "next";

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
  alt: "Rabotka Business — l'ATS des organisations africaines",
} as const;

/** The public site's pages, as robots.txt lets crawlers in and the sitemap lists them. */
export const MARKETING_PATHS = ["/", "/fonctionnalites", "/ressources", "/a-propos", "/contact", "/demo"] as const;

/**
 * A marketing page's metadata: its own title, description and canonical,
 * indexed on business.rabotka.work only (develop and previews stay out).
 */
/** What a business searches for, on every marketing page; a page adds its own. */
const BASE_KEYWORDS = [
  "logiciel de recrutement",
  "ATS",
  "recrutement Afrique",
  "recrutement Congo",
  "analyse de CV",
  "offre d'emploi",
  "page carrières",
  "entretien en visio",
  "Rabotka",
];

export async function marketingMetadata({
  title,
  description,
  path,
  keywords = [],
}: Readonly<{ title: string; description: string; path: string; keywords?: string[] }>): Promise<Metadata> {
  const { indexed } = await siteOrigin();
  const full = path === "/" ? title : `${title} - Rabotka Business`;
  return {
    title: full,
    description,
    keywords: [...new Set([...keywords, ...BASE_KEYWORDS])],
    robots: indexed ? { index: true, follow: true } : NOINDEX,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: "Rabotka",
      locale: "fr_FR",
      title: full,
      description,
      url: path,
      images: [SHARE_IMAGE],
    },
    twitter: { card: "summary_large_image", title: full, description, images: [SHARE_IMAGE.url] },
  };
}

/** schema.org Organization for the home and « À propos » pages. */
export function organizationLd(origin: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Rabotka Business",
    url: origin,
    logo: `${origin}/icon-512.png`,
    description:
      "Logiciel de recrutement (ATS) des entreprises et organisations en Afrique : diffusion d'offres, analyse de CV, suivi des candidatures, entretiens et recrutement en équipe.",
    parentOrganization: { "@type": "Organization", name: "Rabotka", url: "https://www.rabotka.work" },
  };
}

/** A JSON-LD script's content, safe inside <script>. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
