"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { sourceLabel } from "#/features/careers/candidate-source";
import { INTL_LOCALE } from "#/i18n/config";
import type { BusinessStats } from "#/lib/api/types";
import { cn } from "#/lib/utils";

type Source = NonNullable<BusinessStats["sources"]>[number];

/** Slices drawn; the rest folds into « Autres » rather than taking a ninth hue. */
const MAX_SLICES = 5;

/**
 * A source keeps its colour whatever its rank, so « Lien direct » is the same
 * blue this week and next. Sources the app names get a slot each; any other
 * (a referrer: google, linkedin…) takes the next free one.
 */
const KNOWN_SLOT: Record<string, number> = {
  direct: 1,
  carrieres: 2,
  "import-device": 3,
  "import-gmail": 4,
  agent: 5,
  qr: 6,
};
const SERIES_SLOTS = 8;
const OTHER = "__other__";

type Slice = Source & { color: string; label: string };

function slicesOf(sources: Source[], label: (s: string) => string, otherLabel: string): Slice[] {
  const sorted = [...sources].filter((s) => s.received > 0).sort((a, b) => b.received - a.received);
  const shown = sorted.slice(0, MAX_SLICES);
  const rest = sorted.slice(MAX_SLICES);
  const taken = new Set(shown.map((s) => KNOWN_SLOT[s.source]).filter(Boolean));
  let next = 1;
  const freeSlot = () => {
    while (taken.has(next) || Object.values(KNOWN_SLOT).includes(next)) next++;
    taken.add(next);
    return next <= SERIES_SLOTS ? next : null;
  };
  const slices: Slice[] = shown.map((s) => {
    const slot = KNOWN_SLOT[s.source] ?? freeSlot();
    return { ...s, label: label(s.source), color: slot ? `var(--series-${slot})` : "var(--muted-foreground)" };
  });
  if (rest.length > 0) {
    slices.push({
      source: OTHER,
      label: otherLabel,
      received: rest.reduce((n, s) => n + s.received, 0),
      hired: rest.reduce((n, s) => n + s.hired, 0),
      color: "var(--muted-foreground)",
    });
  }
  return slices;
}

const SIZE = 168;
const STROKE = 22;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
/** The surface gap between two slices, in px along the ring. */
const GAP = 2;

/**
 * « Provenance » as a donut: each source's share of the period's
 * applications, the total in the middle, and beside it a legend that gives
 * every figure, so nothing is read from the colours alone. Hovering a slice
 * or its legend row puts that source in the middle.
 */
export function SourcesDonut({ sources }: Readonly<{ sources: Source[] }>) {
  const t = useTranslations("home.sources");
  const tLabels = useTranslations("labels");
  const locale = useLocale();
  const pct = new Intl.NumberFormat(INTL_LOCALE[locale as keyof typeof INTL_LOCALE], { style: "percent", maximumFractionDigits: 0 });
  const slices = slicesOf(sources, (s) => sourceLabel(s, tLabels), t("other"));
  const total = slices.reduce((n, s) => n + s.received, 0);
  const [active, setActive] = useState<string | null>(null);
  const focused = slices.find((s) => s.source === active) ?? null;

  // Each slice starts where the ones before it end.
  const lengths = slices.map((s) => (s.received / total) * C);
  const arcs = slices.map((s, i) => ({
    ...s,
    dash: Math.max(0, lengths[i] - (slices.length > 1 ? GAP : 0)),
    offset: lengths.slice(0, i).reduce((sum, l) => sum + l, 0),
  }));

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={t("chartLabel", { total })}
          className="-rotate-90"
        >
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="var(--page)" strokeWidth={STROKE} />
          {arcs.map((a) => (
            <circle
              key={a.source}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={a.color}
              strokeWidth={active === a.source ? STROKE + 6 : STROKE}
              strokeDasharray={`${a.dash} ${C - a.dash}`}
              strokeDashoffset={-a.offset}
              opacity={active && active !== a.source ? 0.35 : 1}
              className="cursor-pointer transition-[opacity,stroke-width] duration-150"
              onMouseEnter={() => setActive(a.source)}
              onMouseLeave={() => setActive(null)}
            >
              <title>{`${a.label} : ${a.received} · ${pct.format(a.received / total)}`}</title>
            </circle>
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
          <span className="font-semibold text-2xl tabular-nums leading-none">
            {focused ? focused.received : total}
          </span>
          <span className="mt-1 line-clamp-2 text-muted-foreground text-xs leading-tight">
            {focused ? `${focused.label} · ${pct.format(focused.received / total)}` : t("total", { count: total })}
          </span>
        </div>
      </div>

      <ul className="w-full min-w-0 space-y-2.5">
        {slices.map((s) => (
          <li
            key={s.source}
            onMouseEnter={() => setActive(s.source)}
            onMouseLeave={() => setActive(null)}
            className={cn(
              "flex items-center gap-2.5 text-sm transition-opacity",
              active && active !== s.source && "opacity-50",
            )}
          >
            <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="min-w-0 flex-1 truncate font-medium">{s.label}</span>
            <span className="shrink-0 tabular-nums">
              {s.received}
              <span className="text-muted-foreground"> · {pct.format(s.received / total)}</span>
            </span>
            {/* Always there, empty or not, so every row's figures line up. */}
            {slices.some((x) => x.hired > 0) && (
              <span className="hidden w-16 shrink-0 text-right text-muted-foreground text-xs sm:inline">
                {s.hired > 0 ? t("hired", { count: s.hired }) : ""}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
