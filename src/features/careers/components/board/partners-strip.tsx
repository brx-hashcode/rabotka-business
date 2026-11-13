import Link from "next/link";

import type { CareersPartner } from "#/lib/api/careers-controller";
import { cn } from "#/lib/utils";

/**
 * « Ils recrutent avec Rabotka »: a wall of the partners' logos, as large
 * sites show their customers — each logo in colour, centred in an equal
 * tile, its name showing on hover, the tile a link to its careers page.
 * Nothing at all while there are none.
 */
export function PartnersStrip({
  partners,
  title = "Ils recrutent avec Rabotka",
  className,
}: Readonly<{ partners: CareersPartner[]; title?: string; className?: string }>) {
  if (partners.length === 0) return null;
  return (
    <section aria-label={title} className={cn("px-4 sm:px-6", className)}>
      <div className="mx-auto w-full max-w-5xl space-y-7">
        <p className="text-center font-medium text-muted-foreground text-xs uppercase tracking-[0.18em]">{title}</p>
        <ul className="flex flex-wrap justify-center gap-3 sm:gap-4">
          {partners.map((p) => (
            <li key={p.slug} className="w-[calc(50%-0.375rem)] sm:w-44">
              <Link
                href={`/carrieres/${p.slug}`}
                title={`${p.name} recrute`}
                className="group relative flex h-24 items-center justify-center overflow-hidden px-6 sm:h-28"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.logoUrl}
                  alt={p.name}
                  className="max-h-14 max-w-full rounded-xl object-contain transition duration-300 group-hover:-translate-y-2 group-hover:scale-95 sm:max-h-16"
                />
                {/* The name, rising in under the logo on hover. */}
                <span className="absolute inset-x-0 bottom-2.5 translate-y-2 truncate px-3 text-center font-medium text-muted-foreground text-xs opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  {p.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
