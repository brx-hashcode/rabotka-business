"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBriefcase,
  IconCalendarEvent,
  IconCash,
  IconCheck,
  IconExternalLink,
  IconMapPin,
  IconShare,
  type Icon as TablerIcon,
} from "@tabler/icons-react";

import { Bone } from "#/components/page-skeletons";
import { DescriptionText } from "#/features/careers/components/description-text";
import { EMPLOYMENT_LABEL, PAYMENT_SUFFIX } from "#/features/offers/offer-labels";
import { candidateSource, SOURCE_KEY } from "#/features/careers/candidate-source";
import { getCareersOffer, type CareersCompany } from "#/lib/api/careers-controller";
import { cn } from "#/lib/utils";
import { CareersShell, CompanyLogo, offerPlace } from "./careers-shell";
import { websiteHref } from "./company-hero";

const longDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;

type Offer = NonNullable<Awaited<ReturnType<typeof getCareersOffer>>>["offer"];

/** The offer's essentials, once: on the chips under the title, and beside « Postuler ». */
function facts(o: Offer): { icon: TablerIcon; label: string; text: string }[] {
  return [
    { icon: IconMapPin, label: "Lieu", text: offerPlace(o) },
    { icon: IconBriefcase, label: "Type", text: `${EMPLOYMENT_LABEL[o.employmentType]} · ${o.quantity} poste${o.quantity > 1 ? "s" : ""}` },
    {
      icon: IconCash,
      label: "Rémunération",
      text: o.amount === null ? "À discuter" : `${fcfa(o.amount)}${o.paymentFlow ? ` ${PAYMENT_SUFFIX[o.paymentFlow]}` : ""}`,
    },
    ...(o.closesAt ? [{ icon: IconCalendarEvent, label: "Candidatures", text: `Jusqu'au ${longDate(o.closesAt)}` }] : []),
  ].filter((r) => r.text);
}

/** The phone's own share sheet, or the link copied where there is none. */
async function share(title: string) {
  const url = window.location.href.split("?")[0] ?? window.location.href;
  try {
    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Lien de l'offre copié.");
  } catch {
    // Share sheet closed: nothing to say.
  }
}

/**
 * Step 1 of an application from outside Rabotka: the offer, and « Postuler ».
 * The company first (its cover, its logo), then the offer; on a wide screen
 * « Postuler » and the essentials stay in sight beside the text, on a phone
 * at the bottom of the screen.
 */
export function OfferPage({
  slug,
  reference,
  initial,
}: Readonly<{ slug: string; reference: string; initial?: Awaited<ReturnType<typeof getCareersOffer>> }>) {
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
      <CareersShell wide>
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
          <h1 className="font-semibold text-lg">Cette offre n&apos;est plus ouverte</h1>
          <p className="text-muted-foreground text-sm">Elle a peut-être été pourvue ou retirée.</p>
          <Link href={`/carrieres/${slug}`} className="inline-block font-medium text-sm underline underline-offset-2">
            Voir les autres offres
          </Link>
        </section>
      </CareersShell>
    );
  }

  const company = page.company;
  const rows = facts(o);
  const benefits = company.benefits?.filter((b) => b.trim()) ?? [];

  return (
    <CareersShell wide>
      <div className="space-y-6 pb-24 lg:pb-0">
        {/* The company first: its cover, its logo, then the offer's title and essentials. */}
        <header className="overflow-hidden rounded-3xl bg-card">
          <div className="relative h-36 w-full sm:h-56">
            {company.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- the business's own upload, any host
              <img src={company.coverUrl} alt="" className="absolute inset-0 size-full object-cover" />
            ) : (
              <div aria-hidden className="absolute inset-0 bg-linear-to-br from-brand-lime/80 via-whatsapp/25 to-whatsapp-dark/40" />
            )}
            {/* Back to the company's offers, on the cover as in an app. */}
            <Link
              href={`/carrieres/${slug}`}
              aria-label={`Toutes les offres de ${company.name}`}
              title={`Toutes les offres de ${company.name}`}
              className="absolute top-3 left-3 flex size-10 items-center justify-center rounded-full bg-card/90 text-foreground shadow-soft backdrop-blur transition-colors hover:bg-card sm:top-4 sm:left-4"
            >
              <IconArrowLeft className="size-5" />
            </Link>
          </div>
          <div className="space-y-5 px-6 pb-7 sm:px-10 sm:pb-9">
            <div className="-mt-10 inline-flex rounded-3xl bg-card p-1.5 sm:-mt-12">
              <CompanyLogo company={company} />
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground/70">{company.name} recrute</p>
              <h1 className="font-semibold text-3xl leading-tight tracking-tight sm:text-4xl">{o.title}</h1>
              <p className="text-muted-foreground text-sm">
                Publiée le {longDate(o.publishedAt)}
                {o.categoryName ? ` · ${o.categoryName}` : ""}
              </p>
            </div>
            <ul className="flex flex-wrap gap-2">
              {rows.map((r) => (
                <li key={r.label} className="inline-flex items-center gap-2 rounded-full bg-page py-1.5 pr-3.5 pl-2 text-sm">
                  <span className="flex size-7 items-center justify-center rounded-full bg-brand-lime text-[#0f2414]">
                    <r.icon className="size-4" />
                  </span>
                  <span className="sr-only">{r.label} : </span>
                  {r.text}
                </li>
              ))}
            </ul>
          </div>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <article className="space-y-10 rounded-3xl bg-card p-6 sm:p-10">
            <section className="space-y-3">
              <h2 className="font-semibold text-xl">Le poste</h2>
              <DescriptionText text={o.description} className="text-[15px]" />
            </section>

            {benefits.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-semibold text-xl">Pourquoi nous rejoindre</h2>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 rounded-2xl bg-page p-3 text-[15px]">
                      <IconCheck className="mt-0.5 size-4 shrink-0 text-whatsapp-dark" />
                      {b}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {company.description?.trim() && (
              <section className="space-y-3">
                <h2 className="font-semibold text-xl">À propos de {company.name}</h2>
                <DescriptionText text={company.description} className="text-[15px] text-foreground/80" />
              </section>
            )}
          </article>

          {/* Beside the text on a wide screen, in sight while it scrolls. */}
          <aside className="hidden space-y-4 lg:sticky lg:top-6 lg:block">
            <div className="space-y-4 rounded-3xl bg-card p-6">
              <Link
                href={apply}
                className="flex h-13 items-center justify-center gap-2 rounded-full bg-ink font-semibold text-[16px] text-white transition-opacity hover:opacity-90"
              >
                Postuler à cette offre
                <IconArrowRight className="size-5" />
              </Link>
              <p className="text-center text-muted-foreground text-xs">Sans compte : votre CV et quelques questions.</p>
              <dl className="space-y-3 pt-1">
                {rows.map((r) => (
                  <div key={r.label} className="flex items-start gap-3">
                    <r.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <dt className="text-muted-foreground text-xs">{r.label}</dt>
                      <dd className="font-medium text-sm">{r.text}</dd>
                    </div>
                  </div>
                ))}
              </dl>
              <button
                type="button"
                onClick={() => void share(o.title)}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-page font-medium text-sm transition-colors hover:bg-page/70"
              >
                <IconShare className="size-4" />
                Partager l&apos;offre
              </button>
            </div>
            <CompanyCard company={company} slug={slug} />
          </aside>
        </div>

        <div className="lg:hidden">
          <CompanyCard company={company} slug={slug} />
        </div>
      </div>

      {/* On a phone: « Postuler » at the bottom of the screen, never over the text's last lines. */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-linear-to-t from-page via-page/95 to-transparent px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto flex max-w-2xl gap-2">
          <button
            type="button"
            aria-label="Partager l'offre"
            onClick={() => void share(o.title)}
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-card shadow-soft"
          >
            <IconShare className="size-5" />
          </button>
          <Link
            href={apply}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-ink font-semibold text-[17px] text-white shadow-soft"
          >
            Postuler à cette offre
            <IconArrowRight className="size-5" />
          </Link>
        </div>
      </div>
    </CareersShell>
  );
}

/** Who recruits: what it does, where, its website, and its other offers. */
function CompanyCard({ company, slug }: Readonly<{ company: CareersCompany; slug: string }>) {
  const site = websiteHref(company.website);
  return (
    <div className="space-y-4 rounded-3xl bg-card p-6">
      <div className="flex items-center gap-3">
        <CompanyLogo company={company} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{company.name}</p>
          <p className="truncate text-muted-foreground text-sm">{[company.categoryLabel, company.city].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      <div className={cn("grid gap-2", site && "grid-cols-2")}>
        <Link
          href={`/carrieres/${slug}`}
          className="flex h-10 items-center justify-center rounded-full bg-page px-3 font-medium text-sm transition-colors hover:bg-page/70"
        >
          Toutes ses offres
        </Link>
        {site && (
          <a
            href={site}
            target="_blank"
            rel="noreferrer"
            className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-page px-3 font-medium text-sm transition-colors hover:bg-page/70"
          >
            Site web
            <IconExternalLink className="size-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
