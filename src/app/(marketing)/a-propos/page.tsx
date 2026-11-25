import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { Illustration } from "#/components/illustration";
import { DemoBlock } from "#/features/landing/components/demo-block";
import { TrustSection } from "#/features/landing/components/landing-sections";
import { flagUrl } from "#/features/landing/globe/country-places";
import { PageHero } from "#/features/landing/components/page-hero";
import { SectionHeading } from "#/features/landing/components/section-heading";
import { countryName } from "#/features/landing/country-name";
import type { Locale } from "#/i18n/config";
import { businessCountriesServer } from "#/lib/api/catalog-server";
import { jsonLd, marketingMetadata, organizationLd } from "#/lib/seo/marketing";
import { siteOrigin } from "#/lib/seo/site";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("site.pages.about");
  return marketingMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/a-propos",
  });
}

/** Beside each belief (site.pages.about.beliefs), in order. */
const BELIEF_ILLUSTRATIONS = ["job-hunt", "team", "mobile"] as const;

export default async function AboutPage() {
  const [countries, { origin }, t, tSeo, locale] = await Promise.all([
    businessCountriesServer(),
    siteOrigin(),
    getTranslations("site.pages.about"),
    getTranslations("site.pages.seo"),
    getLocale() as Promise<Locale>,
  ]);
  const BELIEFS = (t.raw("beliefs") as { title: string; text: string }[]).map((b, i) => ({
    ...b,
    illustration: BELIEF_ILLUSTRATIONS[i],
  }));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(organizationLd(origin, tSeo("orgDescription"))) }} />
      <PageHero
        title={t("title")}
        text={t("text")}
      />

      <section className="bg-card py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl space-y-12 px-4 sm:px-6">
          <SectionHeading
            kicker={t("kicker")}
            title={t("heading")}
          />
          <div className="grid gap-4 md:grid-cols-3">
            {BELIEFS.map((b, i) => (
              <div key={b.title} className="space-y-4 rounded-3xl bg-page p-6 sm:p-8">
                <div className="flex h-36 items-center justify-center">
                  <Illustration name={b.illustration} className="h-full w-auto" />
                </div>
                <span className="flex size-10 items-center justify-center rounded-full bg-brand-lime font-semibold text-brand-lime-foreground">
                  {i + 1}
                </span>
                <h3 className="font-semibold text-xl">{b.title}</h3>
                <p className="text-muted-foreground text-sm">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl space-y-10 px-4 sm:px-6">
          <SectionHeading
            kicker={t("whereKicker")}
            title={t("whereTitle", { count: countries.length })}
            text={t("whereText")}
          />
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
      <TrustSection />
      <DemoBlock />
    </>
  );
}
