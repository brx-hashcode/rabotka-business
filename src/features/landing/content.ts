import {
  IconBriefcase,
  IconBuildingBank,
  IconBuildingStore,
  IconCertificate,
  IconHeartHandshake,
  IconSchool,
  IconShieldCheck,
  IconSparkles,
  IconUsersGroup,
  type Icon,
} from "@tabler/icons-react";

/**
 * Landing copy in one place. What Rabotka does today, nothing it does not:
 * no figures (fees are runtime config, and stats would need a source), no
 * testimonials until a real customer gives one.
 */

export const SIGN_UP_HREF = "/auth/sign-up";
export const SIGN_IN_HREF = "/auth/sign-in";
export const PUBLIC_SITE = "https://www.rabotka.work";

export type NavLink = { href: string; label: string; description?: string };

export const SOLUTION_LINKS: NavLink[] = [
  {
    href: "#publier",
    label: "Publier une offre",
    description: "Mission, CDD, CDI ou stage, en quelques minutes.",
  },
  {
    href: "#profils",
    label: "Profils suggérés",
    description: "Les travailleurs qui correspondent à votre besoin.",
  },
  {
    href: "#agents",
    label: "Recrutement accompagné",
    description: "Des agents Rabotka mobilisent les candidats sur le terrain.",
  },
  {
    href: "#verification",
    label: "Organisation vérifiée",
    description: "Vos documents contrôlés, un badge de confiance.",
  },
];

export const AUDIENCE_LINKS: NavLink[] = [
  { href: "#pour-qui", label: "PME, TPE et commerces" },
  { href: "#pour-qui", label: "Écoles et centres de formation" },
  { href: "#pour-qui", label: "ONG et associations" },
  { href: "#pour-qui", label: "Administrations et entreprises publiques" },
];

export const HELP_LINKS: NavLink[] = [
  { href: "#comment", label: "Comment ça marche" },
  { href: "#contact", label: "Nous contacter" },
  { href: PUBLIC_SITE, label: "www.rabotka.work" },
];

/** The two paths under the hero, as « occasional » and « regular » hiring. */
export const HIRING_PATHS = [
  {
    kicker: "Besoin ponctuel",
    title: "Une mission, un renfort",
    text: "Un chantier, un événement, un remplacement : publiez la mission et recevez des candidats disponibles près de chez vous.",
    cta: "Publier une mission",
  },
  {
    kicker: "Recrutements réguliers",
    title: "Constituez vos équipes",
    text: "CDD, CDI, stages : gérez toutes vos offres depuis un seul espace et retrouvez les profils qui vous intéressent.",
    cta: "Créer mon espace",
  },
];

export type Solution = {
  id: string;
  kicker: string;
  title: string;
  text: string;
  points: string[];
  photo: string;
  icon: Icon;
};

export const SOLUTIONS: Solution[] = [
  {
    id: "publier",
    kicker: "Offres d'emploi",
    title: "Publiez vos offres là où sont les travailleurs",
    text: "Vos offres sont proposées aux travailleurs de votre ville, jusque sur WhatsApp, l'application qu'ils utilisent déjà.",
    points: [
      "Mission, CDD, CDI ou stage",
      "Par ville et par métier",
      "Vos offres et leurs candidats au même endroit",
    ],
    photo: "/sign-in/craftsman.jpg",
    icon: IconBriefcase,
  },
  {
    id: "profils",
    kicker: "Mise en relation",
    title: "Les bons profils, suggérés pour chaque offre",
    text: "Rabotka rapproche votre offre des travailleurs dont le métier, l'expérience et la ville correspondent, pour que vous commenciez par les meilleurs.",
    points: [
      "Profils classés selon votre besoin",
      "Identité des travailleurs vérifiée",
      "Contact direct une fois la mise en relation acceptée",
    ],
    photo: "/sign-in/seamstresses.jpg",
    icon: IconSparkles,
  },
  {
    id: "agents",
    kicker: "Recrutement accompagné",
    title: "Des agents sur le terrain, pour vous",
    text: "Dans votre ville, des agents Rabotka appellent et mobilisent les travailleurs adaptés à vos offres — y compris ceux qui ne sont pas encore en ligne.",
    points: [
      "Des candidats contactés pour vous",
      "Un relais local qui connaît le terrain",
      "Vous gardez la décision finale",
    ],
    photo: "/sign-in/cook.jpg",
    icon: IconUsersGroup,
  },
  {
    id: "verification",
    kicker: "Confiance",
    title: "Une organisation vérifiée par Rabotka",
    text: "Vos documents (RCCM, NIU, agrément, récépissé…) sont contrôlés par notre équipe. Les travailleurs savent à qui ils ont affaire.",
    points: [
      "Les pièces adaptées à votre type d'organisation",
      "Documents conservés de façon privée",
      "Un compte activé dès la validation",
    ],
    photo: "/sign-in/weaver.jpg",
    icon: IconShieldCheck,
  },
];

export const STEPS = [
  {
    title: "Créez votre espace",
    text: "Avec l'adresse email de votre organisation : un code vous est envoyé, sans mot de passe.",
  },
  {
    title: "Faites vérifier votre organisation",
    text: "Indiquez votre type d'organisation et joignez ses documents. Notre équipe les valide.",
  },
  {
    title: "Publiez et recrutez",
    text: "Publiez vos offres, consultez les profils suggérés et contactez les candidats retenus.",
  },
];

export type Audience = { title: string; text: string; icon: Icon };

export const AUDIENCES: Audience[] = [
  {
    title: "PME, TPE et commerces",
    text: "Boulangeries, ateliers, boutiques, entreprises de service : du renfort ponctuel à l'embauche.",
    icon: IconBuildingStore,
  },
  {
    title: "Écoles et formation",
    text: "Écoles privées, universités, centres de formation : enseignants, encadrement, personnel d'appui.",
    icon: IconSchool,
  },
  {
    title: "ONG et associations",
    text: "Équipes de projet, agents de terrain, missions courtes : recrutez localement.",
    icon: IconHeartHandshake,
  },
  {
    title: "Administrations",
    text: "Ministères, mairies, établissements publics : des profils qualifiés, des démarches suivies.",
    icon: IconBuildingBank,
  },
  {
    title: "Santé",
    text: "Cliniques, pharmacies, laboratoires : personnel soignant et d'accueil.",
    icon: IconCertificate,
  },
];

export const FAQ = [
  {
    q: "Quels types d'organisations peuvent s'inscrire ?",
    a: "Entreprises de toute taille, startups, coopératives, écoles, centres de formation, ONG, associations, confessions religieuses, structures de santé, administrations et organisations internationales.",
  },
  {
    q: "Quels documents dois-je fournir ?",
    a: "Cela dépend de votre organisation : RCCM et NIU pour une entreprise, récépissé et statuts pour une association, autorisation d'ouverture ou agrément pour une école… Le formulaire vous indique exactement lesquels.",
  },
  {
    q: "Combien de temps prend la vérification ?",
    a: "Notre équipe examine vos documents dès leur réception. Vous êtes prévenu par email dès que votre organisation est validée.",
  },
  {
    q: "Comment se passe la connexion ?",
    a: "Avec l'adresse email de votre compte : vous recevez un code à 6 chiffres à chaque connexion. Pas de mot de passe à retenir.",
  },
];
