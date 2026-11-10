import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";

import { FEATURES_HREF } from "../content";
import { PipelineMockup } from "../mockups/ats-mockups";
import { ATS_PILLARS, PIPELINE } from "../site-content";
import { SectionHeading } from "./section-heading";
import { IconTile } from "./icon-tile";

/** Every stage of a hire, numbered: the pipeline the ATS runs. */
export function PipelineSteps() {
  return (
    <ol className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {PIPELINE.map((step, i) => (
        <li key={step.title} className="space-y-2 rounded-3xl bg-page p-4">
          <span className="flex size-8 items-center justify-center rounded-full bg-header font-semibold text-header-foreground text-sm">
            {i + 1}
          </span>
          <p className="font-semibold text-sm">{step.title}</p>
          <p className="text-muted-foreground text-xs leading-snug">{step.text}</p>
        </li>
      ))}
    </ol>
  );
}

/** What makes it an ATS, not a job board: six pillars. */
export function AtsPillars() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ATS_PILLARS.map(({ title, text, icon }) => (
        <div key={title} className="space-y-3 rounded-3xl bg-page p-6">
          <IconTile icon={icon} surface="card" />
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-muted-foreground text-sm">{text}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * The landing's ATS story: the board beside what it does, the six stages of
 * a hire, and the pillars. `more` links to the features overview.
 */
export function AtsSection({ more = true }: Readonly<{ more?: boolean }>) {
  return (
    <section id="ats" className="bg-card py-20 md:py-28">
      <div className="mx-auto w-full max-w-7xl space-y-14 px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div className="space-y-6">
            <SectionHeading
              kicker="ATS nouvelle génération"
              title="Tout le recrutement dans un seul pipeline"
              text="Rabotka Business n'est pas un simple site d'annonces : c'est un logiciel de recrutement complet. Chaque candidat avance de la diffusion de l'offre jusqu'au contrat, et rien ne se perd en chemin."
            />
            {more && (
              <Link
                href={FEATURES_HREF}
                className="group inline-flex items-center gap-1.5 font-medium underline-offset-4 hover:underline"
              >
                Voir toutes les fonctionnalités
                <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
          <div className="min-w-0 rounded-[2rem] bg-page p-4 sm:p-8">
            <PipelineMockup />
          </div>
        </div>
        <PipelineSteps />
        <AtsPillars />
      </div>
    </section>
  );
}
