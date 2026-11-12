"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconBrowser,
  IconCamera,
  IconClockHour4,
  IconLink,
  IconVolume,
  IconWifi,
  type Icon as TablerIcon,
} from "@tabler/icons-react";

import { BusinessLockup } from "#/components/business-lockup";
import type { VisioJoin } from "#/lib/api/types";
import { getInitials } from "#/lib/utils";

type Waiting = Extract<VisioJoin, { provider: "waiting" }>;

const TIPS: { icon: TablerIcon; title: string; text: string }[] = [
  { icon: IconCamera, title: "Caméra et micro", text: "Autorisez-les quand votre navigateur le demande, puis vérifiez l'aperçu avant d'entrer." },
  { icon: IconVolume, title: "Au calme", text: "Installez-vous dans un endroit tranquille et bien éclairé, de face à la lumière." },
  { icon: IconWifi, title: "Une connexion stable", text: "Le Wi-Fi est préférable aux données mobiles ; fermez les autres applications." },
  { icon: IconBrowser, title: "Votre navigateur", text: "Chrome, Safari ou Edge à jour. Aucune application à installer, aucun compte à créer." },
  { icon: IconLink, title: "Gardez ce lien", text: "C'est le même pour rejoindre l'entretien : cette page s'ouvrira sur la visio à l'heure dite." },
];

const day = (d: Date) => d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const time = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

/** « dans 9 min », « dans 3 h 20 », « demain à 15:20 », « le jeudi 14 novembre à 15:20 ». */
function opensIn(opens: Date, now: number): string {
  const ms = opens.getTime() - now;
  const min = Math.max(1, Math.ceil(ms / 60_000));
  if (min < 60) return `dans ${min} min`;
  if (min < 6 * 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `dans ${h} h${m ? ` ${String(m).padStart(2, "0")}` : ""}`;
  }
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (opens.toDateString() === new Date(now).toDateString()) return `aujourd'hui à ${time(opens)}`;
  if (opens.toDateString() === tomorrow.toDateString()) return `demain à ${time(opens)}`;
  return `le ${day(opens)} à ${time(opens)}`;
}

/**
 * Before the visio opens (the day before the interview): what it is, when,
 * how long until it opens, and how to get ready. The page asks again on its
 * own when the time comes, and the call takes its place.
 */
export function VisioWaiting({ v, onOpen }: Readonly<{ v: Waiting; onOpen: () => void }>) {
  const opensMs = Date.parse(v.opensAt);
  const opens = new Date(opensMs);
  const starts = new Date(v.startsAt);
  const [now, setNow] = useState(() => Date.now());
  const asked = useRef(false);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (now >= opensMs && !asked.current) {
      asked.current = true;
      onOpen();
    }
  }, [now, opensMs, onOpen]);

  return (
    <main className="min-h-[calc(100dvh-env(safe-area-inset-top))] bg-page px-4 py-8 sm:py-14">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div className="flex justify-center">
          <BusinessLockup />
        </div>

        <section className="space-y-6 rounded-3xl bg-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            {v.businessLogoUrl ? (
              // A profile picture from storage: nothing next/image could optimise here.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.businessLogoUrl} alt="" className="size-12 shrink-0 rounded-2xl bg-page object-cover" />
            ) : (
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-lime font-semibold text-[#0f2414]">
                {getInitials(v.businessName)}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-muted-foreground text-sm">{v.businessName} vous invite à un entretien en visio</p>
              <h1 className="font-semibold text-xl leading-snug">{v.jobTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-page p-4">
            <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-lime text-[#0f2414]">
              <span className="font-semibold text-xl leading-none">{starts.getDate()}</span>
              <span className="text-[11px] uppercase">{starts.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "")}</span>
            </span>
            <div className="min-w-0">
              <p className="font-semibold first-letter:uppercase">{day(starts)}</p>
              <p className="text-muted-foreground text-sm">
                {time(starts)} · {v.durationMinutes} min
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-chip-amber px-4 py-3 text-chip-amber-foreground">
            <IconClockHour4 className="mt-0.5 size-5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold">La visio s&apos;ouvre {opensIn(opens, now)}</p>
              <p className="opacity-80">Elle ouvre la veille de l&apos;entretien. Revenez avec ce même lien.</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-semibold">Pour bien vous préparer</h2>
            <ul className="space-y-3">
              {TIPS.map((t) => (
                <li key={t.title} className="flex gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-page">
                    <t.icon className="size-4 text-muted-foreground" />
                  </span>
                  <div className="min-w-0 text-sm">
                    <p className="font-medium">{t.title}</p>
                    <p className="text-muted-foreground">{t.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <p className="text-center text-muted-foreground text-xs">
          Entretien proposé par {v.businessName} avec Rabotka Business · www.rabotka.work
        </p>
      </div>
    </main>
  );
}
