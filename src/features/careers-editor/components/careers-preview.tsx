"use client";

import { IconChevronRight, IconPhoto } from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { offerPlace } from "#/features/careers/components/careers-shell";
import { EMPLOYMENT_LABEL } from "#/features/offers/offer-labels";
import type { CareersOfferSummary } from "#/lib/api/careers-controller";
import { getInitials } from "#/lib/utils";

export type PreviewCompany = {
  name: string;
  logoUrl: string | null;
  categoryLabel: string;
  city: string | null;
  description: string | null;
  coverUrl: string | null;
  photos: string[];
  benefits: string[];
};

const MAX_OFFERS = 3;

/**
 * The careers page as a candidate sees it, drawn from what is being edited
 * (not from the public page), so each change shows the moment it is saved.
 * Same order as the public page: the organisation, its offers, its photos.
 */
export function CareersPreview({
  company,
  offers,
  address,
}: Readonly<{ company: PreviewCompany; offers: CareersOfferSummary[] | undefined; address: string }>) {
  const shown = offers?.slice(0, MAX_OFFERS) ?? [];
  const more = (offers?.length ?? 0) - shown.length;

  return (
    <div className="rounded-3xl bg-card p-3">
      <div className="flex items-center gap-3 px-2 pt-1 pb-3">
        <span aria-hidden className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded-full bg-page px-3 py-1 text-center text-muted-foreground text-xs">
          {address}
        </span>
      </div>

      <div className="max-h-[calc(100svh-14rem)] space-y-3 overflow-y-auto rounded-2xl bg-page p-3">
        <section className="overflow-hidden rounded-2xl bg-card">
          {company.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- the business's own upload
            <img src={company.coverUrl} alt="" className="aspect-[3/1] w-full object-cover" />
          ) : (
            <div className="flex aspect-[3/1] w-full items-center justify-center gap-1.5 bg-foreground/[0.04] text-muted-foreground/70 text-xs">
              <IconPhoto className="size-4" />
              Photo de couverture
            </div>
          )}
          <div className="space-y-3 p-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-12 shrink-0 rounded-xl">
                {company.logoUrl && <AvatarImage src={company.logoUrl} alt="" className="object-cover" />}
                <AvatarFallback className="rounded-xl bg-brand-lime font-semibold text-[#0f2414] text-sm">
                  {getInitials(company.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-semibold text-lg tracking-tight">{company.name}</p>
                <p className="truncate text-muted-foreground text-xs">
                  {[company.categoryLabel, company.city].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
            {company.description ? (
              <p className="line-clamp-6 whitespace-pre-line text-foreground/85 text-sm leading-relaxed">{company.description}</p>
            ) : (
              <p className="text-muted-foreground/70 text-sm italic">Votre présentation apparaîtra ici.</p>
            )}
            {company.benefits.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {company.benefits.map((b) => (
                  <li key={b} className="rounded-full bg-page px-2.5 py-1 font-medium text-xs">
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="space-y-2">
          <p className="px-1 font-semibold text-sm">
            {offers === undefined
              ? "Vos offres ouvertes"
              : offers.length === 0
                ? "Aucune offre ouverte pour le moment."
                : `${offers.length} offre${offers.length > 1 ? "s" : ""} ouverte${offers.length > 1 ? "s" : ""}`}
          </p>
          {shown.map((o) => (
            <div key={o.reference} className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-sm">{o.title}</span>
                <span className="block truncate text-muted-foreground text-xs">
                  {[offerPlace(o), EMPLOYMENT_LABEL[o.employmentType]].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-lime text-[#0f2414]">
                <IconChevronRight className="size-4" />
              </span>
            </div>
          ))}
          {more > 0 && <p className="px-1 text-muted-foreground text-xs">et {more} autre{more > 1 ? "s" : ""}</p>}
        </section>

        {company.photos.length > 0 && (
          <section aria-label="Photos" className="grid grid-cols-3 gap-1.5">
            {company.photos.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element -- the business's own upload
              <img key={src} src={src} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
