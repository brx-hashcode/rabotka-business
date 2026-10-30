"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  IconArrowLeft,
  IconBriefcase,
  IconCalendarEvent,
  IconCash,
  IconMapPin,
  type Icon as TablerIcon,
} from "@tabler/icons-react";

import { Bone } from "#/components/page-skeletons";
import { EMPLOYMENT_LABEL, PAYMENT_SUFFIX } from "#/features/offers/offer-labels";
import { getCareersOffer } from "#/lib/api/careers-controller";
import { CareersShell, CompanyLogo, offerPlace } from "./careers-shell";

const longDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;

/** Step 1 of an application from outside Rabotka: the offer, as it was published. */
export function OfferPage({ slug, reference }: Readonly<{ slug: string; reference: string }>) {
  const query = useQuery({
    queryKey: ["careers", slug, reference],
    queryFn: () => getCareersOffer(slug, reference),
    retry: false,
  });
  const page = query.data;
  const o = page?.offer;
  const rows: { icon: TablerIcon; text: string }[] = o
    ? [
        { icon: IconMapPin, text: offerPlace(o) },
        { icon: IconBriefcase, text: `${EMPLOYMENT_LABEL[o.employmentType]} · ${o.quantity} poste${o.quantity > 1 ? "s" : ""}` },
        ...(o.closesAt ? [{ icon: IconCalendarEvent, text: `Jusqu'au ${longDate(o.closesAt)}` }] : []),
        {
          icon: IconCash,
          text: o.amount === null ? "À discuter avec le candidat" : `${fcfa(o.amount)}${o.paymentFlow ? ` ${PAYMENT_SUFFIX[o.paymentFlow]}` : ""}`,
        },
      ].filter((r) => r.text)
    : [];

  return (
    <CareersShell>
      <section className="space-y-6 rounded-3xl bg-card p-6 sm:p-8">
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
            <Link href={`/carrieres/${slug}`} className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground">
              <IconArrowLeft className="size-4" />
              Toutes les offres
            </Link>
            <div className="flex items-center gap-3">
              <CompanyLogo company={page.company} />
              <div className="min-w-0">
                <p className="truncate text-muted-foreground text-sm">{page.company.name} recrute</p>
                <h1 className="font-semibold text-xl leading-snug">{o.title}</h1>
              </div>
            </div>
            <ul className="space-y-3 rounded-2xl bg-page p-4 text-sm">
              {rows.map((r) => (
                <li key={r.text} className="flex items-center gap-3">
                  <r.icon className="size-4 shrink-0 text-muted-foreground" />
                  {r.text}
                </li>
              ))}
            </ul>
            <div className="space-y-2">
              <h2 className="font-semibold">Description</h2>
              <p className="whitespace-pre-line text-muted-foreground text-sm leading-relaxed">{o.description}</p>
            </div>
          </>
        )}
      </section>
    </CareersShell>
  );
}
