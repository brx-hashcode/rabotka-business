import type { Locale } from "../config";

import enAuth from "./en/auth.json";
import enCommon from "./en/common.json";
import enHome from "./en/home.json";
import enLabels from "./en/labels.json";
import enLayout from "./en/layout.json";
import enSignUp from "./en/signUp.json";
import enMissions from "./en/missions.json";
import enOffers from "./en/offers.json";
import enApplications from "./en/applications.json";
import enSite from "./en/site.json";
import enSiteCopy from "./en/siteCopy.json";
import frAuth from "./fr/auth.json";
import frCommon from "./fr/common.json";
import frHome from "./fr/home.json";
import frLabels from "./fr/labels.json";
import frLayout from "./fr/layout.json";
import frSignUp from "./fr/signUp.json";
import frMissions from "./fr/missions.json";
import frOffers from "./fr/offers.json";
import frApplications from "./fr/applications.json";
import frSite from "./fr/site.json";
import frSiteCopy from "./fr/siteCopy.json";

/**
 * Every message, one namespace per file and per feature (`common`, `offers`,
 * `interviews`…). French is the source and gives the keys their type
 * (src/i18n/global.d.ts); messages.test.ts keeps English key for key.
 * A new namespace is a file in fr/ and en/, imported and listed below.
 */
const fr = {
  auth: frAuth,
  common: frCommon,
  home: frHome,
  labels: frLabels,
  layout: frLayout,
  signUp: frSignUp,
  missions: frMissions,
  offers: frOffers,
  applications: frApplications,
  site: frSite,
  siteCopy: frSiteCopy,
};

export type Messages = typeof fr;

export const MESSAGES: Record<Locale, Messages> = {
  fr,
  en: {
    auth: enAuth,
    common: enCommon,
    home: enHome,
    labels: enLabels,
    layout: enLayout,
    signUp: enSignUp,
    missions: enMissions,
    offers: enOffers,
    applications: enApplications,
    site: enSite,
    siteCopy: enSiteCopy as typeof frSiteCopy,
  },
};
