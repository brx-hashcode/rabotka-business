"use client";

import { IconAlertTriangleFilled, IconCircleCheckFilled, IconHelpCircleFilled } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

import type { CvScoring } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { CriterionBar } from "./cv-bits";

export type ScoreBar = {
  key: string;
  label: string;
  /** Null: the CV does not show it. */
  value: number | null;
  /** What the mark rests on: the CV's words. */
  title?: string;
};

/** An offer's own criteria, as bars: the mark of each, and the CV's words on hover. */
export function scoringBars(scoring: CvScoring): ScoreBar[] {
  return scoring.criteria.map((c) => {
    const quotes = [c.quote?.text, ...(c.asked ?? []).map((a) => (a.found ? (a.quote?.text ?? a.label) : null))].filter(Boolean);
    return { key: c.key, label: c.label, value: c.mark, ...(quotes.length ? { title: quotes.map((q) => `« ${q} »`).join("\n") } : {}) };
  });
}

const MUST = {
  MET: { icon: IconCircleCheckFilled, tone: "text-chip-green-foreground" },
  MISSING: { icon: IconAlertTriangleFilled, tone: "text-destructive" },
  UNCLEAR: { icon: IconHelpCircleFilled, tone: "text-chip-amber-foreground" },
} as const;

/** The score by criterion, then what the offer requires: met, missing or to check. */
export function ScoreDetails({
  bars,
  musts = [],
  className,
}: Readonly<{ bars: ScoreBar[]; musts?: CvScoring["musts"]; className?: string }>) {
  const t = useTranslations("labels");
  if (bars.length + musts.length === 0) return null;
  return (
    <div className={cn("space-y-2.5 rounded-2xl p-4", className)}>
      {bars.map((b) => (
        <CriterionBar key={b.key} label={b.label} value={b.value} title={b.title} />
      ))}
      {musts.length > 0 && (
        <div className="space-y-1.5 pt-1.5">
          <p className="font-medium text-xs">{t("must.title")}</p>
          <ul className="space-y-1.5">
            {musts.map((m) => {
              const { icon: Icon, tone } = MUST[m.status];
              return (
                <li key={m.key} title={m.quote ? `« ${m.quote.text} »` : undefined} className="flex gap-1.5 text-xs">
                  <Icon aria-hidden className={cn("mt-px size-3.5 shrink-0", tone)} />
                  <span className="min-w-0">
                    <span className="text-muted-foreground">{m.label}</span> <span className={cn("font-medium", tone)}>{t(`must.${m.status}`)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
