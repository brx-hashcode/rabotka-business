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
  IconMapPin,
  IconShare,
  type Icon as TablerIcon,
} from "@tabler/icons-react";

import { Bone } from "#/components/page-skeletons";
import { DescriptionText } from "#/features/careers/components/description-text";
import { EMPLOYMENT_LABEL, PAYMENT_SUFFIX } from "#/features/offers/offer-labels";
import { candidateSource, SOURCE_KEY } from "#/features/careers/candidate-source";
import { getCareersOffer } from "#/lib/api/careers-controller";
import { CareersShell, offerPlace } from "./careers-shell";
import { CompanyHero } from "./company-hero";

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
 * The company first, as on its careers page (same width, same cover), then
 * the offer; « Postuler » stays at the bottom of the screen.
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

  return (
    <CareersShell>
      <div className="space-y-6 pb-24">
        {/* The company first, as on its careers page; back to its offers from the cover. */}
        <div className="relative">
          <CompanyHero
            company={company}
            heading="p"
            actions={
              <Link
                href={`/carrieres/${slug}`}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-page px-4 font-medium text-sm transition-colors hover:bg-page/70"
              >
                <IconBriefcase className="size-4" />
                Toutes les offres
              </Link>
            }
          />
          <Link
            href={`/carrieres/${slug}`}
            aria-label={`Toutes les offres de ${company.name}`}
            title={`Toutes les offres de ${company.name}`}
            className="absolute top-3 left-3 z-10 flex size-10 items-center justify-center rounded-full bg-card/90 text-foreground shadow-soft backdrop-blur transition-colors hover:bg-card sm:top-4 sm:left-4"
          >
            <IconArrowLeft className="size-5" />
          </Link>
        </div>

        <article className="space-y-10 rounded-3xl bg-card p-6 sm:p-10">
          <header className="space-y-4">
            <div className="space-y-2">
              <p className="font-medium text-foreground/70">{company.name} recrute</p>
              <h1 className="font-semibold text-2xl leading-tight tracking-tight sm:text-3xl">{o.title}</h1>
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
          </header>

          <section className="space-y-3">
            <h2 className="font-semibold text-xl">Le poste</h2>
            <DescriptionText text={o.description} className="text-[15px]" />
          </section>

        </article>
      </div>

      {/* « Postuler » at the bottom of the screen, never over the text's last lines. */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-linear-to-t from-page via-page/95 to-transparent px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-2xl gap-2">
          <button
            type="button"
            aria-label="Partager l'offre"
            title="Partager l'offre"
            onClick={() => void share(o.title)}
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-card shadow-soft transition-colors hover:bg-card/80"
          >
            <IconShare className="size-5" />
          </button>
          <Link
            href={apply}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-ink font-semibold text-[17px] text-white shadow-soft transition-opacity hover:opacity-90"
          >
            Postuler à cette offre
            <IconArrowRight className="size-5" />
          </Link>
        </div>
      </div>
    </CareersShell>
  );
}
