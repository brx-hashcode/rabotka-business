import type { QueryClient, QueryKey } from "@tanstack/react-query";

/** Rabotka applications carry `applicationId`; careers-page ones their own `id`. */
type IdField = "applicationId" | "id";

/**
 * A new status for one application in whatever cached list holds it: an
 * offer's applicants (an array), the inbox (`{ items }`), a paged list
 * (`{ pages }`). Anything else, or a list without it, comes back as is (same
 * reference, so React Query leaves that query alone).
 */
export function withApplicationStatus<T>(data: T, applicationId: string, status: string, field: IdField = "applicationId"): T {
  if (Array.isArray(data)) {
    let changed = false;
    const next = data.map((row: unknown) => {
      if (row && typeof row === "object" && (row as Record<string, unknown>)[field] === applicationId) {
        if ((row as { status?: unknown }).status === status) return row;
        changed = true;
        return { ...row, status };
      }
      return row;
    });
    return (changed ? next : data) as T;
  }
  if (data && typeof data === "object") {
    for (const holder of ["items", "pages"] as const) {
      const inner = (data as Record<string, unknown>)[holder];
      if (Array.isArray(inner)) {
        const next =
          holder === "pages"
            ? inner.map((p) => withApplicationStatus(p, applicationId, status, field))
            : withApplicationStatus(inner, applicationId, status, field);
        const same = holder === "pages" ? (next as unknown[]).every((p, i) => p === inner[i]) : next === inner;
        return same ? data : ({ ...data, [holder]: next } as T);
      }
    }
  }
  return data;
}

/**
 * Shows the decision at once on every card of that application (the offer's
 * candidates, the inbox), before the server answers. Returns the undo for an
 * error. The refetch after the answer brings the rest (counts, unlock).
 */
export function showApplicationStatus(queryClient: QueryClient, applicationId: string, status: string): () => void {
  return showStatus(queryClient, ["offers"], applicationId, status, "applicationId");
}

/** The same for a careers-page candidate (« Retenir », « Refuser »…). */
export function showExternalStatus(queryClient: QueryClient, id: string, status: string): () => void {
  return showStatus(queryClient, ["external-applications"], id, status, "id");
}

function showStatus(queryClient: QueryClient, queryKey: QueryKey, id: string, status: string, field: IdField): () => void {
  const filter = { queryKey };
  void queryClient.cancelQueries(filter);
  const before = queryClient.getQueriesData(filter);
  queryClient.setQueriesData(filter, (data: unknown) => withApplicationStatus(data, id, status, field));
  return () => {
    for (const [queryKey, data] of before) queryClient.setQueryData(queryKey, data);
  };
}
