import type { Locale as DateFnsLocale } from "date-fns";
import { enGB, fr } from "date-fns/locale";

import type { Locale } from "./config";

/** date-fns's own words for each language (British English, as INTL_LOCALE). */
export const DATE_FNS_LOCALE: Record<Locale, DateFnsLocale> = { fr, en: enGB };
