import { IconCalendarEvent, IconClock, IconUserCheck } from "@tabler/icons-react";

import { DemoButton, SignUpButton } from "./demo-button";

const PROMISES = [
  { icon: IconClock, text: "30 minutes, en visio ou au téléphone" },
  { icon: IconUserCheck, text: "Sur vos vrais postes et vos vrais candidats" },
  { icon: IconCalendarEvent, text: "Une réponse sous 24 h ouvrées" },
];

/**
 * « Démarrer »: the band every marketing page ends on. The demo first, the
 * account beside it, for those who would rather try alone.
 */
export function DemoBlock({
  title = "Voyez Rabotka sur vos propres recrutements",
  text = "Un membre de notre équipe vous montre comment publier, trier et recruter avec Rabotka Business, sur les postes que vous avez à pourvoir.",
}: Readonly<{ title?: string; text?: string }>) {
  return (
    <section aria-labelledby="demarrer" className="px-4 py-20 sm:px-6 md:py-28">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6 rounded-3xl bg-header px-6 py-14 text-center text-header-foreground sm:py-20">
        <p className="font-medium text-sm">Démarrer</p>
        <h2 id="demarrer" className="max-w-3xl font-semibold text-3xl tracking-tight sm:text-5xl">
          {title}
        </h2>
        <p className="max-w-xl text-header-muted text-lg">{text}</p>
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          {PROMISES.map(({ icon: Icon, text: t }) => (
            <li key={t} className="inline-flex items-center gap-2">
              <Icon className="size-4" />
              {t}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <DemoButton />
          <SignUpButton />
        </div>
      </div>
    </section>
  );
}
