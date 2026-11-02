/**
 * The one host search engines may list. Only production answers on it, so
 * develop and every preview stay out of Google with nothing to configure.
 */
export const INDEXED_HOST = "business.rabotka.work";

export function isIndexedHost(host: string | null | undefined): boolean {
  return (host ?? "").split(":")[0].toLowerCase() === INDEXED_HOST;
}

export const NOINDEX = { index: false, follow: false } as const;
