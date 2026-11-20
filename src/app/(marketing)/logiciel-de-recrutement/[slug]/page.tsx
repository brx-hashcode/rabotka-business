import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IconArrowRight } from "@tabler/icons-react";
import { getLocale, getTranslations } from "next-intl/server";

import { LocalLink as Link } from "#/components/local-link";
import { DemoBlock } from "#/features/landing/components/demo-block";
import { FaqAccordion } from "#/features/landing/components/faq-accordion";
import { PageHero } from "#/features/landing/components/page-hero";
import { SectionHeading } from "#/features/landing/components/section-heading";
import { features } from "#/features/landing/content";
import { getSiteCopy } from "#/features/landing/copy";
import { countryName } from "#/features/landing/country-name";
import { flagUrl } from "#/features/landing/globe/country-places";
import { FeatureMockup } from "#/features/landing/mockups/mockups";
import { SOLUTION_SLUGS, solutions } from "#/features/landing/solutions";
import type { Locale } from "#/i18n/config";
import { businessCountriesServer } from "#/lib/api/catalog-server";
import { breadcrumbLd, faqLd, jsonLd, marketingMetadata, softwareLd } from "#/lib/seo/marketing";
import { siteOrigin } from "#/lib/seo/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return SOLUTION_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/logiciel-de-recrutement/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = solutions(await getSiteCopy()).find((s) => s.slug === slug);
  if (!page) return {};
  return marketingMetadata({
    title: page.metaTitle,
    description: page.metaDescription,
    path: page.href,
    keywords: page.keywords,
  });
}

/**
 * A page for one search (« logiciel de recrutement pour PME », « ATS
 * Afrique »): the answer in its heading, why it fits, every feature one
 * click away, where Rabotka is open, the questions people ask, the demo.
 */
export default async function SolutionPage({ params }: PageProps<"/logiciel-de-recrutement/[slug]">) {
  const { slug } = await params;
  const [copy, countries, t, locale, { origin }] = await Promise.all([
    getSiteCopy(),
    businessCountriesServer(),
    getTranslations("site.pages.solution"),
    getLocale() as Promise<Locale>,
    siteOrigin(),
  ]);
  const page = solutions(copy).find((s) => s.slug === slug);
  if (!page) notFound();
  // What the page says, as search engines read it: the product, its questions, its place.
  const structured = [
    softwareLd(origin, page.metaDescription, countries.map((c) => countryName(c, locale))),
    faqLd(page.faq),
    breadcrumbLd(origin, locale, [
      { name: "Rabotka Business", path: "/" },
      { name: page.label, path: page.href },
    ]),
  ];

  return (
    <>
      {structured.map((data) => (
        <script key={data["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
      ))}
      <PageHero title={page.heading} text={page.intro} aside={<FeatureMockup id={page.mockup} />} />

      <section className="py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl space-y-14 px-4 sm:px-6">
          <SectionHeading kicker={page.whyKicker} title={page.whyTitle} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {page.why.map((w, n) => (
              <div key={w.title} className="space-y-3 rounded-3xl bg-card p-6">
                <span className="font-semibold text-muted-foreground text-xs tabular-nums">
                  {String(n + 1).padStart(2, "0")}
                </span>
                <h3 className="font-semibold text-lg">{w.title}</h3>
                <p className="text-muted-foreground text-sm">{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-card py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl space-y-14 px-4 sm:px-6">
          <SectionHeading kicker={t("featuresKicker")} title={page.featuresTitle} />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features(copy).map((f) => (
              <li key={f.slug}>
                <Link
                  href={f.href}
                  className="group flex h-full flex-col gap-3 rounded-3xl bg-page p-6 no-underline"
                >
                  <f.icon aria-hidden className="size-6 text-whatsapp-dark" />
                  <span className="font-semibold text-foreground text-lg">{f.label}</span>
                  <span className="flex-1 text-muted-foreground text-sm">{f.description}</span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-foreground text-sm">
                    {t("more")}
                    <IconArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {countries.length > 0 && (
        <section className="py-20 md:py-28">
          <div className="mx-auto w-full max-w-7xl space-y-10 px-4 sm:px-6">
            <SectionHeading kicker={t("countriesKicker")} title={t("countriesTitle", { count: countries.length })} />
            <ul className="flex flex-wrap gap-2">
              {countries.map((c) => (
                <li key={c.code} className="inline-flex items-center gap-2 rounded-full bg-card py-2 pr-4 pl-2 font-medium text-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={flagUrl(c.code, 80)} alt="" className="size-6 rounded-full object-cover" />
                  {countryName(c, locale)}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <FaqAccordion items={page.faq} />
      <DemoBlock />
    </>
  );
}
