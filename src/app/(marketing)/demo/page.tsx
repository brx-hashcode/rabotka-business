import type { Metadata } from "next";
import { IconCheck } from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";

import { DemoForm } from "#/features/demo/components/demo-form";
import { businessCountriesServer } from "#/lib/api/catalog-server";
import { marketingMetadata } from "#/lib/seo/marketing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("site.pages.demo");
  return marketingMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/demo",
  });
}

export default async function DemoPage() {
  const [countries, t] = await Promise.all([businessCountriesServer(), getTranslations("site.pages.demo")]);
  const YOU_WILL_SEE = t.raw("youWillSee") as string[];
  return (
    <section className="bg-header text-header-foreground">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 pt-10 pb-20 sm:px-6 md:pt-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <h1 className="font-semibold text-4xl leading-[1.08] tracking-tight sm:text-5xl">
            {t("title")}
          </h1>
          <p className="text-header-muted text-lg">{t("text")}</p>
          <ul className="space-y-3">
            {YOU_WILL_SEE.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-ink text-white">
                  <IconCheck className="size-3" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0 text-foreground">
          <DemoForm countries={countries} />
        </div>
      </div>
    </section>
  );
}
