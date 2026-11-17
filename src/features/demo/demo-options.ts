/** The sign-up headcount brackets (backend BUSINESS_SIZES). */
export const DEMO_SIZES = ["1-5", "6-20", "21-100", "100+"] as const;

/** What to see in the demo (backend DEMO_INTERESTS); their names are the `interestOptions` messages. */
export const DEMO_INTERESTS = [
  { value: "analyse-cv" },
  { value: "offres-candidatures" },
  { value: "entretiens" },
  { value: "missions" },
  { value: "trouver-des-profils" },
  { value: "equipe" },
] as const;
