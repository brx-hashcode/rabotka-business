"use client";

import { useEffect, useMemo, useState } from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useQuery } from "@tanstack/react-query";
import { format, isSameDay, isSameMonth, isToday } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { IconCalendarEvent, IconChevronLeft, IconChevronRight, IconDownload, IconVideo } from "@tabler/icons-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogTitle } from "#/components/ui/dialog";
import { Skeleton } from "#/components/ui/skeleton";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import { interviewsKey, listInterviews } from "#/lib/api/interview-controller";
import type { Interview } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import {
  FIRST_HOUR,
  LAST_HOUR,
  blockPosition,
  entriesOn,
  isPast,
  lanes,
  periodTitle,
  step,
  toEntries,
  visibleDays,
  visibleRange,
  type CalendarEntry,
} from "../calendar-grid";
import { interviewsCsv, saveCsv } from "../interviews-csv";
import type { Locale } from "#/i18n/config";
import { DATE_FNS_LOCALE } from "#/i18n/date-fns";
import { STATUS_CHIP } from "./interview-bits";
import { InterviewCard } from "./interview-card";

const MODES = [
  { key: "mois" },
  { key: "semaine" },
] as const;

/** Chips shown in one day of the month before « +N ». */
const PER_DAY = 3;
/** One hour of the week view, in px. */
const HOUR_PX = 52;

const hhmm = (d: Date) => format(d, "HH:mm");

/** The interviews in a month or a week; a click opens the same card as the list. */
export function InterviewsCalendar() {
  const t = useTranslations("interviews.calendar");
  const ti = useTranslations("interviews");
  const locale = useLocale() as Locale;
  const friendlyError = useFriendlyError();
  const [mode, setMode] = useQueryState("periode", parseAsStringLiteral(["mois", "semaine"] as const).withDefault("mois"));
  const [anchor, setAnchor] = useState(() => new Date());
  const [open, setOpen] = useState<Interview | null>(null);

  const { from, to } = visibleRange(mode, anchor);
  const query = useQuery({
    queryKey: [...interviewsKey, "range", from.toISOString(), to.toISOString()],
    queryFn: () => listInterviews({ from: from.toISOString(), to: to.toISOString() }),
    placeholderData: (prev) => prev,
  });
  const entries = useMemo(() => toEntries(query.data ?? []), [query.data]);
  const days = visibleDays(mode, anchor);

  // The period as the title says it: the month alone (not the days of the
  // weeks around it), or the week.
  function exportPeriod() {
    const inPeriod = entries.filter((e) => (mode === "mois" ? isSameMonth(e.start, anchor) : days.some((d) => isSameDay(d, e.start))));
    if (inPeriod.length === 0) {
      toast(t("none"));
      return;
    }
    const name = mode === "mois" ? format(anchor, "yyyy-MM") : t("week", { date: format(days[0], "yyyy-MM-dd") });
    saveCsv(interviewsCsv(inPeriod, ti, locale), t("file", { name }));
  }

  // The card in the dialog follows the list: moved, cancelled, answered.
  const shown = open ? ((query.data ?? []).find((i) => i.id === open.id) ?? open) : null;

  return (
    <section className="space-y-4 rounded-3xl bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <NavButton label={t("previous")} onClick={() => setAnchor((a) => step(mode, a, -1))}>
            <IconChevronLeft className="size-4" />
          </NavButton>
          <NavButton label={t("next")} onClick={() => setAnchor((a) => step(mode, a, 1))}>
            <IconChevronRight className="size-4" />
          </NavButton>
          <button
            type="button"
            onClick={() => setAnchor(new Date())}
            className="h-9 rounded-full bg-page px-4 font-medium text-sm hover:bg-page/70"
          >
            {t("today")}
          </button>
          <h2 className="ml-2 font-semibold text-lg capitalize">{periodTitle(mode, anchor, locale)}</h2>
        </div>
        <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!query.data}
          onClick={exportPeriod}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-page px-4 font-medium text-sm hover:bg-page/70 disabled:opacity-50"
        >
          <IconDownload className="size-4" />
          {t("export")}
        </button>
        <div role="tablist" aria-label={t("shownPeriod")} className="inline-flex rounded-full bg-page p-1">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              role="tab"
              aria-selected={mode === m.key}
              onClick={() => void setMode(m.key)}
              className={cn(
                "rounded-full px-4 py-1.5 font-medium text-sm",
                mode === m.key ? "bg-selected text-selected-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`modes.${m.key}`)}
            </button>
          ))}
        </div>
        </div>
      </div>

      {query.isLoading && <Skeleton className="h-[480px] w-full rounded-2xl" />}
      {!query.isLoading && !query.data && (
        <p className="rounded-2xl bg-page p-6 text-muted-foreground">
          {friendlyError(query.error, ti("page.unavailable"))}
        </p>
      )}
      {query.data && (
        <>
          <div className="hidden md:block">
            {mode === "mois" ? (
              <MonthGrid
                days={days}
                anchor={anchor}
                entries={entries}
                onOpen={setOpen}
                onDay={(d) => {
                  setAnchor(d);
                  void setMode("semaine");
                }}
              />
            ) : (
              <WeekGrid days={days} entries={entries} onOpen={setOpen} />
            )}
          </div>
          <div className="md:hidden">
            <Agenda days={mode === "mois" ? days.filter((d) => isSameMonth(d, anchor)) : days} entries={entries} onOpen={setOpen} />
          </div>
        </>
      )}

      <Dialog open={Boolean(shown)} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md gap-0 rounded-3xl border-0 bg-card p-0 shadow-soft">
          <DialogTitle className="sr-only">{shown ? t("withName", { name: shown.candidateName }) : t("interview")}</DialogTitle>
          {shown && (
            <ul className="max-h-[85svh] overflow-y-auto">
              <InterviewCard interview={shown} past={isPast(shown)} />
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function NavButton({ label, onClick, children }: Readonly<{ label: string; onClick: () => void; children: React.ReactNode }>) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-9 items-center justify-center rounded-full bg-page text-muted-foreground hover:bg-page/70 hover:text-foreground"
    >
      {children}
    </button>
  );
}

/** The colour of an entry: its status, neutral once over, faded for a time only offered. */
function tone(e: CalendarEntry): string {
  const i = e.interview;
  if (i.status === "CANCELLED") return cn(STATUS_CHIP.CANCELLED, "line-through");
  if (i.endedAt) return "bg-foreground/[0.07] text-muted-foreground";
  return cn(STATUS_CHIP[i.status], e.offered && "opacity-70");
}

function EntryLabel({ e, withTime = true }: Readonly<{ e: CalendarEntry; withTime?: boolean }>) {
  return (
    <>
      {withTime && <span className="shrink-0 tabular-nums">{hhmm(e.start)}</span>}
      {e.interview.mode === "VIDEO" && <IconVideo className="size-3.5 shrink-0" />}
      <span className="min-w-0 truncate font-medium">
        {e.offered && "? "}
        {e.interview.candidateName}
      </span>
    </>
  );
}

function entryTitle(e: CalendarEntry, t: ReturnType<typeof useTranslations<"interviews">>): string {
  const what = e.offered ? t("calendar.offered") : t(`status.${e.interview.status}`).toLowerCase();
  return `${hhmm(e.start)} · ${e.interview.candidateName} · ${e.interview.jobTitle} (${what})`;
}

/** Monday first, in the reader's language (« lun. », « Mon »). */
function weekdays(locale: Locale): string[] {
  // 2024-01-01 was a Monday.
  return Array.from({ length: 7 }, (_, i) => format(new Date(2024, 0, 1 + i), "EEE", { locale: DATE_FNS_LOCALE[locale] }));
}

function MonthGrid({
  days,
  anchor,
  entries,
  onOpen,
  onDay,
}: Readonly<{
  days: Date[];
  anchor: Date;
  entries: CalendarEntry[];
  onOpen: (i: Interview) => void;
  onDay: (d: Date) => void;
}>) {
  const t = useTranslations("interviews");
  const locale = useLocale() as Locale;
  const WEEKDAYS = weekdays(locale);
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((d) => (
          <p key={d} className="px-2 font-medium text-muted-foreground text-xs uppercase">
            {d}
          </p>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const here = entriesOn(entries, day);
          const more = here.length - PER_DAY;
          return (
            <div
              key={day.toISOString()}
              className={cn("flex min-h-28 flex-col gap-1 rounded-2xl bg-page p-1.5", !isSameMonth(day, anchor) && "opacity-45")}
            >
              <button
                type="button"
                onClick={() => onDay(day)}
                aria-label={t("calendar.seeWeek", { date: format(day, "d MMMM", { locale: DATE_FNS_LOCALE[locale] }) })}
                className={cn(
                  "flex size-7 items-center justify-center self-start rounded-full font-medium text-sm tabular-nums hover:bg-card",
                  isToday(day) && "bg-brand-lime text-[#0f2414] hover:bg-brand-lime",
                )}
              >
                {format(day, "d")}
              </button>
              {here.slice(0, PER_DAY).map((e) => (
                <button
                  key={e.key}
                  type="button"
                  title={entryTitle(e, t)}
                  onClick={() => onOpen(e.interview)}
                  className={cn("flex items-center gap-1.5 rounded-lg px-2 py-1 text-left text-xs", tone(e))}
                >
                  <EntryLabel e={e} />
                </button>
              ))}
              {more > 0 && (
                <button
                  type="button"
                  onClick={() => onDay(day)}
                  className="rounded-lg px-2 py-0.5 text-left font-medium text-muted-foreground text-xs hover:text-foreground"
                >
                  {t("calendar.others", { count: more })}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({ days, entries, onOpen }: Readonly<{ days: Date[]; entries: CalendarEntry[]; onOpen: (i: Interview) => void }>) {
  const t = useTranslations("interviews");
  const locale = useLocale() as Locale;
  const hours = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) => FIRST_HOUR + i);
  const height = hours.length * HOUR_PX;
  const now = useNow();
  const nowAt = blockPosition(now, 0);

  // Outside 7 h–21 h: said above the day, rather than lost.
  const outside = (day: Date) => entriesOn(entries, day).filter((e) => !blockPosition(e.start, e.minutes));

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[3rem_repeat(7,minmax(0,1fr))] gap-1.5">
        <span />
        {days.map((day) => (
          <div key={day.toISOString()} className="space-y-1 px-1">
            <p className="flex items-baseline gap-1.5">
              <span className="font-medium text-muted-foreground text-xs uppercase">{format(day, "EEE", { locale: DATE_FNS_LOCALE[locale] })}</span>
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full font-semibold tabular-nums",
                  isToday(day) && "bg-brand-lime text-[#0f2414]",
                )}
              >
                {format(day, "d")}
              </span>
            </p>
            {outside(day).map((e) => (
              <button
                key={e.key}
                type="button"
                title={entryTitle(e, t)}
                onClick={() => onOpen(e.interview)}
                className={cn("flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-left text-xs", tone(e))}
              >
                <EntryLabel e={e} />
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[3rem_repeat(7,minmax(0,1fr))] gap-1.5">
        <div className="relative" style={{ height }}>
          {hours.map((h, i) => (
            <span key={h} className="absolute right-1 -translate-y-1/2 text-muted-foreground text-xs tabular-nums" style={{ top: i * HOUR_PX }}>
              {i === 0 ? "" : t("calendar.hour", { h })}
            </span>
          ))}
        </div>
        {days.map((day) => {
          const here = entriesOn(entries, day);
          const lane = lanes(here);
          return (
            <div key={day.toISOString()} className="relative overflow-hidden rounded-2xl bg-page" style={{ height }}>
              {hours.slice(1).map((h, i) => (
                <span key={h} className="absolute inset-x-0 h-px bg-foreground/[0.06]" style={{ top: (i + 1) * HOUR_PX }} />
              ))}
              {here.map((e) => {
                const pos = blockPosition(e.start, e.minutes);
                if (!pos) return null;
                const { lane: l, of } = lane.get(e.key) ?? { lane: 0, of: 1 };
                const short = pos.height < (45 / ((LAST_HOUR - FIRST_HOUR) * 60)) * 100;
                return (
                  <button
                    key={e.key}
                    type="button"
                    title={entryTitle(e, t)}
                    onClick={() => onOpen(e.interview)}
                    className={cn("absolute overflow-hidden rounded-lg px-1.5 py-1 text-left text-xs", tone(e))}
                    style={{
                      top: `${pos.top}%`,
                      height: `${pos.height}%`,
                      left: `calc(${(l / of) * 100}% + 2px)`,
                      width: `calc(${100 / of}% - 4px)`,
                    }}
                  >
                    <span className={cn("flex min-w-0 gap-1.5", short ? "items-center" : "flex-col items-start gap-0.5")}>
                      <span className="shrink-0 tabular-nums">{hhmm(e.start)}</span>
                      <span className="flex min-w-0 max-w-full items-center gap-1">
                        <EntryLabel e={e} withTime={false} />
                      </span>
                    </span>
                  </button>
                );
              })}
              {isSameDay(day, now) && nowAt && (
                <span className="pointer-events-none absolute inset-x-0 h-0.5 bg-destructive" style={{ top: `${nowAt.top}%` }}>
                  <span className="absolute -top-1 -left-1 size-2.5 rounded-full bg-destructive" />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** The phone: the days that have something, one under the other. */
function Agenda({ days, entries, onOpen }: Readonly<{ days: Date[]; entries: CalendarEntry[]; onOpen: (i: Interview) => void }>) {
  const t = useTranslations("interviews");
  const locale = useLocale() as Locale;
  const busy = days.map((d) => ({ day: d, here: entriesOn(entries, d) })).filter((x) => x.here.length > 0);
  if (busy.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-page px-6 py-12 text-center">
        <IconCalendarEvent className="size-6 text-muted-foreground" />
        <p className="font-medium">{t("calendar.noneHere")}</p>
      </div>
    );
  }
  return (
    <ul className="space-y-4">
      {busy.map(({ day, here }) => (
        <li key={day.toISOString()} className="space-y-2">
          <p className={cn("font-semibold text-sm capitalize", isToday(day) && "text-whatsapp-dark")}>
            {format(day, "EEEE d MMMM", { locale: DATE_FNS_LOCALE[locale] })}
          </p>
          {here.map((e) => (
            <button
              key={e.key}
              type="button"
              onClick={() => onOpen(e.interview)}
              className="flex w-full items-center gap-3 rounded-2xl bg-page p-3 text-left"
            >
              <span className={cn("rounded-lg px-2 py-1 font-medium text-xs tabular-nums", tone(e))}>{hhmm(e.start)}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 truncate font-medium">
                  {e.interview.mode === "VIDEO" && <IconVideo className="size-4 shrink-0 text-muted-foreground" />}
                  {e.offered && "? "}
                  {e.interview.candidateName}
                </span>
                <span className="block truncate text-muted-foreground text-xs">
                  {e.interview.jobTitle} · {e.offered ? t("calendar.offered") : t(`status.${e.interview.status}`)}
                </span>
              </span>
            </button>
          ))}
        </li>
      ))}
    </ul>
  );
}

/** The time, every minute: the week view's red line moves on. */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  return now;
}
