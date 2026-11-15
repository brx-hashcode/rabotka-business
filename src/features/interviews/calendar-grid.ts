import { addDays, addMonths, addWeeks, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";

import type { Interview } from "#/lib/api/types";

/** The calendar of « Entretiens »: a month, or a week of hours. */
export type CalendarMode = "mois" | "semaine";

/** The grid's hours in the week view: 7 h to 21 h. */
export const FIRST_HOUR = 7;
export const LAST_HOUR = 21;

const MONDAY = { weekStartsOn: 1 } as const;

/** The days on screen: six full weeks for a month, seven days for a week. */
export function visibleDays(mode: CalendarMode, anchor: Date): Date[] {
  const start = mode === "mois" ? startOfWeek(startOfMonth(anchor), MONDAY) : startOfWeek(anchor, MONDAY);
  const count = mode === "mois" ? 42 : 7;
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

/** What to load: from the first day shown to the day after the last. */
export function visibleRange(mode: CalendarMode, anchor: Date): { from: Date; to: Date } {
  const days = visibleDays(mode, anchor);
  return { from: days[0], to: addDays(days[days.length - 1], 1) };
}

/** ‹ and ›: a month or a week back or ahead. */
export function step(mode: CalendarMode, anchor: Date, by: 1 | -1): Date {
  return mode === "mois" ? addMonths(anchor, by) : addWeeks(anchor, by);
}

/** « novembre 2026 », or « 16 – 22 nov. 2026 » for a week. */
export function periodTitle(mode: CalendarMode, anchor: Date): string {
  if (mode === "mois") return format(anchor, "LLLL yyyy", { locale: fr });
  const days = visibleDays("semaine", anchor);
  const first = days[0];
  const last = days[6];
  const end = format(last, "d MMM yyyy", { locale: fr });
  return isSameMonth(first, last) ? `${format(first, "d")} – ${end}` : `${format(first, "d MMM", { locale: fr })} – ${end}`;
}

/** One thing in the calendar: an interview at its time, or one of the times offered for it. */
export type CalendarEntry = {
  key: string;
  interview: Interview;
  start: Date;
  minutes: number;
  /** A time offered, the candidate has not chosen yet. */
  offered: boolean;
};

/**
 * Each interview at its time; one still waiting for the candidate to choose
 * among several times shows at each of them, as offered.
 */
export function toEntries(interviews: Interview[]): CalendarEntry[] {
  const out: CalendarEntry[] = [];
  for (const i of interviews) {
    const options = i.status === "PENDING" ? (i.options ?? []) : [];
    if (options.length > 0) {
      for (const o of options) {
        out.push({ key: `${i.id}:${o.id}`, interview: i, start: new Date(o.startsAt), minutes: i.durationMinutes, offered: true });
      }
    } else {
      out.push({ key: i.id, interview: i, start: new Date(i.startsAt), minutes: i.durationMinutes, offered: false });
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function entriesOn(entries: CalendarEntry[], day: Date): CalendarEntry[] {
  return entries.filter((e) => isSameDay(e.start, day));
}

/** Over: ended by the business, or started more than two hours ago (as the list's « Passés »). */
export function isPast(i: Interview, now = new Date()): boolean {
  return Boolean(i.endedAt) || new Date(i.startsAt).getTime() < now.getTime() - 2 * 3_600_000;
}

/** Where a time sits in the week view's day column, as % of its height; null outside 7 h–21 h. */
export function blockPosition(start: Date, minutes: number): { top: number; height: number } | null {
  const span = (LAST_HOUR - FIRST_HOUR) * 60;
  const from = start.getHours() * 60 + start.getMinutes() - FIRST_HOUR * 60;
  const to = from + Math.max(minutes, 15);
  if (to <= 0 || from >= span) return null;
  const top = Math.max(from, 0);
  const bottom = Math.min(to, span);
  return { top: (top / span) * 100, height: ((bottom - top) / span) * 100 };
}

/**
 * Side by side when they overlap: each entry's lane, and how many lanes its
 * group of overlapping entries needs.
 */
export function lanes(entries: CalendarEntry[]): Map<string, { lane: number; of: number }> {
  const out = new Map<string, { lane: number; of: number }>();
  const sorted = [...entries].sort((a, b) => a.start.getTime() - b.start.getTime());
  let group: CalendarEntry[] = [];
  let groupEnd = 0;
  let laneEnds: number[] = [];

  const close = () => {
    for (const e of group) out.set(e.key, { lane: out.get(e.key)!.lane, of: laneEnds.length });
    group = [];
    laneEnds = [];
  };

  for (const e of sorted) {
    const start = e.start.getTime();
    const end = start + Math.max(e.minutes, 15) * 60_000;
    if (group.length > 0 && start >= groupEnd) close();
    let lane = laneEnds.findIndex((t) => t <= start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else {
      laneEnds[lane] = end;
    }
    out.set(e.key, { lane, of: 0 });
    group.push(e);
    groupEnd = Math.max(groupEnd, end);
  }
  if (group.length > 0) close();
  return out;
}
