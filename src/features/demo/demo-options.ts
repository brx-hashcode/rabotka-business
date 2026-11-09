/** The sign-up headcount brackets (backend BUSINESS_SIZES). */
export const DEMO_SIZES = ["1-5", "6-20", "21-100", "100+"] as const;

/** What to see in the demo (backend DEMO_INTERESTS), in the site's words. */
export const DEMO_INTERESTS = [
  { value: "analyse-cv", label: "Analyse de CV" },
  { value: "offres-candidatures", label: "Offres et suivi des candidatures" },
  { value: "entretiens", label: "Entretiens" },
  { value: "missions", label: "Missions et contrats" },
  { value: "trouver-des-profils", label: "Recherche de profils" },
  { value: "equipe", label: "Recrutement en équipe" },
] as const;
