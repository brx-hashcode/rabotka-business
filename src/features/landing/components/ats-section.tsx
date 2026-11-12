import Link from "next/link";
import {
  IconArrowRight,
  IconArrowsSort,
  IconFileCertificate,
  IconInbox,
  IconSpeakerphone,
  IconUsersGroup,
  IconVideo,
} from "@tabler/icons-react";

import { FEATURES_HREF } from "../content";
import { PipelineMockup } from "../mockups/ats-mockups";
import { ATS_PILLARS, PIPELINE } from "../site-content";
import { SectionHeading } from "./section-heading";
import { IconTile } from "./icon-tile";

/** One icon per stage, in PIPELINE's order. */
const STEP_ICONS = [IconSpeakerphone, IconInbox, IconArrowsSort, IconVideo, IconUsersGroup, IconFileCertificate];

/**
 * Every stage of a hire as one path: a marker per stage on a line that joins
 * them, across on a wide screen, down the side on a phone.
 */
export function PipelineSteps() {
  return (
    <div className="rounded-[2rem] bg-page p-6 sm:p-8">
      <ol className="relative grid gap-7 xl:grid-cols-6 xl:gap-4">
        {/* The line through the markers. */}
        <span
          aria-hidden
          className="absolute top-5 bottom-5 left-5 w-0.5 bg-linear-to-b from-brand-lime via-whatsapp/50 to-brand-lime xl:top-5 xl:right-[8%] xl:bottom-auto xl:left-[8%] xl:h-0.5 xl:w-auto xl:bg-linear-to-r"
        />
        {PIPELINE.map((step, i) => {
          const Icon = STEP_ICONS[i] ?? IconArrowRight;
          return (
            <li key={step.title} className="relative flex gap-4 xl:flex-col xl:items-center xl:text-center">
              <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-header text-header-foreground ring-4 ring-page">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 space-y-1 pt-0.5 xl:pt-1">
                <p className="font-semibold text-muted-foreground text-[11px] tabular-nums tracking-wide">{String(i + 1).padStart(2, "0")}</p>
                <p className="font-semibold">{step.title}</p>
                <p className="text-muted-foreground text-sm leading-snug">{step.text}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
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
