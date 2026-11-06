/**
 * The offer's public page on the careers site, where anyone applies without a
 * Rabotka account. `source` says where the link was shared, so the candidates
 * it brings are counted there (candidate-source.ts reads `?source=`).
 */
export function offerShareUrl(origin: string, slug: string, reference: string, source?: string): string {
  const base = `${origin.replace(/\/$/, "")}/carrieres/${encodeURIComponent(slug)}/${encodeURIComponent(reference)}`;
  return source ? `${base}?source=${encodeURIComponent(source)}` : base;
}

/** Each network's share box, opened on the offer's link (tagged with the network). */
export function offerShareLinks(origin: string, slug: string, reference: string, title: string, whatsappText?: string) {
  const url = (source: string) => offerShareUrl(origin, slug, reference, source);
  return {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url("linkedin"))}`,
    // The offer's details when known, else its title; the link is in the text.
    whatsapp: `https://wa.me/?text=${encodeURIComponent(whatsappText ?? `${title}\n${url("whatsapp")}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url("facebook"))}`,
  };
}
