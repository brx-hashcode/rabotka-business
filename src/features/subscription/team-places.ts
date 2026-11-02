/** How a plan's team places read: « Équipe : 2 recruteurs et 1 évaluateur ». */
export function teamLine(plan: { recruitersLimit?: number | null; reviewersLimit?: number | null }): string | null {
  // Absent from a backend older than the team.
  if (plan.recruitersLimit === undefined && plan.reviewersLimit === undefined) return null;
  const part = (n: number | null | undefined, one: string, many: string) =>
    n === 0 || n === undefined ? null : n === null ? `${many} illimités` : `${n} ${n > 1 ? many : one}`;
  const parts = [
    part(plan.recruitersLimit, "recruteur", "recruteurs"),
    part(plan.reviewersLimit, "évaluateur", "évaluateurs"),
  ].filter(Boolean);
  return parts.length ? `Équipe : ${parts.join(" et ")}` : null;
}
