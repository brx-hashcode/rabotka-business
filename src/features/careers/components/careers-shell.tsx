import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { BusinessLockup } from "#/components/business-lockup";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import type { CareersCompany } from "#/lib/api/careers-controller";
import { getInitials } from "#/lib/utils";

/** The candidate's side of a business: the same frame as an interview invitation. */
export function CareersShell({ children }: Readonly<{ children: ReactNode }>) {
  const t = useTranslations("careers.shell");
  return (
    <main className="min-h-svh bg-page px-4 py-8 sm:py-14">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="flex justify-center">
          <BusinessLockup />
        </div>
        {children}
        <p className="text-center text-muted-foreground text-xs">{t("poweredBy")}</p>
      </div>
    </main>
  );
}

export function CompanyLogo({
  company,
  size = "md",
}: Readonly<{ company: Pick<CareersCompany, "name" | "logoUrl">; size?: "sm" | "md" }>) {
  const box = size === "sm" ? "size-8 rounded-lg" : "size-16 rounded-2xl";
  return (
    <Avatar className={`shrink-0 ${box}`}>
      {company.logoUrl && <AvatarImage src={company.logoUrl} alt="" className="object-cover" />}
      <AvatarFallback className={`bg-brand-lime font-semibold text-[#0f2414] ${size === "sm" ? "rounded-lg text-xs" : "rounded-2xl"}`}>
        {getInitials(company.name)}
      </AvatarFallback>
    </Avatar>
  );
}

/** `remote` is the translated « À distance »; the other callers are French-only. */
export const offerPlace = (o: { isRemote: boolean; city: string | null; countryName: string | null }, remote = "À distance") =>
  o.isRemote ? remote : [o.city, o.countryName].filter(Boolean).join(", ");
