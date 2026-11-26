import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";

import { isLocale, type Locale } from "#/i18n/config";
import { MESSAGES } from "#/i18n/messages";

/** The namespaces the offer and apply pages use (and the shared bits they render). */
const PAGE_NAMESPACES = new Set(["careers", "common", "labels", "ui"]);

/**
 * One offer's pages speak the offer's language, not the visitor's: an offer
 * written in English got « Postuler à cette offre » under English text. The
 * candidate reads the offer, so its buttons and form follow it.
 *
 * Unknown language (an older backend, the offer not read): the request's own,
 * as the rest of the site.
 */
export function OfferLanguage({ language, children }: Readonly<{ language: string | undefined; children: ReactNode }>) {
  if (!isLocale(language)) return <>{children}</>;
  const locale: Locale = language;
  // Only what these pages read: the root layout already sends the whole site's
  // copy in the visitor's language, and a second full set doubled the page.
  const messages = Object.fromEntries(Object.entries(MESSAGES[locale]).filter(([namespace]) => PAGE_NAMESPACES.has(namespace)));
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div lang={locale}>{children}</div>
    </NextIntlClientProvider>
  );
}
