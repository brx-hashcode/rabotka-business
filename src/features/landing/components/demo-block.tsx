import { IconCalendarEvent, IconClock, IconUserCheck } from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";

import { DemoForm } from "#/features/demo/components/demo-form";
import { businessCountriesServer } from "#/lib/api/catalog-server";

/** Beside each of site.demoBlock.promises, in order. */
const PROMISE_ICONS = [IconClock, IconUserCheck, IconCalendarEvent];

/**
 * « Démarrer »: the band every marketing page ends on, with the demo form
 * itself in it — asking for a demo never takes another page.
 */
export async function DemoBlock({ title, text }: Readonly<{ title?: string; text?: string }>) {
  const [countries, tr] = await Promise.all([businessCountriesServer(), getTranslations("site.demoBlock")]);
  const PROMISES = (tr.raw("promises") as { title: string; text: string }[]).map((p, i) => ({ ...p, icon: PROMISE_ICONS[i] }));
  return (
    <section id="demarrer" aria-labelledby="demarrer-titre" className="px-4 py-20 sm:px-6 md:py-28">
      <div className="mx-auto grid w-full max-w-7xl gap-10 rounded-[2rem] bg-header p-6 text-header-foreground sm:p-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:p-14">
        <div className="space-y-6 lg:pt-4">
          <p className="font-medium text-sm">{tr("kicker")}</p>
          <h2 id="demarrer-titre" className="font-semibold text-3xl tracking-tight sm:text-4xl">
            {title ?? tr("title")}
          </h2>
          <p className="text-header-muted text-lg">{text ?? tr("text")}</p>
          {/* What the demo is, each promise said and then made concrete. */}
          <ul className="space-y-3 pt-2">
            {PROMISES.map(({ icon: Icon, title: heading, text: detail }) => (
              <li key={heading} className="flex gap-4 rounded-2xl bg-white/55 p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-lime-foreground">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 space-y-1">
                  <span className="block font-semibold">{heading}</span>
                  <span className="block text-header-muted text-sm leading-relaxed">{detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0 text-foreground">
          <DemoForm countries={countries} />
        </div>
      </div>
    </section>
  );
}
