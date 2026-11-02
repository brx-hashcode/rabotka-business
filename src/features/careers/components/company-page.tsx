"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { IconChevronRight } from "@tabler/icons-react";

import { Bone } from "#/components/page-skeletons";
import { EMPLOYMENT_LABEL } from "#/features/offers/offer-labels";
import { getCareersCompany } from "#/lib/api/careers-controller";
import { CareersShell, CompanyLogo, offerPlace } from "./careers-shell";

/** A business and its open offers, for someone who is not on Rabotka. */
export function CompanyPage({ slug }: Readonly<{ slug: string }>) {
  const query = useQuery({ queryKey: ["careers", slug], queryFn: () => getCareersCompany(slug), retry: false });
  const page = query.data;

  return (
    <CareersShell>
      {query.isLoading ? (
        <section className="space-y-4 rounded-3xl bg-card p-6 sm:p-8">
          <Bone className="h-14 w-2/3" />
          <Bone className="h-16 w-full" />
        </section>
      ) : !page ? (
        <section className="space-y-2 rounded-3xl bg-card p-6 text-center sm:p-8">
          <h1 className="font-semibold text-lg">Page introuvable</h1>
          <p className="text-muted-foreground text-sm">Ce lien n&apos;est plus valable.</p>
        </section>
      ) : (
        <>
          <section className="overflow-hidden rounded-3xl bg-card">
            {page.company.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- the business's own upload, any host
              <img src={page.company.coverUrl} alt="" className="aspect-[3/1] w-full object-cover" />
            )}
            <div className="space-y-4 p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <CompanyLogo company={page.company} />
                <div className="min-w-0">
                  <h1 className="truncate font-semibold text-2xl tracking-tight">{page.company.name}</h1>
                  <p className="truncate text-muted-foreground text-sm">
                    {[page.company.categoryLabel, page.company.city].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
              {page.company.description && (
                <p className="whitespace-pre-line text-[15px] text-foreground/85 leading-relaxed">{page.company.description}</p>
              )}
              {!!page.company.benefits?.length && (
                <ul aria-label="Avantages" className="flex flex-wrap gap-2">
                  {page.company.benefits.map((b) => (
                    <li key={b} className="rounded-full bg-page px-3 py-1.5 font-medium text-sm">
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>


          <section className="space-y-3">
            <h2 className="px-2 font-semibold text-lg">
              {page.offers.length === 0
                ? "Aucune offre ouverte pour le moment."
                : `${page.offers.length} offre${page.offers.length > 1 ? "s" : ""} ouverte${page.offers.length > 1 ? "s" : ""}`}
            </h2>
            {page.offers.length > 0 && (
              <ul className="space-y-3">
                {page.offers.map((o) => (
                  <li key={o.reference}>
                    <Link
                      href={`/carrieres/${slug}/${o.reference}`}
                      className="flex items-center gap-3 rounded-3xl bg-card px-6 py-5 transition-colors hover:bg-card/70"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-[17px]">{o.title}</span>
                        <span className="block truncate text-muted-foreground text-sm">
                          {[offerPlace(o), EMPLOYMENT_LABEL[o.employmentType]].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-lime text-[#0f2414]">
                        <IconChevronRight className="size-5" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {!!page.company.photos?.length && (
            <section aria-label="Photos" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {page.company.photos.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element -- the business's own upload, any host
                <img key={src} src={src} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover" />
              ))}
            </section>
          )}
        </>
      )}
    </CareersShell>
  );
}
