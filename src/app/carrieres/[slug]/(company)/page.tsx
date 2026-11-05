import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { CompanyPage } from "#/features/careers/components/company-page";
import { careersCompanyServer } from "#/lib/api/careers-server";
import { NOINDEX } from "#/lib/seo/indexed-host";
import { siteOrigin } from "#/lib/seo/site";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const page = await careersCompanyServer(slug);
  if (!page) return { title: "Offres d'emploi", robots: NOINDEX };
  const { indexed } = await siteOrigin();
  const title = `${page.company.name} recrute`;
  const description = `Les offres d'emploi ouvertes de ${page.company.name}${page.company.city ? ` à ${page.company.city}` : ""}. Postulez en ligne.`;
  return {
    title,
    description,
    robots: indexed && page.company.indexable ? { index: true, follow: true } : NOINDEX,
    alternates: { canonical: `/carrieres/${page.company.slug}` },
    openGraph: { type: "website", title, description, ...(page.company.logoUrl ? { images: [page.company.logoUrl] } : {}) },
  };
}

export default async function Page({ params }: Params) {
  const { slug } = await params;
  const page = await careersCompanyServer(slug);
  if (page === null) notFound();
  // An address from before the business was renamed: on to the current one
  // (a refresh tag once the page streams, which browsers and Google follow).
  if (page && page.company.slug !== slug) permanentRedirect(`/carrieres/${page.company.slug}`);
  // Already read for the metadata (cached): the page starts from it instead of loading it again.
  return <CompanyPage slug={slug} initial={page} />;
}
