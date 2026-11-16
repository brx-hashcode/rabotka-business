import { IconArrowRight } from "@tabler/icons-react";
import { type SiteCopy, useSiteCopy } from "../copy";
import { useTranslations } from "next-intl";

import { LocalLink as Link } from "#/components/local-link";
import { featureGroups, features, FEATURES_HREF } from "../content";
import { SectionHeading } from "./section-heading";
import { IconTile } from "./icon-tile";

/** The groups with their features, numbered: the hire's four stages. */
export function stages(copy: SiteCopy) {
  const all = features(copy);
  return featureGroups(copy).map((group, i) => ({
    ...group,
    number: String(i + 1).padStart(2, "0"),
    features: group.ids.map((id) => all.find((f) => f.id === id)).filter((f) => f !== undefined),
  }));
}

/** The home page's product overview: four stages, two tools each, each a link to its page. */
export function FeatureStages() {
  const t = useTranslations("site.stages");
  const STAGES = stages(useSiteCopy());
  return (
    <section id="fonctionnalites" className="py-20 md:py-28">
      <div className="mx-auto w-full max-w-7xl space-y-12 px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            kicker={t("kicker")}
            title={t("title")}
            text={t("text")}
          />
          <Link
            href={FEATURES_HREF}
            className="group inline-flex items-center gap-1.5 font-medium underline-offset-4 hover:underline"
          >
            {t("allDetails")}
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
              {stage.features.map(({ id, href, label, description, icon }) => (
                <Link
                  key={id}
                  href={href}
                  className="group flex flex-1 flex-col gap-3 rounded-3xl bg-page p-4 transition-colors hover:bg-page/70"
                >
                  <IconTile icon={icon} surface="card" />
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
  const STAGES = stages(useSiteCopy());
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
