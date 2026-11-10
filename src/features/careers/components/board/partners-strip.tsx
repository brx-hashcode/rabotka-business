import Link from "next/link";

import type { CareersPartner } from "#/lib/api/careers-controller";
import { cn } from "#/lib/utils";

/**
 * « Ils recrutent avec Rabotka »: the logos of the partners Rabotka picked,
 * each a link to its careers page. Nothing at all while there are none.
 */
export function PartnersStrip({
  partners,
  title = "Ils recrutent avec Rabotka",
  className,
}: Readonly<{ partners: CareersPartner[]; title?: string; className?: string }>) {
  if (partners.length === 0) return null;
  return (
    <section aria-label={title} className={cn("px-4 sm:px-6", className)}>
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <p className="text-center font-medium text-muted-foreground text-sm">{title}</p>
        <ul className="flex flex-wrap items-center justify-center gap-3">
          {partners.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/carrieres/${p.slug}`}
                title={p.name}
                className="flex h-16 items-center gap-3 rounded-2xl bg-card px-4 transition-colors hover:bg-card/70"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.logoUrl} alt="" className="size-10 rounded-xl object-cover" />
                <span className="font-semibold text-sm">{p.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
