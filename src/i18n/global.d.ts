import type { Locale } from "./config";
import type { Messages } from "./messages";

// Typed keys and locales for useTranslations / getTranslations.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}
