import type { BusinessPlan } from "#/lib/api/types";

/**
 * The plan put forward (« Le plus choisi ») to an organisation without a paid
 * plan yet: the catalog's second in the admin's order, the middle of the usual
 * three. Custom plans don't count; none with fewer than two public plans.
 */
export function featuredPlanId(plans: readonly Pick<BusinessPlan, "id" | "custom">[]): string | null {
  return plans.filter((p) => !p.custom)[1]?.id ?? null;
}
