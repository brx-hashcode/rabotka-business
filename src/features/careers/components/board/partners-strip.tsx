import Link from "next/link";

import type { CareersPartner } from "#/lib/api/careers-controller";
import { cn } from "#/lib/utils";

/** From this many partners the row slides on endlessly; fewer sit still, centred. */
const MARQUEE_FROM = 5;

/** A partner as large sites show their customers: logo and name, muted until pointed at. */
function Partner({ p, hidden = false }: Readonly<{ p: CareersPartner; hidden?: boolean }>) {
  return (
    <Link
      href={`/carrieres/${p.slug}`}
      title={`${p.name} recrute`}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      className="group flex shrink-0 items-center gap-3 opacity-60 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0 focus-visible:opacity-100 focus-visible:grayscale-0"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.logoUrl} alt="" className="size-10 rounded-xl object-cover" />
      <span className="whitespace-nowrap font-semibold text-foreground text-lg tracking-tight">{p.name}</span>
    </Link>
  );
}

/**
 * « Ils recrutent avec Rabotka »: the logos of the partners Rabotka picked,
 * each a link to its careers page. A quiet row under a small caption, as on
 * large companies' sites; it slides on once there are enough of them.
 * Nothing at all while there are none.
 */
export function PartnersStrip({
  partners,
  title = "Ils recrutent avec Rabotka",
  className,
}: Readonly<{ partners: CareersPartner[]; title?: string; className?: string }>) {
  if (partners.length === 0) return null;
  const moving = partners.length >= MARQUEE_FROM;
  return (
    <section aria-label={title} className={cn("px-4 sm:px-6", className)}>
      <div className="mx-auto w-full max-w-7xl space-y-7">
        <p className="text-center font-medium text-muted-foreground text-xs uppercase tracking-[0.18em]">{title}</p>
        {moving ? (
          // Two copies side by side, sliding by one copy's width: the row never ends.
          <div className="overflow-hidden mask-[linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
            <ul className="logo-marquee flex w-max items-center gap-14 pr-14">
              {[...partners, ...partners].map((p, i) => (
                <li key={`${p.slug}-${i}`}>
                  <Partner p={p} hidden={i >= partners.length} />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ul className="flex flex-wrap items-center justify-center gap-x-14 gap-y-6">
            {partners.map((p) => (
              <li key={p.slug}>
                <Partner p={p} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
