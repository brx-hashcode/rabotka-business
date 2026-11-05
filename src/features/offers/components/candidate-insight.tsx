import { CriterionBar, Points } from "#/features/cv-screening/components/cv-bits";

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
}: Readonly<{
  summary?: string | null;
  strengths: string[];
  gaps: string[];
  criteria: { label: string; value: number }[];
}>) {
  if (!summary && strengths.length + gaps.length + criteria.length === 0) return null;
  return (
    <div className="mt-4 space-y-4">
      {summary && <p className="text-sm leading-relaxed">{summary}</p>}
      <div className="grid gap-5 md:grid-cols-[1fr_1fr_14rem]">
        <Points title="Points forts" items={strengths} tone="good" />
        <Points title="Points à vérifier" items={gaps} tone="gap" />
        {criteria.length > 0 && (
          <div className="space-y-2.5 rounded-2xl bg-card p-4">
            {criteria.map((c) => (
              <CriterionBar key={c.label} label={c.label} value={c.value} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** The one toggle that opens a candidate's analysis and answers, on both cards. */
export function detailsLabel(analysis: boolean, answers: boolean): string {
  if (analysis && answers) return "Analyse et réponses";
  return analysis ? "Voir l'analyse" : "Voir les réponses";
}
