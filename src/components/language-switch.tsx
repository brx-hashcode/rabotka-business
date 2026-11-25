"use client";

import { useLocale, useTranslations } from "next-intl";

import { LOCALE_PARAM, OFFERED_LOCALES, type Locale } from "#/i18n/config";
import { cn } from "#/lib/utils";

/** The page being read, with `?lang=`: src/proxy.ts saves the choice and reloads it. */
function urlIn(locale: Locale): string {
  const url = new URL(globalThis.location.href);
  url.searchParams.set(LOCALE_PARAM, locale);
  return url.toString();
}

/**
 * FR / EN as a two-segment pill, the current one lit. A full page load, not
 * a client navigation: cached screens and data were fetched in the other
 * language. Hidden while only French is offered.
 */
export function LanguageSwitch({
  tone = "card",
  size = "sm",
  className,
}: Readonly<{ tone?: "card" | "inverse"; size?: "sm" | "lg"; className?: string }>) {
  const current = useLocale();
  const t = useTranslations("common.language");
  if (OFFERED_LOCALES.length < 2) return null;

  return (
    <div
      role="radiogroup"
      aria-label={t("label")}
      className={cn("flex items-center gap-1 rounded-full p-1", tone === "inverse" ? "bg-white/6" : "bg-page", className)}
    >
      {OFFERED_LOCALES.map((locale) => {
        const on = locale === current;
        return (
          <button
            key={locale}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={t(locale)}
            lang={locale}
            onClick={() => {
              if (!on) globalThis.location.assign(urlIn(locale));
            }}
            className={cn(
              "rounded-full font-medium transition-colors",
              size === "sm" ? "px-3 py-1 text-xs uppercase" : "h-10 flex-1 px-4 text-[15px]",
              on && tone === "card" && "bg-selected text-selected-foreground",
              on && tone === "inverse" && "bg-brand-lime text-brand-lime-foreground",
              !on && tone === "card" && "text-muted-foreground hover:text-foreground",
              !on && tone === "inverse" && "text-white/70 hover:text-white",
            )}
          >
            {size === "sm" ? locale : t(locale)}
          </button>
        );
      })}
    </div>
  );
}
