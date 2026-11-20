"use client";

import { useMemo } from "react";
import { ResponsiveBar, type BarDatum, type BarTooltipProps } from "@nivo/bar";
import { useTheme } from "next-themes";

import { parseChartSpec, type ChartSpec } from "../chart-spec";

/** One colour per series, the site's: green first, then ink, lime, blue, amber. */
const PALETTE = {
  light: { series: ["#1f8a4c", "#0b0f0c", "#9be15d", "#5b8def", "#f2a33a"], text: "#5b6660", grid: "#e7ebe8" },
  dark: { series: ["#4cc27a", "#e8efe9", "#cbffa5", "#7ea6ff", "#f5b65a"], text: "#a3ada7", grid: "#2a302c" },
} as const;

/**
 * A chart in an answer, drawn from the ```rabotka-chart block the server
 * wrote. While the block is still arriving (or is not one this portal knows),
 * nothing is drawn. The numbers are also in a table for screen readers.
 */
export function AnswerChart({ source }: Readonly<{ source: string }>) {
  const spec = useMemo(() => parseChartSpec(source), [source]);
  if (!spec) return null;
  return <Chart spec={spec} />;
}

function Chart({ spec }: Readonly<{ spec: ChartSpec }>) {
  const { resolvedTheme } = useTheme();
  const palette = PALETTE[resolvedTheme === "dark" ? "dark" : "light"];
  const horizontal = spec.layout === "horizontal";
  const keys = spec.series.map((s) => s.name);

  // nivo wants one row per category, a field per series; a missing value is no bar.
  // Across, it draws the first row at the bottom: reversed, the best stays on top.
  const data = useMemo<BarDatum[]>(() => {
    const rows = spec.categories.map((category, i) => {
      const row: BarDatum = { category };
      for (const s of spec.series) {
        const v = s.values[i];
        if (v !== null && v !== undefined) row[s.name] = v;
      }
      return row;
    });
    return horizontal ? rows.reverse() : rows;
  }, [spec, horizontal]);
  const max = Math.max(1, ...spec.series.flatMap((s) => s.values.filter((v): v is number => v !== null)));
  const height = horizontal ? Math.max(120, spec.categories.length * 44 + 40) : 260;
  const colors = (bar: { id: string | number }) => palette.series[keys.indexOf(String(bar.id)) % palette.series.length];

  return (
    <figure className="my-3 rounded-2xl bg-page/70 p-4">
      <figcaption className="mb-2 font-semibold text-sm">{spec.title}</figcaption>
      <div role="img" aria-label={spec.title} style={{ height }}>
        <ResponsiveBar
          data={data}
          keys={keys}
          indexBy="category"
          layout={horizontal ? "horizontal" : "vertical"}
          groupMode="grouped"
          valueScale={{ type: "linear", min: 0, max: spec.unit === "/100" ? 100 : Math.ceil(max * 1.1) }}
          indexScale={{ type: "band", round: true }}
          padding={horizontal ? 0.35 : 0.25}
          innerPadding={2}
          borderRadius={4}
          colors={colors}
          margin={horizontal ? { top: 4, right: 16, bottom: 24, left: 120 } : { top: 8, right: 8, bottom: 40, left: 36 }}
          axisLeft={horizontal ? { tickSize: 0, tickPadding: 8, truncateTickAt: 18 } : { tickSize: 0, tickPadding: 6, tickValues: 5 }}
          axisBottom={horizontal ? { tickSize: 0, tickPadding: 6, tickValues: 5 } : { tickSize: 0, tickPadding: 8, truncateTickAt: 14 }}
          enableGridX={horizontal}
          enableGridY={!horizontal}
          labelSkipWidth={22}
          labelSkipHeight={14}
          labelTextColor={(d) => (keys.indexOf(String(d.data.id)) === 1 && resolvedTheme !== "dark" ? "#ffffff" : "#0b0f0c")}
          theme={{
            text: { fill: palette.text, fontSize: 12, fontFamily: "inherit" },
            grid: { line: { stroke: palette.grid } },
            labels: { text: { fontWeight: 600, fontSize: 11 } },
            tooltip: { container: { background: "transparent", boxShadow: "none", padding: 0 } },
          }}
          tooltip={(props) => <BarTip {...props} named={keys.length > 1} unit={spec.unit} />}
          animate={false}
          role="presentation"
        />
      </div>
      {keys.length > 1 && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs">
          {keys.map((k, i) => (
            <li key={k} className="flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-full" style={{ background: palette.series[i % palette.series.length] }} />
              {k}
            </li>
          ))}
        </ul>
      )}
      <table className="sr-only">
        <caption>{spec.title}</caption>
        <thead>
          <tr>
            <th />
            {keys.map((k) => (
              <th key={k}>{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {spec.categories.map((c, i) => (
            <tr key={c}>
              <th>{c}</th>
              {spec.series.map((s) => (
                <td key={s.name}>{s.values[i] === null ? "—" : `${s.values[i]}${spec.unit}`}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** One bar's value, on hover: the series (when there are several), the category, the value and its unit. */
function BarTip({ id, value, indexValue, color, named, unit }: BarTooltipProps<BarDatum> & { named: boolean; unit: string }) {
  return (
    <span className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 text-foreground text-xs shadow-soft">
      <span aria-hidden className="size-2.5 rounded-full" style={{ background: color }} />
      {named ? `${id} · ` : ""}
      {indexValue} : <strong className="tabular-nums">{value}</strong>
      {unit && <span className="text-muted-foreground">{unit}</span>}
    </span>
  );
}
