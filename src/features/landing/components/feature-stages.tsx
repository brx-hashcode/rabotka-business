import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";

import { FEATURE_GROUPS, FEATURES, FEATURES_HREF } from "../content";
import { SectionHeading } from "./section-heading";

/** The groups with their features, numbered: the hire's four stages. */
export const STAGES = FEATURE_GROUPS.map((group, i) => ({
  ...group,
  number: String(i + 1).padStart(2, "0"),
  features: group.ids.map((id) => FEATURES.find((f) => f.id === id)).filter((f) => f !== undefined),
}));

/** The home page's product overview: four stages, two tools each, each a link to its page. */
export function FeatureStages() {
  return (
    <section id="fonctionnalites" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto w-full max-w-7xl space-y-12 px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            kicker="Fonctionnalités"
            title="Un outil pour chaque étape du recrutement"
            text="Attirer, trier, évaluer, décider : chaque outil prépare l'étape suivante."
          />
          <Link
            href={FEATURES_HREF}
            className="group inline-flex items-center gap-1.5 font-medium underline-offset-4 hover:underline"
          >
            Toutes les fonctionnalités en détail
            <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STAGES.map((stage) => (
            <div key={stage.step} className="flex flex-col gap-3 rounded-[2rem] bg-card p-4">
              <div className="space-y-1 px-2 pt-2">
                <span className="font-semibold text-muted-foreground text-xs tabular-nums">{stage.number}</span>
                <h3 className="font-semibold text-xl">{stage.step}</h3>
                <p className="text-muted-foreground text-sm">{stage.text}</p>
              </div>
              {stage.features.map(({ id, href, label, description, icon: Icon, tone }) => (
                <Link
                  key={id}
                  href={href}
                  className="group flex flex-1 flex-col gap-3 rounded-3xl bg-page p-4 transition-colors hover:bg-page/70"
                >
                  <span className={`flex size-10 items-center justify-center rounded-2xl ${tone}`}>
                    <Icon className="size-5" />
                  </span>
                  <span className="flex-1 space-y-1">
                    <span className="flex items-center gap-1 font-semibold text-sm">
                      {label}
                      <IconArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                    <span className="block text-muted-foreground text-xs leading-snug">{description}</span>
                  </span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Where a feature sits in the hire: the four stages, its own lit, the other tools one click away. */
export function PipelinePosition({ featureId }: Readonly<{ featureId: string }>) {
  return (
    <ol className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {STAGES.map((stage) => {
        const here = stage.features.some((f) => f.id === featureId);
        return (
          <li
            key={stage.step}
            aria-current={here ? "step" : undefined}
            className={
              here
                ? "space-y-1 rounded-2xl bg-ink p-4 text-white"
                : "space-y-1 rounded-2xl bg-page p-4 text-muted-foreground"
            }
          >
            <span className="font-semibold text-xs tabular-nums">{stage.number}</span>
            <p className={here ? "font-semibold" : "font-medium text-foreground"}>{stage.step}</p>
            <p className="flex flex-wrap gap-x-1.5 text-xs leading-snug">
              {stage.features.map((f, i) => (
                <span key={f.id}>
                  {f.id === featureId ? (
                    <span>{f.label}</span>
                  ) : (
                    <Link
                      href={f.href}
                      className={here ? "underline underline-offset-2 hover:text-white" : "underline underline-offset-2 hover:text-foreground"}
                    >
                      {f.label}
                    </Link>
                  )}
                  {i < stage.features.length - 1 && " ·"}
                </span>
              ))}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
