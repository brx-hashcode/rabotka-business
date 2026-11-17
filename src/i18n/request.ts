import { headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { DEFAULT_LOCALE, isLocale, LOCALE_HEADER } from "./config";
import { MESSAGES } from "./messages";

/**
 * The request's language, as src/proxy.ts decided it (the proxy always
 * overwrites the header, so a client cannot choose it by sending one).
 */
export default getRequestConfig(async () => {
  const value = (await headers()).get(LOCALE_HEADER);
  const locale = isLocale(value) ? value : DEFAULT_LOCALE;
  return { locale, messages: MESSAGES[locale] };
});
