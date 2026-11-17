import type { Translator } from "#/i18n/translator";

/** Why a file was not added, words aside (cv.refused.*). */
export type RefusedReason = { kind: "type" } | { kind: "size"; mb: number } | { kind: "over"; limit: number };

export type RefusedFile = { name: string; reason: RefusedReason };

function reasonText(r: RefusedReason, t: Translator<"cv.refused">): string {
  if (r.kind === "size") return t("size", { mb: r.mb });
  if (r.kind === "over") return t("over", { limit: r.limit });
  return t("type");
}

/**
 * What was not added, readable when a whole folder was dropped: those over
 * the analysis's limit in one line, the others by name (8 at most).
 */
export function refusedLines(refused: RefusedFile[], t: Translator<"cv.refused">): { key: string; name?: string; text: string }[] {
  const over = refused.filter((r) => r.reason.kind === "over");
  const others = refused.filter((r) => r.reason.kind !== "over");
  const lines: { key: string; name?: string; text: string }[] = others
    .slice(0, 8)
    .map((r) => ({ key: `n:${r.name}`, name: r.name, text: t("named", { reason: reasonText(r.reason, t) }) }));
  if (others.length > 8) lines.push({ key: "more", text: t("more", { count: others.length - 8 }) });
  if (over.length > 0) lines.push({ key: "over", text: t("overLine", { count: over.length, reason: reasonText(over[0].reason, t) }) });
  return lines;
}
