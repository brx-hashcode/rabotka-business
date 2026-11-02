import type { ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { cn, getInitials } from "#/lib/utils";

export type HeroCompany = {
  name: string;
  logoUrl: string | null;
  categoryLabel: string;
  city: string | null;
  website: string | null;
  coverUrl?: string | null;
};

/** A business's website as a link to open, or null when it is not one. */
export function websiteHref(website: string | null): string | null {
  if (!website?.trim()) return null;
  const href = /^https?:\/\//i.test(website) ? website : `https://${website}`;
  try {
    return new URL(href).host ? href : null;
  } catch {
    return null;
  }
}

/**
 * The top of a careers page, laid out like a company page on LinkedIn: a
 * low, wide cover (the brand's colours when there is none), the logo
 * overlapping its bottom edge, then the name, what it is and where, and the
 * page's actions (its website among them). `compact` is the editor's smaller
 * preview of the same.
 */
export function CompanyHero({
  company,
  actions,
  compact = false,
  heading: Heading = "h1",
}: Readonly<{ company: HeroCompany; actions?: ReactNode; compact?: boolean; heading?: "h1" | "p" }>) {
  return (
    <section className={cn("overflow-hidden bg-card", compact ? "rounded-2xl" : "rounded-3xl")}>
      <div className="relative aspect-[4/1] w-full">
        {company.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- the business's own upload, any host
          <img src={company.coverUrl} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <div aria-hidden className="absolute inset-0 bg-linear-to-br from-brand-lime/80 via-whatsapp/25 to-whatsapp-dark/40" />
        )}
      </div>
      <div className={compact ? "px-4 pb-4" : "px-5 pb-6 sm:px-8 sm:pb-8"}>
        <div className={cn("relative inline-flex bg-card", compact ? "-mt-8 rounded-2xl p-1" : "-mt-12 rounded-3xl p-1.5 sm:-mt-16")}>
          <Avatar className={cn("shrink-0", compact ? "size-16 rounded-xl" : "size-24 rounded-[1.1rem] sm:size-32 sm:rounded-[1.4rem]")}>
            {company.logoUrl && <AvatarImage src={company.logoUrl} alt="" className="bg-card object-contain" />}
            <AvatarFallback
              className={cn(
                "bg-brand-lime font-semibold text-[#0f2414]",
                compact ? "rounded-xl text-lg" : "rounded-[1.1rem] text-3xl sm:rounded-[1.4rem] sm:text-4xl",
              )}
            >
              {getInitials(company.name)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className={compact ? "mt-2 space-y-0.5" : "mt-3 space-y-1"}>
          <Heading className={cn("font-semibold tracking-tight", compact ? "text-lg" : "text-2xl sm:text-3xl")}>
            {company.name}
          </Heading>
          <p className={cn("text-muted-foreground", compact ? "text-xs" : "text-[15px]")}>
            {[company.categoryLabel, company.city].filter(Boolean).join(" · ")}
          </p>
        </div>
        {actions && <div className={cn("flex flex-wrap gap-2", compact ? "mt-3" : "mt-5")}>{actions}</div>}
      </div>
    </section>
  );
}
