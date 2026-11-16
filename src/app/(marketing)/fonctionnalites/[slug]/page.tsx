import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { IconCheck } from "@tabler/icons-react";
import { getLocale, getTranslations } from "next-intl/server";

import { DemoBlock } from "#/features/landing/components/demo-block";
import { PipelinePosition } from "#/features/landing/components/feature-stages";
import { PageHero } from "#/features/landing/components/page-hero";
import { SectionHeading } from "#/features/landing/components/section-heading";
import { features, FEATURE_SLUGS } from "#/features/landing/content";
import type { Locale } from "#/i18n/config";
import { FeatureMockup } from "#/features/landing/mockups/mockups";
import { featurePage } from "#/features/landing/site-content";
import { marketingMetadata } from "#/lib/seo/marketing";

export const dynamicParams = false;

export function generateStaticParams() {
  return FEATURE_SLUGS.map((slug) => ({ slug }));
}

function find(slug: string, locale: Locale) {
  const feature = features(locale).find((f) => f.slug === slug);
  if (!feature || feature.id === "pipeline") return null;
  return { feature, page: featurePage(locale, feature.id) };
}

export async function generateMetadata({ params }: PageProps<"/fonctionnalites/[slug]">): Promise<Metadata> {
  const found = find((await params).slug, (await getLocale()) as Locale);
  if (!found) return {};
  return marketingMetadata({
    title: found.page.metaTitle,
    description: found.page.metaDescription,
    path: found.feature.href,
  });
}

/** One tool: what it does, where it sits in the hire (a link to the others), the demo. */
export default async function FeaturePage({ params }: PageProps<"/fonctionnalites/[slug]">) {
  const found = find((await params).slug, (await getLocale()) as Locale);
  const t = await getTranslations("site.pages.feature");
  if (!found) notFound();
  const { feature, page } = found;

  return (
    <>
      <PageHero title={page.heading} text={page.intro} aside={<FeatureMockup id={feature.id} />} />

      {page.steps && (
        <section className="py-20 md:py-28">
          <div className="mx-auto w-full max-w-7xl space-y-14 px-4 sm:px-6">
            <SectionHeading kicker={feature.label} title={t("how")} />
            <ol className="space-y-16 md:space-y-24">
              {page.steps.map((s, n) => (
                <li key={s.title} className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
                  {/* Photo and text alternate sides, step after step. */}
                  <div className={`relative aspect-[4/3] overflow-hidden rounded-3xl bg-card ${n % 2 === 1 ? "md:order-2" : ""}`}>
                    <Image src={s.photo} alt={s.alt} fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
                  </div>
                  <div className="space-y-4">
                    <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                      {String(n + 1).padStart(2, "0")} · {s.kicker}
                    </p>
                    <h3 className="font-semibold text-2xl tracking-tight sm:text-3xl">{s.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{s.text}</p>
                    <ul className="space-y-2">
                      {s.points.map((x) => (
                        <li key={x} className="flex items-start gap-2.5 text-[15px]">
                          <IconCheck className="mt-0.5 size-4 shrink-0 text-whatsapp-dark" />
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="bg-card py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl space-y-14 px-4 sm:px-6">
          <SectionHeading kicker={feature.label} title={t("gains")} />
          {/* Six benefits sit in two rows of three, four in one row. */}
          <div className={`grid gap-4 sm:grid-cols-2 ${page.benefits.length % 3 === 0 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
            {page.benefits.map((b, n) => (
              <div key={b.title} className="space-y-3 rounded-3xl bg-page p-6">
                <span className="font-semibold text-muted-foreground text-xs tabular-nums">
                  {String(n + 1).padStart(2, "0")}
                </span>
                <h3 className="font-semibold text-lg">{b.title}</h3>
                <p className="text-muted-foreground text-sm">{b.text}</p>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <p className="font-medium text-sm">{t("inPipeline")}</p>
            <PipelinePosition featureId={feature.id} />
          </div>
        </div>
      </section>


      <DemoBlock />
    </>
  );
}
