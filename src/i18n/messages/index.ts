import type { Locale } from "../config";

import enAuth from "./en/auth.json";
import enCommon from "./en/common.json";
import enLayout from "./en/layout.json";
import enSignUp from "./en/signUp.json";
import frAuth from "./fr/auth.json";
import frCommon from "./fr/common.json";
import frLayout from "./fr/layout.json";
import frSignUp from "./fr/signUp.json";

/**
 * Every message, one namespace per file and per feature (`common`, `offers`,
 * `interviews`…). French is the source and gives the keys their type
 * (src/i18n/global.d.ts); messages.test.ts keeps English key for key.
 * A new namespace is a file in fr/ and en/, imported and listed below.
 */
const fr = {
  auth: frAuth,
  common: frCommon,
  layout: frLayout,
  signUp: frSignUp,
};

export type Messages = typeof fr;

export const MESSAGES: Record<Locale, Messages> = {
  fr,
  en: {
    auth: enAuth,
    common: enCommon,
    layout: enLayout,
    signUp: enSignUp,
  },
};
