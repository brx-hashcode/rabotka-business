"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBriefcase,
  IconCalendarEvent,
  IconCash,
  IconMapPin,
  type Icon as TablerIcon,
} from "@tabler/icons-react";

import { Bone } from "#/components/page-skeletons";
import { DescriptionText } from "#/features/careers/components/description-text";
import { EMPLOYMENT_LABEL, PAYMENT_SUFFIX } from "#/features/offers/offer-labels";
import { candidateSource, SOURCE_KEY } from "#/features/careers/candidate-source";
import { getCareersOffer } from "#/lib/api/careers-controller";
import { CareersShell, CompanyLogo, offerPlace } from "./careers-shell";

const longDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;

/** Step 1 of an application from outside Rabotka: the offer, and « Postuler ». */
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
  const rows: { icon: TablerIcon; label: string; text: string }[] = o
    ? [
        { icon: IconMapPin, label: "Lieu", text: offerPlace(o) },
        { icon: IconBriefcase, label: "Type", text: `${EMPLOYMENT_LABEL[o.employmentType]} · ${o.quantity} poste${o.quantity > 1 ? "s" : ""}` },
        ...(o.closesAt ? [{ icon: IconCalendarEvent, label: "Candidatures", text: `Jusqu'au ${longDate(o.closesAt)}` }] : []),
        {
          icon: IconCash,
          label: "Rémunération",
          text: o.amount === null ? "À discuter" : `${fcfa(o.amount)}${o.paymentFlow ? ` ${PAYMENT_SUFFIX[o.paymentFlow]}` : ""}`,
        },
      ].filter((r) => r.text)
    : [];

  return (
    <CareersShell>
      <section className="space-y-7 rounded-3xl bg-card p-6 sm:p-10">
        {query.isLoading ? (
          <div className="space-y-4">
            <Bone className="h-6 w-2/3" />
            <Bone className="h-24 w-full rounded-2xl" />
            <Bone className="h-12 w-full rounded-full" />
          </div>
        ) : !page || !o ? (
          <div className="space-y-3 text-center">
            <h1 className="font-semibold text-lg">Cette offre n&apos;est plus ouverte</h1>
            <p className="text-muted-foreground text-sm">Elle a peut-être été pourvue ou retirée.</p>
            <Link href={`/carrieres/${slug}`} className="inline-block font-medium text-sm underline underline-offset-2">
              Voir les autres offres
            </Link>
          </div>
        ) : (
          <>
            <Link href={`/carrieres/${slug}`} className="inline-flex items-center gap-1.5 font-medium text-foreground/70 text-sm hover:text-foreground">
              <IconArrowLeft className="size-4" />
              Toutes les offres
            </Link>

            <div className="flex items-center gap-4">
              <CompanyLogo company={page.company} />
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground/70">{page.company.name} recrute</p>
                <h1 className="font-semibold text-2xl leading-tight tracking-tight sm:text-3xl">{o.title}</h1>
              </div>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              {rows.map((r) => (
                <li key={r.label} className="flex items-center gap-3 rounded-2xl bg-page p-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-lime text-[#0f2414]">
                    <r.icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-foreground/60 text-xs">{r.label}</span>
                    <span className="block font-medium text-sm">{r.text}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="space-y-3">
              <h2 className="font-semibold text-lg">Description</h2>
              <DescriptionText text={o.description} className="text-[15px]" />
            </div>

            {/* Stays in sight on a long offer. */}
            <div className="sticky bottom-4">
              <Link
                href={`/carrieres/${slug}/${reference}/postuler`}
                className="flex h-14 items-center justify-center gap-2 rounded-full bg-ink font-semibold text-[17px] text-white shadow-soft"
              >
                Postuler à cette offre
                <IconArrowRight className="size-5" />
              </Link>
            </div>
          </>
        )}
      </section>
    </CareersShell>
  );
}
