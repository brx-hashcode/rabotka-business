import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { OfferPage } from "#/features/careers/components/offer-page";
import { jobPostingLd, ldScript } from "#/features/careers/job-posting-ld";
import { careersOfferServer } from "#/lib/api/careers-server";
import { NOINDEX } from "#/lib/seo/indexed-host";
import { siteOrigin } from "#/lib/seo/site";

type Params = { params: Promise<{ slug: string; reference: string }> };

const excerpt = (text: string) => {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > 160 ? `${flat.slice(0, 157)}…` : flat;
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, reference } = await params;
  const page = await careersOfferServer(slug, reference);
  if (!page) return { title: "Offre d'emploi", robots: NOINDEX };
  const { indexed } = await siteOrigin();
  const title = `${page.offer.title} · ${page.company.name}`;
  const description = excerpt(page.offer.description);
  return {
    title,
    description,
    robots: indexed && page.company.indexable ? { index: true, follow: true } : NOINDEX,
    alternates: { canonical: `/carrieres/${page.company.slug}/${reference}` },
    openGraph: { type: "website", title, description },
  };
}

/**
 * One offer. The page itself renders in the browser; the server adds what a
 * search engine reads first (title, description, the JobPosting data), and a
 * real 404 once the offer has closed.
 */
export default async function Page({ params }: Params) {
  const { slug, reference } = await params;
  const page = await careersOfferServer(slug, reference);
  if (page === null) notFound();
  // An address from before the business was renamed: on to the current one
  // (a real 308: the page no longer streams before it is decided).
  if (page && page.company.slug !== slug) permanentRedirect(`/carrieres/${page.company.slug}/${reference}`);
  const { origin, indexed } = await siteOrigin();
  const ld =
    page && indexed && page.company.indexable
      ? jobPostingLd(page.company, page.offer, `${origin}/carrieres/${slug}/${reference}`)
      : null;

  return (
    <>
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(ld) }} />}
      <OfferPage slug={slug} reference={reference} initial={page ?? undefined} />
    </>
  );
}
