import {
  IconBuildingBank,
  IconBuildingSkyscraper,
  IconHeartHandshake,
  IconSchool,
  IconStethoscope,
  type Icon,
} from "@tabler/icons-react";

/**
 * Landing copy in one place. What Rabotka does today, nothing it does not:
 * no figures (fees are runtime config, and stats would need a source), no
 * testimonials until a real customer gives one.
 *
 * Photos in public/media come from Unsplash, free licence (no attribution
 * required) — the id after each name, to find the original:
 *   boardroom 1573164574511, team-laptops 1573167101669, interview
 *   1573496267526, meeting-table 1573164574397, manager-office 1758519290996,
 *   candidates-panel 1573497701240, interview-room 1573496130407,
 *   compliance-officer 1653669486816.
 * Office and recruitment scenes only — no informal-sector photos here.
 */

export const SIGN_UP_HREF = "/auth/sign-up";
export const SIGN_IN_HREF = "/auth/sign-in";
export const PUBLIC_SITE = "https://www.rabotka.work";

/** One photo, not a carousel: a manager at work, in an office. */
export const HERO_PHOTO = "/media/manager-office.jpg";

export type NavLink = {
  href: string;
  label: string;
  description?: string;
  /** A thumbnail in the Solutions menu: the solution's own photo on the page. */
  photo?: string;
};

export const SOLUTION_LINKS: NavLink[] = [
  {
    href: "#diffusion",
    label: "Diffusion d'offres",
    description: "Missions, CDD, CDI et stages, publiés en quelques minutes.",
    photo: "/media/team-laptops.jpg",
  },
  {
    href: "#preselection",
    label: "Présélection des candidats",
    description: "Les profils les plus pertinents pour chaque poste, en priorité.",
    photo: "/media/candidates-panel.jpg",
  },
  {
    href: "#accompagnement",
    label: "Recrutement accompagné",
    description: "Un réseau d'agents qui mobilise les candidats sur le terrain.",
    photo: "/media/interview-room.jpg",
  },
  {
    href: "#verification",
    label: "Compte entreprise vérifié",
    description: "Votre organisation authentifiée sur pièces officielles.",
    photo: "/media/compliance-officer.jpg",
  },
];

export const AUDIENCE_LINKS: NavLink[] = [
  { href: "#secteurs", label: "Entreprises, PME et TPE" },
  { href: "#secteurs", label: "Établissements d'enseignement" },
  { href: "#secteurs", label: "ONG et organisations internationales" },
  { href: "#secteurs", label: "Administrations et établissements publics" },
  { href: "#secteurs", label: "Structures de santé" },
];

export const HELP_LINKS: NavLink[] = [
  { href: "#demarche", label: "Notre démarche" },
  { href: "#faq", label: "Questions fréquentes" },
  { href: "#contact", label: "Contacter nos équipes" },
  { href: PUBLIC_SITE, label: "www.rabotka.work" },
];

/** The two paths under the hero, as « occasional » and « continuous » hiring. */
export const HIRING_PATHS = [
  {
    kicker: "Recrutement ponctuel",
    title: "Renforcez vos équipes rapidement",
    text: "Pic d'activité, remplacement, mission de courte durée : publiez votre besoin et mobilisez sans délai des profils disponibles et qualifiés.",
    cta: "Publier une offre",
    photo: "/media/boardroom.jpg",
  },
  {
    kicker: "Recrutement continu",
    title: "Structurez votre acquisition de talents",
    text: "CDD, CDI, stages : centralisez l'ensemble de vos offres, suivez chaque candidature et pilotez vos recrutements depuis un espace unique.",
    cta: "Ouvrir un compte entreprise",
    photo: "/media/interview.jpg",
  },
];

export type Solution = {
  id: string;
  kicker: string;
  title: string;
  text: string;
  points: string[];
  photo: string;
};

export const SOLUTIONS: Solution[] = [
  {
    id: "diffusion",
    kicker: "Diffusion d'offres",
    title: "Diffusez vos offres auprès des bons candidats",
    text: "Vos offres sont relayées auprès des candidats de votre zone et de votre secteur d'activité, y compris sur WhatsApp, le canal qu'ils consultent au quotidien.",
    points: [
      "Missions, CDD, CDI et stages",
      "Ciblage par ville et par métier",
      "Suivi centralisé des candidatures",
    ],
    photo: "/media/team-laptops.jpg",
  },
  {
    id: "preselection",
    kicker: "Présélection",
    title: "Une présélection fondée sur la pertinence",
    text: "Notre moteur de correspondance croise compétences, expérience et localisation pour vous présenter en priorité les profils les plus adaptés à chaque poste.",
    points: [
      "Candidats classés par pertinence",
      "Identité des candidats vérifiée",
      "Mise en relation directe et sécurisée",
    ],
    photo: "/media/candidates-panel.jpg",
  },
  {
    id: "accompagnement",
    kicker: "Recrutement accompagné",
    title: "Un réseau d'agents au service de vos recrutements",
    text: "Nos agents de terrain identifient et mobilisent les candidats adaptés à vos postes, y compris les talents encore absents des plateformes en ligne.",
    points: [
      "Sourcing actif des candidats",
      "Connaissance fine du marché local",
      "La décision finale vous appartient",
    ],
    photo: "/media/interview-room.jpg",
  },
  {
    id: "verification",
    kicker: "Conformité",
    title: "Un compte entreprise vérifié",
    text: "Votre organisation est authentifiée sur la base de ses documents officiels — RCCM, NIU, agrément, récépissé de déclaration. Un gage de crédibilité auprès des candidats.",
    points: [
      "Pièces justificatives adaptées à votre statut",
      "Documents conservés de manière confidentielle",
      "Activation du compte après validation",
    ],
    photo: "/media/compliance-officer.jpg",
  },
];

export const STEPS = [
  {
    title: "Ouvrez votre compte entreprise",
    text: "Avec l'adresse email professionnelle de votre organisation. Connexion par code à usage unique, sans mot de passe.",
  },
  {
    title: "Authentifiez votre organisation",
    text: "Renseignez votre statut juridique et transmettez les pièces justificatives correspondantes. Nos équipes les examinent.",
  },
  {
    title: "Publiez et recrutez",
    text: "Diffusez vos offres, consultez les profils présélectionnés et entrez en contact avec les candidats retenus.",
  },
];

export type Audience = { title: string; text: string; icon: Icon };

export const AUDIENCES: Audience[] = [
  {
    title: "Entreprises, PME et TPE",
    text: "Commerce, industrie, services, BTP : du renfort ponctuel au recrutement de collaborateurs permanents.",
    icon: IconBuildingSkyscraper,
  },
  {
    title: "Enseignement et formation",
    text: "Établissements privés, universités, centres de formation professionnelle : corps enseignant, encadrement et personnel administratif.",
    icon: IconSchool,
  },
  {
    title: "ONG et organisations internationales",
    text: "Chefs de projet, agents de terrain, consultants : des recrutements locaux pour vos programmes.",
    icon: IconHeartHandshake,
  },
  {
    title: "Secteur public",
    text: "Ministères, collectivités locales, établissements publics : des profils qualifiés et un processus traçable.",
    icon: IconBuildingBank,
  },
  {
    title: "Santé",
    text: "Cliniques, cabinets médicaux, pharmacies, laboratoires : personnel soignant, technique et d'accueil.",
    icon: IconStethoscope,
  },
];

export const FAQ = [
  {
    q: "Quelles organisations peuvent ouvrir un compte entreprise ?",
    a: "Les entreprises de toute taille, startups, coopératives et GIE, les établissements d'enseignement et de formation, les ONG, associations et fondations, les structures de santé, les administrations, les établissements publics et les organisations internationales.",
  },
  {
    q: "Quelles pièces justificatives sont demandées ?",
    a: "Elles dépendent de votre statut : RCCM et NIU pour une société, récépissé de déclaration et statuts pour une association ou une ONG, autorisation d'ouverture ou agrément pour un établissement d'enseignement ou de santé, acte de création pour une entité publique. Le formulaire vous indique précisément les pièces attendues.",
  },
  {
    q: "Comment se déroule la vérification de mon organisation ?",
    a: "Nos équipes examinent vos pièces dès leur réception. Votre compte est activé une fois la vérification validée, et vous en êtes informé par email.",
  },
  {
    q: "Comment se connecter à l'espace entreprise ?",
    a: "Avec l'adresse email du compte : un code à usage unique est envoyé à chaque connexion. Aucun mot de passe à gérer.",
  },
  {
    q: "Mes documents sont-ils protégés ?",
    a: "Vos pièces justificatives sont conservées dans un espace de stockage privé et ne sont consultées que par les équipes chargées de la vérification.",
  },
];
