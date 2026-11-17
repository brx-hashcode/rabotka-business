import Image from "next/image";
import { useSiteCopy } from "../copy";
import { IconArrowRight } from "@tabler/icons-react";
import { useLocale, useTranslations } from "next-intl";

import { LocalLink as Link } from "#/components/local-link";
import { INTL_LOCALE, type Locale } from "#/i18n/config";
import type { BusinessCountryName } from "#/lib/api/catalog-server";
import { countryName } from "../country-name";
import { AUDIENCE_PHOTO, audiences, faqShown, SIGN_UP_HREF, trust } from "../content";
import { DemoButton } from "./demo-button";
import { FaqAccordion } from "./faq-accordion";
import { SectionHeading } from "./section-heading";
import { IconTile } from "./icon-tile";

/** What happens to the business's papers, the CVs and its mailbox. */
export function TrustSection() {
  const t = useTranslations("site.trust");
  const TRUST = trust(useSiteCopy());
  return (
    <section id="confiance" className="py-20 md:py-28">
      <div className="mx-auto w-full max-w-7xl space-y-12 px-4 sm:px-6">
        <SectionHeading
          kicker={t("kicker")}
          title={t("title")}
          text={t("text")}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map(({ title, text, icon }) => (
            <div key={title} className="space-y-3 rounded-3xl bg-card p-6">
              <IconTile icon={icon} />
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-muted-foreground text-sm">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Which organisations it is for: one card per sector with the posts it often
 * fills, and a last card on a photo for those not listed. Six even cells.
 */
export function AudiencesSection() {
  const t = useTranslations("site.audiences");
  const AUDIENCES = audiences(useSiteCopy());
  return (
    <section id="secteurs" className="py-20 md:py-28">
      <div className="mx-auto w-full max-w-7xl space-y-12 px-4 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            kicker={t("kicker")}
            title={t("title")}
            text={t("text")}
          />
          <DemoButton className="self-start lg:self-auto" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIENCES.map(({ title, text, icon, roles }) => (
            <article key={title} className="flex flex-col gap-5 rounded-3xl bg-card p-6 sm:p-7">
              <IconTile icon={icon} size="lg" />
              <div className="space-y-2">
                <h3 className="font-semibold text-xl tracking-tight">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{text}</p>
              </div>
              <div className="mt-auto space-y-2.5 pt-1">
                <p className="font-medium text-muted-foreground text-xs">{t("roles")}</p>
                <ul className="flex flex-wrap gap-1.5">
                  {roles.map((r) => (
                    <li key={r} className="rounded-full bg-page px-3 py-1 font-medium text-xs">
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
          <Link
            href={SIGN_UP_HREF}
            className="group relative isolate flex min-h-72 flex-col justify-end overflow-hidden rounded-3xl bg-ink p-6 text-white sm:p-7"
          >
            <Image
              src={AUDIENCE_PHOTO}
              alt=""
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="-z-10 object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <span aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-ink via-ink/70 to-ink/10" />
            <p className="font-semibold text-xl tracking-tight">{t("otherTitle")}</p>
            <p className="mt-2 text-sm text-white/80">{t("otherText")}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 self-start rounded-full bg-white px-4 py-2 font-medium text-ink text-sm">
              {t("otherCta")}
              <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/** The first question a visitor outside one country asks, from the backend's list. */
function useCountriesAnswer(countries: BusinessCountryName[]) {
  const t = useTranslations("site.countriesFaq");
  const locale = useLocale() as Locale;
  const list = new Intl.ListFormat(INTL_LOCALE[locale], { type: "conjunction" }).format(
    countries.map((c) => countryName(c, locale)),
  );
  return { q: t("q"), a: t("a", { list }) };
}

/** The FAQ: the few questions a business asks before it starts; the countries one where faqShown puts it (null). */
export function FaqSection({ countries }: Readonly<{ countries: BusinessCountryName[] }>) {
  const countriesItem = useCountriesAnswer(countries);
  const items = faqShown(useSiteCopy()).map((item) => item ?? countriesItem);
  return <FaqAccordion items={items} />;
}
