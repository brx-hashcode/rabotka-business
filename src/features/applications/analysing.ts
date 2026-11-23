import type { ExternalApplication } from "#/lib/api/careers-controller";

/**
 * A careers CV being read: its analysis under way, or queued (at import, on
 * applying) before any analysis shows. Its score is on its way: nothing to
 * press, and the list keeps polling.
 */
export function isAnalysing(a: Pick<ExternalApplication, "analysis" | "analysisQueued">): boolean {
  return a.analysis?.status === "QUEUED" || !!a.analysisQueued;
}
