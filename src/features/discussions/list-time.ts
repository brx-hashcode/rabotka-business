import { INTL_LOCALE, type Locale } from "#/i18n/config";

/**
 * WhatsApp's rule, because it is the one this audience already reads without
 * thinking: the time today, "Hier" yesterday, the weekday within the week, a
 * date beyond that.
 */
export function listTime(iso: string | null, locale: Locale, yesterday: string, now: Date = new Date()): string {
  if (!iso) return "";
  const intl = INTL_LOCALE[locale];
  const date = new Date(iso);
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);

  if (days <= 0)
    return date.toLocaleTimeString(intl, { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return yesterday;
  if (days < 7) return date.toLocaleDateString(intl, { weekday: "long" });
  return date.toLocaleDateString(intl, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
