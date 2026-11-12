import Image from "next/image";
import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";

import { FEATURES } from "../content";
import { FEATURE_PAGES } from "../site-content";
import { SectionHeading } from "./section-heading";

/**
 * The home page's word on interviews: the visio, the transcription and the
 * compte rendu, the three steps of the « Entretiens » page with their photos,
 * and the way to that page.
 */
export function InterviewsSpotlight() {
  const steps = FEATURE_PAGES.interviews.steps ?? [];
  const href = FEATURES.find((f) => f.id === "interviews")?.href ?? "/fonctionnalites/entretiens";
  if (steps.length === 0) return null;
  return (
    <section id="entretiens" className="bg-card py-20 md:py-28">
      <div className="mx-auto w-full max-w-7xl space-y-12 px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            kicker="Entretiens"
            title="Vos entretiens, de la visio au compte rendu"
            text="L'appel s'ouvre dans Rabotka, la voix de chacun devient du texte, et le compte rendu se rédige pendant que vous passez à autre chose."
          />
          <Link href={href} className="group inline-flex items-center gap-1.5 font-medium underline-offset-4 hover:underline">
            Découvrir les entretiens
            <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map((s, n) => (
            <li key={s.title} className="flex flex-col overflow-hidden rounded-[2rem] bg-page">
              <div className="relative aspect-[4/3]">
                <Image src={s.photo} alt={s.alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
                <span className="absolute top-3 left-3 rounded-full bg-card/90 px-2.5 py-1 font-semibold text-[11px] backdrop-blur">
                  {String(n + 1).padStart(2, "0")} · {s.kicker}
                </span>
              </div>
              <div className="space-y-2 p-5">
                <h3 className="font-semibold text-lg">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
