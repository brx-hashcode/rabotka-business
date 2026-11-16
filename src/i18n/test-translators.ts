import { createTranslator } from "next-intl";

import type { Locale } from "./config";
import { MESSAGES } from "./messages";

/** The `labels` translator in a language, for tests of pure helpers. */
export const labelsIn = (locale: Locale) => createTranslator({ locale, messages: MESSAGES[locale], namespace: "labels" });
