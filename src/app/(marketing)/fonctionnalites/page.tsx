import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { DemoBlock } from "#/features/landing/components/demo-block";
import { FeatureTabs } from "#/features/landing/components/feature-tabs";
import { PageHero } from "#/features/landing/components/page-hero";
import { SectionHeading } from "#/features/landing/components/section-heading";
import { marketingMetadata } from "#/lib/seo/marketing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("site.pages.features");
  return marketingMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/fonctionnalites",
  });
}

/** Every tool, one at a time: the « Fonctionnalités clés » tabs, then the demo. */
export default async function FeaturesPage() {
  const t = await getTranslations("site.pages.features");
  return (
    <>
      <PageHero title={t("title")} text={t("text")} />
      <section className="bg-card py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl space-y-12 px-4 sm:px-6">
          <SectionHeading
            kicker={t("kicker")}
            title={t("heading")}
            text={t("headingText")}
          />
          <FeatureTabs />
        </div>
      </section>
      <DemoBlock />
    </>
  );
}
