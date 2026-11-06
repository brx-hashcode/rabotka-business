"use client";

import { useMemo } from "react";
import { ResponsiveTimeRange, type CalendarDatum, type CalendarTooltipProps, type ColorScale } from "@nivo/calendar";
import { useTheme } from "next-themes";

import type { BusinessStats } from "#/lib/api/types";
import { shortDay } from "../stats-format";

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

/**
 * Sunday first, nivo's own week: its Monday-first one miscounts the columns
 * of a period starting on a Sunday (one short, the cells overflow).
 */
const WEEKDAYS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

/** Room on the left for the weekday names, and between the days: shared with the date row above. */
const LEGEND = 40;
const GAP = 3;

/** The brand's green, from a quiet day to the busiest; an empty day reads as the page. */
const PALETTE = {
  light: {
    empty: "#f1f4f8",
    steps: ["hsl(142 60% 86%)", "hsl(142 58% 70%)", "hsl(142 62% 54%)", "hsl(142 72% 42%)", "hsl(142 76% 30%)"],
    text: "#737373",
  },
  dark: {
    empty: "#2a2a2a",
    steps: ["hsl(142 40% 22%)", "hsl(142 48% 30%)", "hsl(142 58% 38%)", "hsl(142 70% 45%)", "hsl(142 76% 56%)"],
    text: "#a1a1a1",
  },
} as const;

type Day = CalendarDatum & { hires: number };

/** Midnight of an ISO day, in the browser's time: nivo counts days locally. */
const localDay = (iso: string) => new Date(`${iso}T00:00:00`);

/**
 * The date over each week's column, as nivo lays them out (a column per
 * Sunday-first week): the period's first day, then each Sunday after it.
 * Past 8 columns every other one, so the dates never run into each other.
 */
export function weekLabels(firstIso: string, days: number): (string | null)[] {
  const first = localDay(firstIso);
  const lead = first.getDay();
  const columns = Math.ceil((lead + days) / 7);
  return Array.from({ length: columns }, (_, c) => {
    if (columns > 8 && c % 2 === 1) return null;
    const d = new Date(first);
    if (c > 0) d.setDate(d.getDate() + 7 * c - lead);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  });
}

/**
 * Applications received per day over the period, as a time range: a column
 * per week (dated above it), a row per weekday, the busier the greener. A day
 * without any keeps the page's colour. Hovering a day shows its applications
 * and the hires decided that day; a table says the same to screen readers.
 */
export function ApplicationsChart({ series }: Readonly<{ series: BusinessStats["series"] }>) {
  const { resolvedTheme } = useTheme();
  const palette = PALETTE[resolvedTheme === "dark" ? "dark" : "light"];
  const max = Math.max(1, ...series.map((d) => d.applications));

  const data = useMemo<Day[]>(() => series.map((d) => ({ day: d.date, value: d.applications, hires: d.hires })), [series]);
  // Zero is « nothing that day », never the palest green: the page's colour, like the days without data.
  const colorScale = useMemo(() => {
    const steps = palette.steps;
    const scale = (value: number) =>
      value <= 0 ? palette.empty : steps[Math.min(steps.length - 1, Math.floor(((value - 1) / max) * steps.length))];
    return scale as unknown as ColorScale;
  }, [palette, max]);

  if (series.length === 0) return null;
  const from = localDay(series[0].date);
  // nivo leaves the last day out: up to the next midnight.
  const to = localDay(series[series.length - 1].date);
  to.setDate(to.getDate() + 1);
  const labels = weekLabels(series[0].date, series.length);

  return (
    <div className="space-y-3">
      {/* Laid out as nivo lays the columns: after the weekday names, one per week, the same gaps. */}
      <div
        aria-hidden
        className="grid text-muted-foreground text-xs tabular-nums"
        style={{
          gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))`,
          columnGap: GAP,
          paddingLeft: LEGEND + GAP,
          paddingRight: GAP,
        }}
      >
        {labels.map((label, i) => (
          <span key={i} className="truncate">
            {label}
          </span>
        ))}
      </div>
      <div className="h-52">
        <ResponsiveTimeRange
          data={data}
          from={from}
          to={to}
          weekdays={WEEKDAYS}
          weekdayTicks={[1, 3, 5]}
          weekdayLegendOffset={LEGEND}
          // The dates above say when; nivo's month names would say it twice.
          monthLegend={() => ""}
          square={false}
          colorScale={colorScale}
          emptyColor={palette.empty}
          daySpacing={GAP}
          dayRadius={5}
          dayBorderWidth={0}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          theme={{
            text: { fill: palette.text, fontSize: 12, fontFamily: "inherit" },
            tooltip: { container: { background: "transparent", boxShadow: "none", padding: 0 } },
          }}
          tooltip={DayTooltip}
        />
      </div>

      <div className="flex items-center justify-between gap-3 text-muted-foreground text-xs">
        <span>
          {shortDay(series[0].date)} – {shortDay(series[series.length - 1].date)}
        </span>
        <span className="flex items-center gap-1.5" aria-hidden>
          Moins
          {[palette.empty, ...palette.steps].map((c) => (
            <span key={c} className="size-3 rounded-[3px]" style={{ background: c }} />
          ))}
          Plus
        </span>
      </div>

      {/* On the wrapper: a table ignores sr-only's 1px height and would stretch the page. */}
      <div className="sr-only">
        <table>
          <caption>Candidatures et candidats retenus par jour</caption>
          <thead>
            <tr>
              <th>Jour</th>
              <th>Candidatures</th>
              <th>Retenus</th>
            </tr>
          </thead>
          <tbody>
            {series.map((d) => (
              <tr key={d.date}>
                <td>{shortDay(d.date)}</td>
                <td>{d.applications}</td>
                <td>{d.hires}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** A day's figures, in the dashboard's own popover. */
function DayTooltip(props: CalendarTooltipProps) {
  const { day, value } = props;
  const applications = Number(value) || 0;
  const hires = (props as unknown as { hires?: number }).hires ?? 0;
  return (
    <div className="w-max rounded-xl bg-popover px-3 py-2 text-popover-foreground text-sm shadow-soft">
      <p className="font-medium">{shortDay(day)}</p>
      <p className="text-muted-foreground">{plural(applications, "candidature")}</p>
      <p className="text-muted-foreground">{plural(hires, "retenu")}</p>
    </div>
  );
}
