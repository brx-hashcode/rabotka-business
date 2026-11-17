"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useLocale } from "next-intl";

import type { Locale } from "#/i18n/config";
import { contentLocale } from "#/i18n/content";

const OfferLanguage = createContext<Locale | null>(null);

/**
 * The language of the offer on screen, for what is written to its candidates
 * (a refusal's ready words): the offer's own language, as its text shows;
 * the reader's when it shows none.
 */
export function OfferLanguageProvider({
  offer,
  children,
}: Readonly<{ offer: { title: string; description: string | null } | undefined; children: ReactNode }>) {
  const reader = useLocale() as Locale;
  return <OfferLanguage.Provider value={contentLocale([offer?.description, offer?.title], reader)}>{children}</OfferLanguage.Provider>;
}

/** Outside an offer's page (all applications, missions): the reader's language. */
export function useOfferLanguage(): Locale {
  const reader = useLocale() as Locale;
  return useContext(OfferLanguage) ?? reader;
}
