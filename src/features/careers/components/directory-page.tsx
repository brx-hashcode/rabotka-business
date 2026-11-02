"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { IconChevronRight } from "@tabler/icons-react";

import { Bone } from "#/components/page-skeletons";
import { getCareersCompanies } from "#/lib/api/careers-controller";
import { CareersShell, CompanyLogo } from "./careers-shell";

/** Every verified business that is hiring now, for someone not on Rabotka. */
export function DirectoryPage() {
  const query = useQuery({ queryKey: ["careers"], queryFn: getCareersCompanies, retry: false });
  const companies = query.data ?? [];

  return (
    <CareersShell>
      <div className="space-y-1 px-2 text-center">
        <h1 className="font-semibold text-3xl tracking-tight">Ils recrutent</h1>
        <p className="text-foreground/70">Choisissez une entreprise et postulez à ses offres.</p>
      </div>

      {query.isLoading ? (
        <div className="space-y-3">
          <Bone className="h-24 w-full rounded-3xl" />
          <Bone className="h-24 w-full rounded-3xl" />
        </div>
      ) : companies.length === 0 ? (
        <section className="space-y-2 rounded-3xl bg-card p-6 text-center sm:p-8">
          <h2 className="font-semibold text-lg">Aucune offre ouverte pour le moment</h2>
          <p className="text-foreground/70 text-sm">Revenez bientôt : de nouvelles offres arrivent régulièrement.</p>
        </section>
      ) : (
        <ul className="space-y-3">
          {companies.map((c) => (
            <li key={c.slug}>
              <Link href={`/carrieres/${c.slug}`} className="flex items-center gap-4 rounded-3xl bg-card p-5 transition-colors hover:bg-card/70">
                <CompanyLogo company={c} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-[17px]">{c.name}</span>
                  <span className="block truncate text-foreground/70 text-sm">{[c.categoryLabel, c.city].filter(Boolean).join(" · ")}</span>
                  <span className="mt-1 block font-medium text-sm">
                    {c.openOffers} offre{c.openOffers > 1 ? "s" : ""} ouverte{c.openOffers > 1 ? "s" : ""}
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
    </CareersShell>
  );
}
