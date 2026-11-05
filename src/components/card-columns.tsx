"use client";

import { Children, useSyncExternalStore, type ReactNode } from "react";

import { spreadIntoColumns } from "./spread-into-columns";

const TWO_COLUMNS = "(min-width: 48rem)";
const THREE_COLUMNS = "(min-width: 80rem)";

function subscribe(onChange: () => void) {
  const queries = [TWO_COLUMNS, THREE_COLUMNS].map((q) => globalThis.matchMedia(q));
  queries.forEach((q) => q.addEventListener("change", onChange));
  return () => queries.forEach((q) => q.removeEventListener("change", onChange));
}

/**
 * Cards of different heights: each keeps its own, with no blank area to match
 * its row. Real columns rather than CSS `columns`, so opening one card never
 * moves another to a different column. Children are `<li>`.
 */
export function CardColumns({
  children,
  maxColumns = 3,
}: Readonly<{
  children: ReactNode;
  /** Wide cards (a candidate's, with its actions) read better two by two. */
  maxColumns?: 2 | 3;
}>) {
  const fits = useSyncExternalStore(
    subscribe,
    () => {
      if (globalThis.matchMedia(THREE_COLUMNS).matches) return 3;
      return globalThis.matchMedia(TWO_COLUMNS).matches ? 2 : 1;
    },
    () => 1,
  );
  const count = Math.min(fits, maxColumns);

  return (
    <div className="flex items-start gap-4">
      {spreadIntoColumns(Children.toArray(children), count).map((column, i) => (
        <ul key={i} className="flex min-w-0 flex-1 flex-col gap-4">
          {column}
        </ul>
      ))}
    </div>
  );
}
