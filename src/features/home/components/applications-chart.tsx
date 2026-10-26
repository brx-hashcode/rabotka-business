"use client";

import { useState } from "react";

import type { BusinessStats } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { shortDay } from "../stats-format";

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

/**
 * Applications received per day over the period: one series, columns from a
 * zero baseline. Hovering (or focusing) a day shows its applications and the
 * hires decided that day; a table says the same to screen readers.
 */
export function ApplicationsChart({ series }: Readonly<{ series: BusinessStats["series"] }>) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...series.map((d) => d.applications));
  // A round top for the scale: the gridline reads as a real value.
  const top = max <= 4 ? max : Math.ceil(max / 2) * 2;
  const ticks = [0, Math.round(top / 2), top];
  const day = active === null ? null : series[active];

  return (
    <div className="space-y-2">
      <div className="relative flex h-56 gap-3">
        <div className="flex flex-col-reverse justify-between pb-0.5 text-right text-muted-foreground text-xs tabular-nums">
          {ticks.map((t) => (
            <span key={t} className="leading-none">
              {t}
            </span>
          ))}
        </div>

        <div className="relative flex-1" onMouseLeave={() => setActive(null)}>
          {ticks.map((t) => (
            <div
              key={t}
              aria-hidden
              className={cn("absolute inset-x-0 border-t", t === 0 ? "border-foreground/20" : "border-foreground/5 border-dashed")}
              style={{ bottom: `${(t / top) * 100}%` }}
            />
          ))}
          <div className={cn("absolute inset-0 flex items-end", series.length > 40 ? "gap-px" : "gap-[2px]")}>
            {series.map((d, i) => (
              <button
                key={d.date}
                type="button"
                aria-label={`${shortDay(d.date)} : ${plural(d.applications, "candidature")}, ${plural(d.hires, "retenu")}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                // The whole column is the hit target, not just the bar.
                className="flex h-full min-w-0 flex-1 items-end outline-none"
              >
                <span
                  className={cn(
                    "w-full rounded-t-[4px] bg-whatsapp-dark transition-opacity",
                    active !== null && active !== i && "opacity-40",
                    d.applications === 0 && "opacity-0",
                  )}
                  style={{ height: `${(d.applications / top) * 100}%` }}
                />
              </button>
            ))}
          </div>

          {day && active !== null && (
            <div
              role="status"
              className="pointer-events-none absolute -top-2 z-10 w-max -translate-x-1/2 -translate-y-full rounded-xl bg-popover px-3 py-2 text-popover-foreground text-sm shadow-soft"
              style={{ left: `clamp(4rem, ${((active + 0.5) / series.length) * 100}%, calc(100% - 4rem))` }}
            >
              <p className="font-medium">{shortDay(day.date)}</p>
              <p className="text-muted-foreground">{plural(day.applications, "candidature")}</p>
              <p className="text-muted-foreground">{plural(day.hires, "retenu")}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between pl-8 text-muted-foreground text-xs">
        <span>{shortDay(series[0].date)}</span>
        <span>{shortDay(series[Math.floor(series.length / 2)].date)}</span>
        <span>{shortDay(series[series.length - 1].date)}</span>
      </div>

      <table className="sr-only">
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
  );
}
