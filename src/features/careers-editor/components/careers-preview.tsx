"use client";

import { IconBriefcase, IconChevronRight, IconExternalLink } from "@tabler/icons-react";

import { offerPlace } from "#/features/careers/components/careers-shell";
import { CompanyHero, websiteHref } from "#/features/careers/components/company-hero";
import { EMPLOYMENT_LABEL } from "#/features/offers/offer-labels";
import type { CareersOfferSummary } from "#/lib/api/careers-controller";

export type PreviewCompany = {
  name: string;
  logoUrl: string | null;
  categoryLabel: string;
  city: string | null;
  website: string | null;
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
        <CompanyHero
          compact
          heading="p"
          company={company}
          actions={
            <>
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-3.5 font-medium text-white text-xs">
                <IconBriefcase className="size-3.5" />
                {offers && offers.length > 1 ? `Voir les ${offers.length} offres` : offers?.length === 1 ? "Voir l'offre" : "Offres"}
              </span>
              {websiteHref(company.website) && (
                <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-page px-3.5 font-medium text-xs">
                  <IconExternalLink className="size-3.5" />
                  Site web
                </span>
              )}
            </>
          }
        />

        <section className="space-y-3 rounded-2xl bg-card p-4">
          <div className="space-y-1">
            <p className="font-semibold text-sm">À propos</p>
            {company.description ? (
              <p className="line-clamp-6 whitespace-pre-line text-foreground/85 text-sm leading-relaxed">{company.description}</p>
            ) : (
              <p className="text-muted-foreground/70 text-sm italic">Votre présentation apparaîtra ici.</p>
            )}
          </div>
          {company.benefits.length > 0 && (
            <div className="space-y-1.5">
              <p className="font-semibold text-sm">Avantages</p>
              <ul className="flex flex-wrap gap-1.5">
                {company.benefits.map((b) => (
                  <li key={b} className="rounded-full bg-page px-2.5 py-1 font-medium text-xs">
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
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
          <section className="space-y-2 rounded-2xl bg-card p-4">
            <p className="font-semibold text-sm">La vie chez {company.name}</p>
            <div className="grid grid-cols-3 gap-1.5">
              {company.photos.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element -- the business's own upload
                <img key={src} src={src} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
