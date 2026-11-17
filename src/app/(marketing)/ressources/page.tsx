import type { Metadata } from "next";
import { getSiteCopy } from "#/features/landing/copy";
import { IconArrowRight, IconClock } from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";

import { Illustration } from "#/components/illustration";
import { LocalLink as Link } from "#/components/local-link";
import { DemoBlock } from "#/features/landing/components/demo-block";
import { PageHero } from "#/features/landing/components/page-hero";
import { SectionHeading } from "#/features/landing/components/section-heading";
import { guides } from "#/features/landing/site-content";
import { marketingMetadata } from "#/lib/seo/marketing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("site.pages.resources");
  return marketingMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/ressources",
  });
}

export default async function ResourcesPage() {
  const t = await getTranslations("site.pages.resources");
  const GUIDES = guides(await getSiteCopy());
  return (
    <>
      <PageHero
        title={t("title")}
        text={t("text")}
        actions={false}
      />

      <section id="guides" className="py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl space-y-12 px-4 sm:px-6">
          <SectionHeading kicker={t("kicker")} title={t("heading")} />
          <ul className="grid gap-4 md:grid-cols-3">
            {GUIDES.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/ressources/${g.slug}`}
                  className="group flex h-full flex-col gap-4 rounded-3xl bg-card p-6 transition-colors hover:bg-card/70"
                >
                  <span className="flex h-40 items-center justify-center rounded-2xl bg-page p-5">
                    <Illustration name={g.illustration} className="h-full w-auto" />
                  </span>
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-page px-2.5 py-1 text-muted-foreground text-xs">
                    <IconClock className="size-3.5" />
                    {t("readingTime", { minutes: g.minutes })}
                  </span>
                  <span className="flex-1 space-y-2">
                    <span className="block font-semibold text-xl tracking-tight">{g.title}</span>
                    <span className="block text-muted-foreground text-sm">{g.description}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-sm">
                    {t("read")}
                    <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>


      <DemoBlock />
    </>
  );
}
