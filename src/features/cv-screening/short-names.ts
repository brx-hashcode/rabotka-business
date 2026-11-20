/**
 * Candidates' names, short enough for a chip but never ambiguous: « Glody M. »,
 * and more of the name when two short forms would read the same (« Fariol
 * Blondeau N. » and « Fariol Blondeau NZIODZIAMI » keep their whole names).
 * Same order as given.
 */
export function shortNames(names: string[]): string[] {
  const words = names.map((n) => n.trim().split(/\s+/).filter(Boolean));
  const initial = (w: string) => `${w.charAt(0).toUpperCase()}.`;
  // From shortest to fullest; each name takes the first that no other name shares.
  const forms = (w: string[]): string[] =>
    w.length < 2
      ? [w.join(" ")]
      : [`${w[0]} ${initial(w[w.length - 1])}`, [w[0], ...w.slice(1).map(initial)].join(" "), w.join(" ")];
  const all = words.map(forms);
  return all.map((own, i) => {
    for (let level = 0; level < own.length; level++) {
      const clash = all.some((other, j) => j !== i && (other[Math.min(level, other.length - 1)] === own[level]));
      if (!clash) return own[level];
    }
    return own[own.length - 1];
  });
}
