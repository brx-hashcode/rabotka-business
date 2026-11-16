/**
 * The business sign-up, step by step. Each step's words are in
 * signUp.steps.<id> (src/i18n/messages): `label` in the progress bar, and
 * `kicker`, `title`, `text` on the ink card of the sign-up's card wall while
 * the step is open (features/auth/components/auth-shell.tsx).
 */
export const STEPS = [
  { id: "account" },
  { id: "verify" },
  { id: "organisation" },
  { id: "documents" },
  { id: "review" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];
