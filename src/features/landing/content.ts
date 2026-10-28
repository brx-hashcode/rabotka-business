import {
  IconBuildingBank,
  IconBuildingSkyscraper,
  IconCalendarEvent,
  IconChartBar,
  IconFileSearch,
  IconHeartHandshake,
  IconListCheck,
  IconLock,
  IconMailShare,
  IconSchool,
  IconShieldCheck,
  IconStethoscope,
  IconTrash,
  IconUsersGroup,
  IconWand,
  type Icon,
} from "@tabler/icons-react";

/**
 * Landing copy in one place. What Rabotka does today, nothing it does not:
 * no prices (they are the admin's to set), no statistics (they would need a
 * source), no testimonials until a real customer gives one. The numbers in
 * the product mock-ups are examples, and read as such.
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

export type NavLink = {
  href: string;
  label: string;
  description?: string;
  /** A small coloured tile in the Solutions menu. */
  icon?: Icon;
  tone?: string;
};

export type MockupKey = "cv" | "offer" | "applicants" | "interviews" | "tracking" | "profiles";

export type Feature = NavLink & {
  id: MockupKey;
  icon: Icon;
  tone: string;
  kicker: string;
  title: string;
  text: string;
  points: string[];
};

/** The product, one section each: the strip, the Solutions menu and the page follow this order. */
export const FEATURES: Feature[] = [
  {
    id: "cv",
    href: "#analyse-cv",
    label: "Analyse de CV",
    description: "Les CV lus, notés et classés pour chaque poste.",
    icon: IconFileSearch,
    tone: "bg-chip-green text-chip-green-foreground",
    kicker: "Analyse de CV",
    title: "Des dizaines de CV, classés en quelques minutes",
    text: "Déposez les CV reçus pour un poste, ou choisissez-les directement dans votre messagerie Gmail ou Outlook. Rabotka lit chacun, même scanné ou pris en photo, et le note par rapport au poste.",
    points: [
      "Une note sur 100, les points forts et les points d'attention",
      "Le parcours relu : années en lien avec le poste, temps plein ou partiel",
      "Posez vos questions sur un CV, comparez jusqu'à 5 candidats",
      "Le classement exporté en PDF, à partager avec votre équipe",
    ],
  },
  {
    id: "offer",
    href: "#offres",
    label: "Offres rédigées pour vous",
    description: "Quelques mots suffisent : l'offre complète est prête.",
    icon: IconWand,
    tone: "bg-chip-violet text-chip-violet-foreground",
    kicker: "Offres",
    title: "Une offre claire en quelques mots",
    text: "Décrivez votre besoin comme vous le diriez à un collègue : Rabotka rédige l'intitulé et la description, et propose le métier. Vous relisez, ajustez et publiez.",
    points: [
      "Un intitulé et une description clairs, prêts à publier",
      "Les critères qui écartent des candidats sans rapport avec le poste sont retirés",
      "Diffusion ciblée par ville et par métier, jusque sur WhatsApp côté candidats",
    ],
  },
  {
    id: "applicants",
    href: "#candidatures",
    label: "Candidatures classées",
    description: "Les candidats les plus adaptés en tête de liste.",
    icon: IconListCheck,
    tone: "bg-chip-sky text-chip-sky-foreground",
    kicker: "Candidatures",
    title: "Les meilleurs candidats en tête de liste",
    text: "Chaque candidature reçoit une note : métier, expérience, lieu et fiabilité. Vous voyez d'abord qui correspond, et pourquoi.",
    points: [
      "« Pourquoi ce score ? » détaillé critère par critère",
      "Retenir un candidat en un clic",
      "Répondre aux autres avec un message prêt à l'emploi, un par un ou tous à la fois",
    ],
  },
  {
    id: "interviews",
    href: "#entretiens",
    label: "Entretiens",
    description: "Invitations, réponses et agenda synchronisé.",
    icon: IconCalendarEvent,
    tone: "bg-chip-amber text-chip-amber-foreground",
    kicker: "Entretiens",
    title: "Des entretiens organisés sans échanges sans fin",
    text: "Proposez un créneau : le candidat confirme, décline ou demande un autre moment, depuis l'e-mail qu'il reçoit. Vous suivez tout au même endroit.",
    points: [
      "Sur place, par téléphone ou en visio",
      "Vos entretiens dans Google Agenda, Outlook ou Apple Calendrier, mis à jour seuls",
      "Un rappel la veille, pour vous et pour le candidat",
    ],
  },
  {
    id: "tracking",
    href: "#suivi",
    label: "Missions et suivi",
    description: "Contrats, missions et rapport de recrutement.",
    icon: IconChartBar,
    tone: "bg-chip-green text-chip-green-foreground",
    kicker: "Missions et suivi",
    title: "Du contrat au bilan, tout reste au même endroit",
    text: "Le contrat est généré dès qu'un candidat est retenu, et s'ouvre dans votre espace. Vos missions, vos candidatures et vos recrutements se suivent sur un seul tableau de bord.",
    points: [
      "Contrat consultable et imprimable depuis l'espace",
      "Tableau de bord sur 7, 30 ou 90 jours",
      "Rapport de recrutement en PDF, prêt pour votre direction",
    ],
  },
  {
    id: "profiles",
    href: "#profils",
    label: "Profils et agents",
    description: "Recherche de profils vérifiés et agents de terrain.",
    icon: IconUsersGroup,
    tone: "bg-chip-violet text-chip-violet-foreground",
    kicker: "Profils et agents",
    title: "Allez chercher les profils, en ligne et sur le terrain",
    text: "Recherchez parmi les profils vérifiés par métier, compétence ou ville, gardez les plus intéressants et obtenez leur contact. Nos agents de terrain mobilisent aussi les candidats absents des plateformes.",
    points: [
      "Identité des profils vérifiée",
      "« Mes profils » pour garder les candidats prometteurs",
      "La décision finale vous appartient toujours",
    ],
  },
];

/** The cards under the hero: the four steps a recruiter goes through. */
export const STRIP_FEATURES = FEATURES.filter((f) => f.id !== "tracking" && f.id !== "profiles");

export const SOLUTION_LINKS: NavLink[] = FEATURES.map(({ href, label, description, icon, tone }) => ({
  href,
  label,
  description,
  icon,
  tone,
}));

export const AUDIENCE_LINKS: NavLink[] = [
  { href: "#secteurs", label: "Entreprises, PME et TPE" },
  { href: "#secteurs", label: "Établissements d'enseignement" },
  { href: "#secteurs", label: "ONG et organisations internationales" },
  { href: "#secteurs", label: "Administrations et établissements publics" },
  { href: "#secteurs", label: "Structures de santé" },
];

export const HELP_LINKS: NavLink[] = [
  { href: "#demarche", label: "Notre démarche" },
  { href: "#confiance", label: "Sécurité et confidentialité" },
  { href: "#faq", label: "Questions fréquentes" },
  { href: "#contact", label: "Contacter nos équipes" },
  { href: PUBLIC_SITE, label: "www.rabotka.work" },
];

export type Trust = { title: string; text: string; icon: Icon };

export const TRUST: Trust[] = [
  {
    title: "Organisation vérifiée",
    text: "Votre compte est activé après vérification de vos pièces officielles : un gage de sérieux pour les candidats.",
    icon: IconShieldCheck,
  },
  {
    title: "Messagerie en lecture seule",
    text: "Rabotka ne lit que les pièces jointes que vous choisissez et n'envoie jamais rien depuis votre messagerie.",
    icon: IconMailShare,
  },
  {
    title: "CV supprimés à échéance",
    text: "Les fichiers et les coordonnées des CV analysés sont supprimés au bout de la durée prévue ; seules les notes restent.",
    icon: IconTrash,
  },
  {
    title: "Documents confidentiels",
    text: "Vos pièces et les CV sont conservés dans un espace de stockage privé, consultés uniquement par les personnes habilitées.",
    icon: IconLock,
  },
];

export const STEPS = [
  {
    title: "Ouvrez votre compte entreprise",
    text: "Avec l'adresse e-mail professionnelle de votre organisation. Connexion par code à usage unique, sans mot de passe.",
  },
  {
    title: "Faites vérifier votre organisation",
    text: "Renseignez votre statut juridique et transmettez les pièces correspondantes. Nos équipes les examinent et vous préviennent par e-mail.",
  },
  {
    title: "Publiez, analysez, rencontrez",
    text: "Mettez vos offres en ligne, faites analyser les CV reçus, invitez les meilleurs candidats en entretien et retenez celui qui vous convient.",
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

/** The photo beside the sectors: an office, not the product. */
export const AUDIENCE_PHOTO = "/media/meeting-table.jpg";

export const FAQ = [
  {
    q: "Comment fonctionne l'analyse de CV ?",
    a: "Vous choisissez le poste — une de vos offres ou un poste décrit pour l'occasion — puis les CV. Rabotka lit chaque CV, le compare au poste et lui attribue une note sur 100, avec ses points forts, ses points d'attention et une lecture de son parcours. Le classement est prêt en quelques minutes ; une notification vous prévient.",
  },
  {
    q: "Quels CV puis-je envoyer ?",
    a: "Des PDF, des fichiers Word (.docx) et des photos ou scans (JPG, PNG, WEBP), déposés depuis votre appareil ou choisis directement dans votre messagerie Gmail ou Outlook. Un fichier illisible, ou qui n'est pas un CV, n'est pas décompté.",
  },
  {
    q: "Que fait Rabotka dans ma messagerie ?",
    a: "Rien d'autre que ce que vous lui demandez. La connexion est en lecture seule : vous voyez les e-mails récents qui contiennent un CV, vous cochez ceux à analyser, et seules ces pièces jointes sont lues. Aucun e-mail n'est conservé ni envoyé, et vous pouvez déconnecter votre messagerie à tout moment.",
  },
  {
    q: "Combien de temps les CV sont-ils conservés ?",
    a: "Les fichiers et les coordonnées des CV analysés sont supprimés automatiquement au bout de la durée indiquée lors de l'analyse. Les notes et le classement restent consultables.",
  },
  {
    q: "Les entretiens apparaissent-ils dans mon agenda ?",
    a: "Oui. Ajoutez une fois le lien de votre agenda d'entretiens à Google Agenda, Outlook ou Apple Calendrier : chaque entretien y apparaît et s'y met à jour seul, qu'il soit confirmé, déplacé ou annulé.",
  },
  {
    q: "Quelles organisations peuvent ouvrir un compte entreprise ?",
    a: "Les entreprises de toute taille, startups, coopératives et GIE, les établissements d'enseignement et de formation, les ONG, associations et fondations, les structures de santé, les administrations, les établissements publics et les organisations internationales.",
  },
  {
    q: "Quelles pièces justificatives sont demandées ?",
    a: "Elles dépendent de votre statut : RCCM et NIU pour une société, récépissé de déclaration et statuts pour une association ou une ONG, autorisation d'ouverture ou agrément pour un établissement d'enseignement ou de santé, acte de création pour une entité publique. Le formulaire vous indique précisément les pièces attendues.",
  },
  {
    q: "Comment se connecter à l'espace entreprise ?",
    a: "Avec l'adresse e-mail du compte : un code à usage unique est envoyé à chaque connexion. Aucun mot de passe à gérer.",
  },
];
