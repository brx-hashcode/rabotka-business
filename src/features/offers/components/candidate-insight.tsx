import { useTranslations } from "next-intl";

import { Points } from "#/features/cv-screening/components/cv-bits";
import { ScoreDetails, type ScoreBar } from "#/features/cv-screening/components/score-details";
import type { CvScoring } from "#/lib/api/types";
import type { Translator } from "#/i18n/translator";

/**
 * Why a candidate got their score: what fits, what to check, and the score by
 * criterion. The same block for a Rabotka applicant and a careers-page CV, so
 * the two read alike side by side.
 */
export function CandidateInsight({
  summary,
  strengths,
  gaps,
  criteria,
  musts = [],
}: Readonly<{
  summary?: string | null;
  strengths: string[];
  gaps: string[];
  criteria: ScoreBar[];
  /** What the offer requires; none on the previous method. */
  musts?: CvScoring["musts"];
}>) {
  const t = useTranslations("offers.candidate");
  if (!summary && strengths.length + gaps.length + criteria.length + musts.length === 0) return null;
  return (
    <div className="mt-4 space-y-4">
      {summary && <p className="text-sm leading-relaxed">{summary}</p>}
      <div className="grid gap-5 md:grid-cols-[1fr_1fr_14rem]">
        <Points title={t("strengths")} items={strengths} tone="good" />
        <Points title={t("gaps")} items={gaps} tone="gap" />
        <ScoreDetails bars={criteria} musts={musts} className="bg-card" />
      </div>
    </div>
  );
}

/** The one toggle that opens a candidate's analysis and answers, on both cards. */
export function detailsLabel(analysis: boolean, answers: boolean, t: Translator<"offers.candidate">): string {
  if (analysis && answers) return t("analysisAndAnswers");
  return analysis ? t("seeAnalysis") : t("seeAnswers");
}
