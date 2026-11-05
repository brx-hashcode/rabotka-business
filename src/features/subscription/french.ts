/**
 * « de » before a name, elided before a vowel: « de Pro », « d'Essentiel E2E ».
 * A plan's name is the admin's, so it is read as written (no h rule).
 */
export function de(name: string): string {
  return /^[aeiouyàâäéèêëîïôöùûü]/i.test(name.trim()) ? `d'${name}` : `de ${name}`;
}
