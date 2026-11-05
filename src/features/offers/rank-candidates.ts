/** What the offer's ranking reads of a candidate, whichever way they applied. */
export type Rankable = { score: number | null; a: { knockedOut?: boolean; createdAt: string } };

/**
 * One order for every candidate of an offer, Rabotka or careers page: those
 * who fail an « éliminatoire » last, then the best score first, then those not
 * scored yet, newest first.
 */
export function byFit(x: Rankable, y: Rankable): number {
  if (!!x.a.knockedOut !== !!y.a.knockedOut) return x.a.knockedOut ? 1 : -1;
  return (y.score ?? -1) - (x.score ?? -1) || y.a.createdAt.localeCompare(x.a.createdAt);
}
