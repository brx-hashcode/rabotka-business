import { IconCalendarEvent, IconClock, IconUserCheck } from "@tabler/icons-react";

import { DemoForm } from "#/features/demo/components/demo-form";
import { businessCountriesServer } from "#/lib/api/catalog-server";

const PROMISES = [
  { icon: IconClock, text: "30 minutes, en visio ou au téléphone" },
  { icon: IconUserCheck, text: "Sur vos vrais postes et vos vrais candidats" },
  { icon: IconCalendarEvent, text: "Une réponse sous 24 h ouvrées" },
];

/**
 * « Démarrer »: the band every marketing page ends on, with the demo form
 * itself in it — asking for a demo never takes another page.
 */
export async function DemoBlock({
  title = "Voyez Rabotka sur vos propres recrutements",
  text = "Un membre de notre équipe vous montre comment publier, trier et recruter avec Rabotka Business, sur les postes que vous avez à pourvoir.",
}: Readonly<{ title?: string; text?: string }>) {
  const countries = await businessCountriesServer();
  return (
    <section id="demarrer" aria-labelledby="demarrer-titre" className="px-4 py-20 sm:px-6 md:py-28">
      <div className="mx-auto grid w-full max-w-7xl gap-10 rounded-[2rem] bg-header p-6 text-header-foreground sm:p-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:p-14">
        <div className="space-y-6 lg:pt-4">
          <p className="font-medium text-sm">Démarrer</p>
          <h2 id="demarrer-titre" className="font-semibold text-3xl tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="text-header-muted text-lg">{text}</p>
          <ul className="space-y-3">
            {PROMISES.map(({ icon: Icon, text: t }) => (
              <li key={t} className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card/70">
                  <Icon className="size-4" />
                </span>
                {t}
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
