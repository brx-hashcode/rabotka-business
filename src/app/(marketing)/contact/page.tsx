import type { Metadata } from "next";

import { getTranslations } from "next-intl/server";

import { Illustration } from "#/components/illustration";
import { LocalLink as Link } from "#/components/local-link";
import { IconArrowRight, IconHelpCircle, IconPresentation } from "@tabler/icons-react";

import { ContactCards } from "#/features/landing/components/landing-footer";
import { PageHero } from "#/features/landing/components/page-hero";
import { DEMO_HREF, SIGN_IN_HREF } from "#/features/landing/content";
import { marketingMetadata } from "#/lib/seo/marketing";
import { IconTile } from "#/features/landing/components/icon-tile";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("site.pages.contact");
  return marketingMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/contact",
  });
}

export default async function ContactPage() {
  const t = await getTranslations("site.pages.contact");
  const WAYS = [
    {
      icon: IconPresentation,
      illustration: "booked" as const,
      title: t("newTitle"),
      text: t("newText"),
      href: DEMO_HREF,
      cta: t("newCta"),
      primary: true,
    },
    {
      icon: IconHelpCircle,
      illustration: "chat" as const,
      title: t("clientTitle"),
      text: t("clientText"),
      href: SIGN_IN_HREF,
      cta: t("clientCta"),
      primary: false,
    },
  ];
  return (
    <>
      <PageHero
        title={t("title")}
        text={t("text")}
        actions={false}
      />
      <section className="px-4 py-20 sm:px-6 md:py-28">
        <div className="mx-auto w-full max-w-7xl space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {WAYS.map(({ icon, ...w }) => (
              <div key={w.title} className="flex flex-col gap-4 rounded-3xl bg-card p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <IconTile icon={icon} size="lg" />
                  <Illustration name={w.illustration} className="h-28 w-auto sm:h-32" />
                </div>
                <h2 className="font-semibold text-2xl tracking-tight">{w.title}</h2>
                <p className="flex-1 text-muted-foreground">{w.text}</p>
                <Link
                  href={w.href}
                  className={
                    w.primary
                      ? "inline-flex h-12 w-fit items-center gap-2 rounded-full bg-cta px-6 font-medium text-cta-foreground hover:bg-cta/90"
                      : "inline-flex h-12 w-fit items-center gap-2 rounded-full bg-page px-6 font-medium hover:bg-page/70"
                  }
                >
                  {w.cta}
                  <IconArrowRight className="size-4" />
                </Link>
              </div>
            ))}
          </div>
          <ContactCards title={t("directTitle")} text={t("directText")} />
        </div>
      </section>
    </>
  );
}
