import type { Locale } from "#/i18n/config";

import en from "./en.json";
import fr from "./fr.json";

export type SiteCopy = typeof fr;

/**
 * The public site's long copy (features, feature pages, guides, FAQ), apart
 * from the app's messages so the space never loads it. French is the source;
 * the messages test keeps English key for key.
 */
const COPY: Record<Locale, SiteCopy> = { fr, en: en as SiteCopy };

export function siteCopy(locale: Locale): SiteCopy {
  return COPY[locale];
}

export const SITE_COPY = COPY;
