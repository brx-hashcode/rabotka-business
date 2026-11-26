import type { Translator } from "#/i18n/translator";

type Role = "admins" | "recruiters" | "reviewers";

/** How a plan's team places read: « Équipe : 1 administrateur, 2 recruteurs et 1 évaluateur ». */
export function teamLine(
  plan: { adminsLimit?: number | null; recruitersLimit?: number | null; reviewersLimit?: number | null },
  t: Translator<"subscription">,
): string | null {
  // Absent from a backend older than the team.
  if (plan.recruitersLimit === undefined && plan.reviewersLimit === undefined) return null;
  const part = (n: number | null | undefined, role: Role) => {
    if (n === 0 || n === undefined) return null;
    return n === null ? t(`lines.${role}Unlimited`) : t(`lines.${role}`, { count: n });
  };
  const parts = [
    part(plan.adminsLimit, "admins"),
    part(plan.recruitersLimit, "recruiters"),
    part(plan.reviewersLimit, "reviewers"),
  ].filter((p): p is string => p !== null);
  if (parts.length === 0) return null;
  const last = parts.pop()!;
  const list = parts.length === 0 ? last : t("lines.and", { a: parts.join(", "), b: last });
  return t("lines.team", { parts: list });
}
