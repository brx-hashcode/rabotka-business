/**
 * « de » before a name, elided before a vowel: « de Pro », « d'Essentiel E2E ».
 * A plan's name is the admin's, so it is read as written (no h rule).
 */
export function de(name: string): string {
  return startsWithVowel(name) ? `d'${name}` : `de ${name}`;
}

/** For messages that elide: `{elision, select, vowel {d'…} other {de …}}`. */
export function startsWithVowel(name: string): boolean {
  return /^[aeiouyàâäéèêëîïôöùûü]/i.test(name.trim());
}
