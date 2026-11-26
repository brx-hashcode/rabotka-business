"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBriefcase,
  IconCalendarEvent,
  IconCash,
  IconMapPin,
  IconShare,
  type Icon as TablerIcon,
} from "@tabler/icons-react";

import { Bone } from "#/components/page-skeletons";
import { DescriptionText } from "#/features/careers/components/description-text";
import { candidateSource, SOURCE_KEY } from "#/features/careers/candidate-source";
import { INTL_LOCALE, type Locale } from "#/i18n/config";
import type { Translator } from "#/i18n/translator";
import { getCareersOffer } from "#/lib/api/careers-controller";
import { CareersShell, CompanyLogo, offerPlace } from "./careers-shell";

const longDate = (iso: string, locale: Locale) =>
  new Date(iso).toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "long", year: "numeric" });

type Offer = NonNullable<Awaited<ReturnType<typeof getCareersOffer>>>["offer"];

/** The offer's essentials, once: on the chips under the title, and beside « Postuler ». */
function facts(
  o: Offer,
  t: Translator<"careers">,
  labels: Translator<"labels">,
  locale: Locale,
): { icon: TablerIcon; label: string; text: string }[] {
  const amount = (n: number) => n.toLocaleString(INTL_LOCALE[locale]);
  return [
    { icon: IconMapPin, label: t("offer.facts.place"), text: offerPlace(o, t("place.remote")) },
    {
      icon: IconBriefcase,
      label: t("offer.facts.type"),
      text: t("offer.type", { type: labels(`employmentType.${o.employmentType}`), quantity: o.quantity }),
    },
    {
      icon: IconCash,
      label: t("offer.facts.pay"),
      text:
        o.amount === null
          ? t("offer.toDiscuss")
          : o.paymentFlow
            ? t("offer.amountWithSuffix", { amount: amount(o.amount), suffix: labels(`paymentSuffix.${o.paymentFlow}`) })
            : t("offer.amount", { amount: amount(o.amount) }),
    },
    ...(o.closesAt
      ? [{ icon: IconCalendarEvent, label: t("offer.facts.applications"), text: t("offer.until", { date: longDate(o.closesAt, locale) }) }]
      : []),
  ].filter((r) => r.text);
}

/** The phone's own share sheet, or the link copied where there is none. */
async function share(title: string, copied: string) {
  const url = window.location.href.split("?")[0] ?? window.location.href;
  try {
    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success(copied);
  } catch {
    // Share sheet closed: nothing to say.
  }
}

/**
 * Step 1 of an application from outside Rabotka: the offer, and « Postuler ».
 * The company's careers page width; the offer in one card, under its logo;
 * « Postuler » stays at the bottom of the screen.
 */
export function OfferPage({
  slug,
  reference,
  initial,
}: Readonly<{ slug: string; reference: string; initial?: Awaited<ReturnType<typeof getCareersOffer>> }>) {
  const t = useTranslations("careers");
  const labels = useTranslations("labels");
  const locale = useLocale() as Locale;
  // Started from what the server read: the description is in the HTML, and
  // the offer is not asked for a second time.
  const query = useQuery({
    queryKey: ["careers", slug, reference],
    queryFn: () => getCareersOffer(slug, reference),
    initialData: initial,
    retry: false,
  });
  const page = query.data;
  const o = page?.offer;
  // Where the visitor came from, noted for the form: the referrer is lost there.
  const sourceParam = useSearchParams().get("source");
  useEffect(() => {
    try {
      sessionStorage.setItem(SOURCE_KEY, candidateSource(sourceParam, document.referrer, window.location.hostname));
    } catch {
      // Private browsing: the application simply says « direct ».
    }
  }, [sourceParam]);
  const apply = `/carrieres/${slug}/${reference}/postuler`;

  if (query.isLoading) {
    return (
      <CareersShell>
        <div className="space-y-4 rounded-3xl bg-card p-6 sm:p-10">
          <Bone className="h-32 w-full rounded-2xl" />
          <Bone className="h-8 w-2/3" />
          <Bone className="h-40 w-full rounded-2xl" />
        </div>
      </CareersShell>
    );
  }
  if (!page || !o) {
    return (
      <CareersShell>
        <section className="space-y-3 rounded-3xl bg-card p-6 text-center sm:p-10">
          <h1 className="font-semibold text-lg">{t("closed.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("closed.hint")}</p>
          <Link href={`/carrieres/${slug}`} className="inline-block font-medium text-sm underline underline-offset-2">
            {t("closed.seeOthers")}
          </Link>
        </section>
      </CareersShell>
    );
  }

  const company = page.company;
  const rows = facts(o, t, labels, locale);

  return (
    <CareersShell>
      <div className="space-y-6 pb-24">
        <article className="space-y-10 rounded-3xl bg-card p-6 sm:p-10">
          <header className="space-y-5">
            {/* Back, and who recruits, on one line; the title has the whole width. */}
            <div className="flex items-center gap-3">
              <Link
                href={`/carrieres/${slug}`}
                aria-label={t("offer.allOffers", { company: company.name })}
                title={t("offer.allOffers", { company: company.name })}
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-page text-foreground transition-colors hover:bg-page/70"
              >
                <IconArrowLeft className="size-5" />
              </Link>
              <Link href={`/carrieres/${slug}`} className="flex min-w-0 items-center gap-2.5 rounded-full py-1 pr-3 transition-colors hover:bg-page">
                <CompanyLogo company={company} size="sm" />
                <span className="min-w-0 truncate text-sm">
                  <span className="font-semibold">{company.name}</span>
                  <span className="text-muted-foreground">{t("recruits")}</span>
                </span>
              </Link>
            </div>
            <div className="space-y-2">
              <h1 className="font-semibold text-2xl leading-tight tracking-tight sm:text-3xl">{o.title}</h1>
              <p className="text-muted-foreground text-sm">
                {t("offer.published", { date: longDate(o.publishedAt, locale) })}
                {o.categoryName ? ` · ${o.categoryName}` : ""}
              </p>
            </div>
            <ul className="flex flex-wrap gap-2">
              {rows.map((r) => (
                <li key={r.label} className="inline-flex items-center gap-2 rounded-full bg-page py-1.5 pr-3.5 pl-2 text-sm">
                  <span className="flex size-7 items-center justify-center rounded-full bg-brand-lime text-[#0f2414]">
                    <r.icon className="size-4" />
                  </span>
                  <span className="sr-only">{t("offer.facts.labelled", { label: r.label })}</span>
                  {r.text}
                </li>
              ))}
            </ul>
          </header>

          <section className="space-y-3">
            <h2 className="font-semibold text-xl">{t("offer.theJob")}</h2>
            <DescriptionText text={o.description} className="text-[15px]" />
          </section>

        </article>
      </div>

      {/* « Postuler » at the bottom of the screen, never over the text's last lines. */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-linear-to-t from-page via-page/95 to-transparent px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-2xl gap-2">
          <button
            type="button"
            aria-label={t("offer.share")}
            title={t("offer.share")}
            onClick={() => void share(o.title, t("offer.linkCopied"))}
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-card shadow-soft transition-colors hover:bg-card/80"
          >
            <IconShare className="size-5" />
          </button>
          <Link
            href={apply}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-ink font-semibold text-[17px] text-white shadow-soft transition-opacity hover:opacity-90"
          >
            {t("offer.apply")}
            <IconArrowRight className="size-5" />
          </Link>
        </div>
      </div>
    </CareersShell>
  );
}
