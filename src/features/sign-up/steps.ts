/**
 * The business sign-up, step by step. Each step has its own photo on the left
 * panel, chosen for what the step asks (public/media, sources in
 * features/landing/content.ts; verification is Unsplash 1573166953836).
 */
export const STEPS = [
  {
    id: "account",
    label: "Compte",
    kicker: "Responsable du compte",
    title: "La personne qui pilotera vos recrutements",
    text: "Le compte entreprise est rattaché à une personne : c'est elle qui se connecte, publie les offres et échange avec les candidats.",
    photo: "/media/interview-room.jpg",
    // The panel is tall and the photo wide: keep the right of the table, so
    // no face sits behind the step list.
    focus: "78% center",
  },
  {
    id: "verify",
    label: "Vérification",
    kicker: "Sécurité",
    title: "Votre adresse professionnelle, confirmée",
    text: "Un code à usage unique garantit que l'adresse e-mail vous appartient. C'est aussi ainsi que vous vous connecterez : sans mot de passe.",
    photo: "/media/verification.jpg",
  },
  {
    id: "organisation",
    label: "Organisation",
    kicker: "Votre organisation",
    title: "Présentez votre structure aux candidats",
    text: "Raison sociale, statut juridique, identifiants officiels : ces informations figurent sur votre profil et servent à la vérification.",
    photo: "/media/boardroom.jpg",
  },
  {
    id: "documents",
    label: "Documents",
    kicker: "Conformité",
    title: "Les pièces qui authentifient votre organisation",
    text: "Les documents demandés dépendent de votre statut. Ils sont conservés de manière confidentielle et examinés par nos équipes uniquement.",
    photo: "/media/compliance-officer.jpg",
  },
  {
    id: "review",
    label: "Validation",
    kicker: "Dernière étape",
    title: "Vérifiez, validez, commencez à recruter",
    text: "Relisez vos informations avant l'envoi. Votre compte est activé dès que nos équipes ont validé votre organisation.",
    photo: "/media/interview.jpg",
  },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

export const DONE_PHOTO = "/media/meeting-table.jpg";
