import { format } from "date-fns";

import type { Locale } from "#/i18n/config";
import type { CalendarEntry } from "./calendar-grid";
import { modeLabel, type InterviewsT } from "./components/interview-bits";

/**
 * One cell for Excel: quoted when it holds a separator, a quote or a line
 * break, and a leading = + - @ neutralised (a name is the candidate's text,
 * never a formula).
 */
export function csvCell(value: string | number, separator = ";"): string {
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /["\n\r]/.test(s) || s.includes(separator) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** A video's link is the candidate's own: the file says « Visio », never the link. */
function formatOf(e: CalendarEntry, t: InterviewsT): string {
  return e.interview.mode === "VIDEO" ? t("mode.VIDEO") : modeLabel(e.interview, t);
}

function statusOf(e: CalendarEntry, t: InterviewsT): string {
  if (e.offered) return t("offered");
  if (e.interview.endedAt && e.interview.status !== "CANCELLED") return t("endedLabel");
  return t(`status.${e.interview.status}`);
}

/**
 * The interviews in the period as a CSV Excel opens as is: « ; » between
 * cells in French (French Excel), « , » in English, CRLF lines, and a BOM
 * so the accents read right.
 */
export function interviewsCsv(entries: CalendarEntry[], t: InterviewsT, locale: Locale = "fr"): string {
  const separator = locale === "fr" ? ";" : ",";
  const rows = entries.map((e) => [
    format(e.start, "dd/MM/yyyy"),
    format(e.start, "HH:mm"),
    e.minutes,
    e.interview.candidateName,
    e.interview.jobTitle,
    formatOf(e, t),
    statusOf(e, t),
    e.interview.responseNote ?? "",
  ]);
  const header = t.raw("csv.header") as string[];
  return `﻿${[header, ...rows].map((r) => r.map((c) => csvCell(c, separator)).join(separator)).join("\r\n")}\r\n`;
}

/** Hands the file to the browser. */
export function saveCsv(csv: string, name: string): void {
  const href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
