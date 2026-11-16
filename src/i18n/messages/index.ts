import type { Locale } from "../config";

import enCommon from "./en/common.json";
import frCommon from "./fr/common.json";

/**
 * Every message, one namespace per file and per feature (`common`, `offers`,
 * `interviews`…). French is the source and gives the keys their type
 * (src/i18n/global.d.ts); messages.test.ts keeps English key for key.
 * A new namespace is a file in fr/ and en/, imported and listed below.
 */
const fr = {
  common: frCommon,
};

export type Messages = typeof fr;

export const MESSAGES: Record<Locale, Messages> = {
  fr,
  en: {
    common: enCommon,
  },
};
