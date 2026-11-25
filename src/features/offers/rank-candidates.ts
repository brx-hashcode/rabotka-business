/** What the offer's ranking reads of a candidate, whichever way they applied. */
export type Rankable = {
  score: number | null;
  /** Requirements known to be missing; none on the previous method. */
  missing?: number;
  a: { knockedOut?: boolean; createdAt: string };
};

/**
 * One order for every candidate of an offer, Rabotka or careers page: those
 * who fail an « éliminatoire » last, then those who miss the fewest of the
 * offer's requirements, the best score, then those not scored yet, newest first.
 */
export function byFit(x: Rankable, y: Rankable): number {
  if (!!x.a.knockedOut !== !!y.a.knockedOut) return x.a.knockedOut ? 1 : -1;
  return (x.missing ?? 0) - (y.missing ?? 0) || (y.score ?? -1) - (x.score ?? -1) || y.a.createdAt.localeCompare(x.a.createdAt);
}
