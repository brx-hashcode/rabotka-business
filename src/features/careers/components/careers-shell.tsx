import type { ReactNode } from "react";

import { BusinessLockup } from "#/components/business-lockup";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import type { CareersCompany } from "#/lib/api/careers-controller";
import { getInitials } from "#/lib/utils";

/** The candidate's side of a business: the same frame as an interview invitation. */
export function CareersShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="min-h-svh bg-page px-4 py-8 sm:py-14">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div className="flex justify-center">
          <BusinessLockup />
        </div>
        {children}
        <p className="text-center text-muted-foreground text-xs">Propulsé par Rabotka · www.rabotka.work</p>
      </div>
    </main>
  );
}

export function CompanyLogo({ company }: Readonly<{ company: Pick<CareersCompany, "name" | "logoUrl"> }>) {
  return (
    <Avatar className="size-14 shrink-0 rounded-2xl">
      {company.logoUrl && <AvatarImage src={company.logoUrl} alt="" className="object-cover" />}
      <AvatarFallback className="rounded-2xl bg-brand-lime font-semibold text-[#0f2414]">{getInitials(company.name)}</AvatarFallback>
    </Avatar>
  );
}

export const offerPlace = (o: { isRemote: boolean; city: string | null; countryName: string | null }) =>
  o.isRemote ? "À distance" : [o.city, o.countryName].filter(Boolean).join(", ");
