/**
 * The business sign-up, step by step. `kicker`, `title` and `text` are what the
 * ink card of the sign-up's card wall says while the step is open
 * (features/auth/components/auth-shell.tsx).
 */
export const STEPS = [
  {
    id: "account",
    label: "Compte",
    kicker: "Responsable du compte",
    title: "La personne qui pilotera vos recrutements",
    text: "Le compte entreprise est rattaché à une personne : c'est elle qui se connecte, publie les offres et échange avec les candidats.",
  },
  {
    id: "verify",
    label: "Vérification",
    kicker: "Sécurité",
    title: "Votre adresse professionnelle, confirmée",
    text: "Un code à usage unique garantit que l'adresse e-mail vous appartient. C'est aussi ainsi que vous vous connecterez : sans mot de passe.",
  },
  {
    id: "organisation",
    label: "Organisation",
    kicker: "Votre organisation",
    title: "Présentez votre structure aux candidats",
    text: "Raison sociale, statut juridique, identifiants officiels : ces informations figurent sur votre profil et servent à la vérification.",
  },
  {
    id: "documents",
    label: "Documents",
    kicker: "Conformité",
    title: "Les pièces qui authentifient votre organisation",
    text: "Les documents demandés dépendent de votre statut. Ils sont conservés de manière confidentielle et examinés par nos équipes uniquement.",
  },
  {
    id: "review",
    label: "Validation",
    kicker: "Dernière étape",
    title: "Vérifiez, validez, commencez à recruter",
    text: "Relisez vos informations avant l'envoi. Votre compte est activé dès que nos équipes ont validé votre organisation.",
  },
] as const;

export type StepId = (typeof STEPS)[number]["id"];
