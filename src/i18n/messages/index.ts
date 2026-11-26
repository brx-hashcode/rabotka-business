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
import enInterviews from "./en/interviews.json";
import enCv from "./en/cv.json";
import enTalents from "./en/talents.json";
import enCandidates from "./en/candidates.json";
import enTeam from "./en/team.json";
import enOrganisation from "./en/organisation.json";
import enSubscription from "./en/subscription.json";
import enClaims from "./en/claims.json";
import enCareersEditor from "./en/careersEditor.json";
import enCareers from "./en/careers.json";
import enDiscussions from "./en/discussions.json";
import enPages from "./en/pages.json";
import enUi from "./en/ui.json";
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
import frInterviews from "./fr/interviews.json";
import frCv from "./fr/cv.json";
import frTalents from "./fr/talents.json";
import frCandidates from "./fr/candidates.json";
import frTeam from "./fr/team.json";
import frOrganisation from "./fr/organisation.json";
import frSubscription from "./fr/subscription.json";
import frClaims from "./fr/claims.json";
import frCareersEditor from "./fr/careersEditor.json";
import frCareers from "./fr/careers.json";
import frDiscussions from "./fr/discussions.json";
import frPages from "./fr/pages.json";
import frUi from "./fr/ui.json";
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
  interviews: frInterviews,
  cv: frCv,
  talents: frTalents,
  candidates: frCandidates,
  team: frTeam,
  organisation: frOrganisation,
  subscription: frSubscription,
  claims: frClaims,
  careersEditor: frCareersEditor,
  careers: frCareers,
  discussions: frDiscussions,
  pages: frPages,
  ui: frUi,
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
    interviews: enInterviews,
    cv: enCv,
    talents: enTalents,
    candidates: enCandidates,
    team: enTeam,
    organisation: enOrganisation,
    subscription: enSubscription,
    claims: enClaims,
    careersEditor: enCareersEditor,
    careers: enCareers,
    discussions: enDiscussions,
    pages: enPages,
    ui: enUi,
    site: enSite,
    siteCopy: enSiteCopy as typeof frSiteCopy,
  },
};
