import type { Translator } from "#/i18n/translator";

/** How a plan's team places read: « Équipe : 2 recruteurs et 1 évaluateur ». */
export function teamLine(
  plan: { recruitersLimit?: number | null; reviewersLimit?: number | null },
  t: Translator<"subscription">,
): string | null {
  // Absent from a backend older than the team.
  if (plan.recruitersLimit === undefined && plan.reviewersLimit === undefined) return null;
  const part = (n: number | null | undefined, role: "recruiters" | "reviewers") =>
    n === 0 || n === undefined ? null : n === null ? t(`lines.${role}Unlimited`) : t(`lines.${role}`, { count: n });
  const parts = [part(plan.recruitersLimit, "recruiters"), part(plan.reviewersLimit, "reviewers")].filter(
    (p): p is string => p !== null,
  );
  if (parts.length === 0) return null;
  return t("lines.team", { parts: parts.length === 2 ? t("lines.and", { a: parts[0], b: parts[1] }) : parts[0] });
}
