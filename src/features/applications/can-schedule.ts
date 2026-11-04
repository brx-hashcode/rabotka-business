import type { ExternalApplication } from "#/lib/api/careers-controller";

/**
 * Whether a careers-page candidate can be invited to an interview. Retaining
 * them fills a post, often the last one, so the kept person stays invitable
 * after the offer stops recruiting; someone still pending only while it does.
 */
export function canSchedule(a: Pick<ExternalApplication, "status" | "offer">) {
  if (a.status === "RETAINED") return true;
  return a.status === "PENDING" && (a.offer.status === "ACTIVE" || a.offer.status === "PARTIALLY_FILLED");
}
