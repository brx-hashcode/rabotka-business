import { format } from "date-fns";

import type { CalendarEntry } from "./calendar-grid";
import { STATUS, modeLabel } from "./components/interview-bits";

const HEADER = ["Date", "Heure", "Durée (min)", "Candidat", "Poste", "Format", "Statut", "Message du candidat"];

/**
 * One cell for Excel: quoted when it holds a separator, a quote or a line
 * break, and a leading = + - @ neutralised (a name is the candidate's text,
 * never a formula).
 */
export function csvCell(value: string | number): string {
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** A video's link is the candidate's own: the file says « Visio », never the link. */
function formatOf(e: CalendarEntry): string {
  return e.interview.mode === "VIDEO" ? "Visio" : modeLabel(e.interview);
}

function statusOf(e: CalendarEntry): string {
  if (e.offered) return "Créneau proposé, au choix du candidat";
  if (e.interview.endedAt && e.interview.status !== "CANCELLED") return "Terminé";
  return STATUS[e.interview.status].label;
}

/**
 * The interviews in the period as a CSV Excel opens as is: « ; » between
 * cells (French Excel), CRLF lines, and a BOM so the accents read right.
 */
export function interviewsCsv(entries: CalendarEntry[]): string {
  const rows = entries.map((e) => [
    format(e.start, "dd/MM/yyyy"),
    format(e.start, "HH:mm"),
    e.minutes,
    e.interview.candidateName,
    e.interview.jobTitle,
    formatOf(e),
    statusOf(e),
    e.interview.responseNote ?? "",
  ]);
  return `﻿${[HEADER, ...rows].map((r) => r.map(csvCell).join(";")).join("\r\n")}\r\n`;
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
