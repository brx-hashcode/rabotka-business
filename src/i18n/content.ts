import { createTranslator } from "next-intl";

import type { Locale } from "./config";
import enCareersEditor from "./messages/en/careersEditor.json";
import enLabels from "./messages/en/labels.json";
import enOffers from "./messages/en/offers.json";
import frCareersEditor from "./messages/fr/careersEditor.json";
import frLabels from "./messages/fr/labels.json";
import frOffers from "./messages/fr/offers.json";

/**
 * What a business writes for candidates (a refusal, an offer's questions, a
 * LinkedIn post) is in the language of the job, not the language its own
 * screen happens to be in: an English job gets English words whoever reads
 * the space in French, and the reverse. The server decides the same way for
 * what the AI writes (rabotka-backend, business/output-language.ts).
 */

const ENGLISH = new Set(
  "the you your how what can do does want need find work job hire help please where when why is are my we and with for our will have has this that of to in on at as be an who which experience team role".split(" "),
);
const FRENCH = new Set(
  "le la les je vous tu est et un une des du de au aux comment pourquoi quoi que qui pour avec dans sur mon ma mes votre vos nous notre nos travail mission poste sont ont en ce cette ces il elle ou".split(" "),
);

/** The language a text shows, or null when it shows neither (a title, a name, a number). */
export function detectLocale(text: string | null | undefined): Locale | null {
  if (!text?.trim()) return null;
  const words = text.toLowerCase().match(/[a-zà-ÿœ]+/g) ?? [];
  const en = words.filter((w) => ENGLISH.has(w)).length;
  const fr = words.filter((w) => FRENCH.has(w)).length;
  if (en !== fr) return en > fr ? "en" : "fr";
  // No word tells, or a tie: an accent or French punctuation (« ? » after a space) is French.
  return /[àâçéèêëîïôûùœ]/i.test(text) || /\s[?!:;]/.test(text) ? "fr" : null;
}

/** The language of the first text that shows one; `fallback` (French, or the reader's) otherwise. */
export function contentLocale(texts: (string | null | undefined)[], fallback: Locale = "fr"): Locale {
  for (const text of texts) {
    const locale = detectLocale(text);
    if (locale) return locale;
  }
  return fallback;
}

const CONTENT = {
  fr: { offers: frOffers, labels: frLabels, careersEditor: frCareersEditor },
  en: { offers: enOffers, labels: enLabels, careersEditor: enCareersEditor },
} as const;

/** The messages written into what candidates read, in a given language, whatever the page's. */
export function contentMessages(locale: Locale) {
  const messages = CONTENT[locale];
  return {
    offers: createTranslator({ locale, messages, namespace: "offers" }),
    labels: createTranslator({ locale, messages, namespace: "labels" }),
    careersEditor: createTranslator({ locale, messages, namespace: "careersEditor" }),
  };
}
