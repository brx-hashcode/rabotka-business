import {
  IconAffiliate,
  IconCalendarStats,
  IconLayoutKanban,
  IconMapPin,
  IconSortDescending,
  IconUsers,
  type Icon,
} from "@tabler/icons-react";

import type { IllustrationName } from "#/components/illustration";

import type { MockupKey } from "./content";

/*
 * The public site's pages beyond the landing: the ATS story, each feature's
 * page, the guides and « À propos ». Same rule as content.ts: what Rabotka
 * does today, no prices, no statistics, no invented customers.
 */

/** The pipeline every candidate goes through, as the ATS board shows it. */
export const PIPELINE = [
  { title: "Diffusion", text: "Rabotka, page carrières, Google, LinkedIn" },
  { title: "Candidatures", text: "Toutes reçues au même endroit" },
  { title: "Tri et classement", text: "Chaque CV lu, noté et expliqué" },
  { title: "Entretiens", text: "Créneaux au choix, visio et compte rendu" },
  { title: "Décision", text: "Avis de l'équipe, candidat retenu" },
  { title: "Contrat et mission", text: "Contrat généré, mission suivie" },
] as const;

export type Pillar = { title: string; text: string; icon: Icon };

/** What makes Rabotka Business an ATS of its generation, not a job board. */
export const ATS_PILLARS: Pillar[] = [
  {
    title: "Le tri fait pour vous",
    text: "Chaque candidature est lue et notée par rapport au poste, même un CV scanné ou pris en photo. Vous savez pourquoi un candidat est en tête, critère par critère.",
    icon: IconSortDescending,
  },
  {
    title: "Une offre, partout à la fois",
    text: "Publiée sur Rabotka, jusque sur WhatsApp côté candidats, sur votre page carrières visible sur Google, sur LinkedIn et en affiche à QR code.",
    icon: IconAffiliate,
  },
  {
    title: "Un pipeline lisible",
    text: "De la candidature reçue au candidat retenu, chacun a son statut et son historique. Rien ne se perd entre deux e-mails.",
    icon: IconLayoutKanban,
  },
  {
    title: "Recruter à plusieurs",
    text: "Recruteurs et évaluateurs donnent leur avis et laissent leurs notes. L'Activité de l'équipe garde la trace de chaque décision.",
    icon: IconUsers,
  },
  {
    title: "Branché sur vos outils",
    text: "Les CV choisis dans votre messagerie Gmail, les entretiens dans Google Agenda, Outlook ou Apple Calendrier, les rapports en PDF et en Excel.",
    icon: IconCalendarStats,
  },
  {
    title: "Pensé pour l'Afrique",
    text: "Pièces officielles de votre pays, paiement par mobile money dans votre monnaie, candidats joints sur WhatsApp et agents de terrain.",
    icon: IconMapPin,
  },
];

export type FeaturePage = {
  metaTitle: string;
  metaDescription: string;
  /** The page's own heading; the feature's `title` is its section title. */
  heading: string;
  intro: string;
  benefits: { title: string; text: string }[];
  /** « Comment ça se passe », step by step, each beside a photo (public/media, Unsplash). */
  steps?: { kicker: string; title: string; text: string; points: string[]; photo: string; alt: string }[];
};

/** One page per feature, keyed like FEATURES. */
export const FEATURE_PAGES: Record<Exclude<MockupKey, "pipeline">, FeaturePage> = {
  cv: {
    metaTitle: "Analyse de CV",
    metaDescription:
      "Déposez vos CV ou choisissez-les dans Gmail : Rabotka les lit, les note sur 100 par rapport au poste et les classe en quelques minutes.",
    heading: "L'analyse de CV qui lit vraiment chaque candidat",
    intro:
      "Des dizaines de CV pour un poste ? Rabotka les lit à votre place, même scannés ou pris en photo, et vous rend un classement expliqué. Vous passez votre temps sur les bons candidats, pas sur la pile.",
    benefits: [
      {
        title: "Tous vos CV, d'où qu'ils viennent",
        text: "PDF, Word, photos et scans, déposés depuis votre appareil ou choisis directement dans votre messagerie Gmail, en lecture seule.",
      },
      {
        title: "Une note que l'on comprend",
        text: "Une note sur 100, les points forts, les points d'attention et le parcours relu : années en lien avec le poste, temps plein ou partiel.",
      },
      {
        title: "Une conversation avec le CV",
        text: "Posez vos questions sur un candidat, ou comparez jusqu'à 5 CV côte à côte pour départager les derniers.",
      },
      {
        title: "Un classement à partager",
        text: "Exportez le classement et vos échanges en PDF pour votre direction ou le responsable du poste.",
      },
    ],
  },
  offer: {
    metaTitle: "Rédaction et diffusion d'offres",
    metaDescription:
      "Décrivez votre besoin en quelques mots : Rabotka rédige l'offre, la publie sur votre page carrières, sur Google, sur LinkedIn et auprès des candidats Rabotka.",
    heading: "Une offre claire en quelques mots, diffusée partout",
    intro:
      "Décrivez le poste comme vous le diriez à un collègue. Rabotka rédige l'intitulé et la description, propose le métier, et met l'offre en ligne là où sont les candidats.",
    benefits: [
      {
        title: "Rédigée pour vous",
        text: "Un intitulé et une description prêts à publier, sans les critères qui écartent des candidats sans rapport avec le poste. Vous relisez et ajustez.",
      },
      {
        title: "Des questions de présélection",
        text: "Ajoutez vos questions à l'offre, dont des questions éliminatoires : les réponses arrivent avec chaque candidature.",
      },
      {
        title: "Multidiffusion",
        text: "Candidats Rabotka ciblés par ville et par métier, page carrières visible sur Google, publication LinkedIn, partage WhatsApp et Facebook, affiche à QR code.",
      },
      {
        title: "Des candidats prévenus",
        text: "Si la rémunération, la date ou le lieu change, les candidats déjà engagés sont prévenus. Une offre expirée se republie en un clic.",
      },
    ],
  },
  linkedin: {
    metaTitle: "Publication sur LinkedIn",
    metaDescription:
      "Connectez LinkedIn une fois : chaque offre s'y publie avec un texte prêt et son image, et mène à votre page carrières.",
    heading: "Vos offres sur LinkedIn, sans copier-coller",
    intro:
      "Votre réseau professionnel est un vivier : chaque offre s'y publie en carte, avec votre texte et votre image, et les candidatures qui en viennent sont repérées comme telles.",
    benefits: [
      { title: "Un texte prêt", text: "Le post est rédigé pour vous, à relire et ajuster avant de publier." },
      { title: "Une image soignée", text: "L'image de l'offre est générée pour vous, ou vous choisissez la vôtre." },
      { title: "Chaque recruteur, son profil", text: "Chaque recruteur de l'équipe publie sur son propre profil LinkedIn." },
      { title: "La provenance suivie", text: "Les candidatures venues de LinkedIn sont repérées dans votre boîte de réception." },
    ],
  },
  applicants: {
    metaTitle: "Suivi des candidatures (ATS)",
    metaDescription:
      "Un ATS complet : toutes vos candidatures au même endroit, classées par adéquation, avec statut, historique, réponses en masse et exports.",
    heading: "Le suivi des candidatures, comme un vrai ATS",
    intro:
      "Candidats Rabotka, page carrières, LinkedIn : toutes les candidatures arrivent dans une seule boîte, classées par adéquation avec le poste. Chaque candidat avance d'étape en étape, avec son historique.",
    benefits: [
      {
        title: "Une seule boîte de réception",
        text: "Les candidatures de toutes vos sources au même endroit, avec leur provenance : Rabotka, page carrières, LinkedIn, QR code.",
      },
      {
        title: "Les meilleurs en tête",
        text: "Chaque candidature reçoit une note : métier, expérience, lieu et fiabilité. « Pourquoi ce score ? » détaille chaque critère.",
      },
      {
        title: "Retenir, refuser, répondre",
        text: "Retenez un candidat en un clic. Répondez aux autres avec un message prêt à l'emploi, un par un ou tous à la fois.",
      },
      {
        title: "Exports et rapports",
        text: "La liste des candidats d'une offre en Excel, et le rapport de recrutement en PDF pour votre direction.",
      },
    ],
  },
  interviews: {
    metaTitle: "Entretiens en visio, notes et compte rendu",
    metaDescription:
      "Proposez plusieurs créneaux, menez l'entretien en visio dans Rabotka, prenez vos notes à la voix et partagez un compte rendu rédigé à partir d'elles.",
    heading: "Des entretiens menés et suivis au même endroit",
    intro:
      "Proposez vos créneaux, le candidat choisit depuis l'e-mail qu'il reçoit. Le jour venu, la visio s'ouvre dans Rabotka avec vos notes à côté, et le compte rendu se partage avec l'équipe en un clic.",
    benefits: [
      { title: "Plusieurs créneaux au choix", text: "Proposez jusqu'à trois moments : le candidat choisit celui qui lui convient, ou en demande un autre, sans compte ni mot de passe." },
      { title: "La visio dans Rabotka", text: "Aucune application à installer : le candidat rejoint l'appel par son lien, sur ordinateur ou sur téléphone. Meet ou Zoom restent possibles." },
      { title: "Un collègue dans l'appel", text: "Invitez un responsable ou un expert : il reçoit son propre lien par e-mail et entre sous son nom, sans compte." },
      { title: "L'entretien transcrit", text: "Activez la transcription : la voix de chacun devient du texte pendant l'appel, celle du candidat seulement s'il l'accepte. Vos notes, tapées ou dictées, restent à côté." },
      { title: "Le compte rendu prêt", text: "Rédigé par IA à partir de vos notes et de la transcription : résumé, points forts, points de vigilance, prochaines étapes. Vous le relisez, l'envoyez à l'équipe ou l'enregistrez en PDF." },
      { title: "Votre agenda synchronisé", text: "Google Agenda, Outlook ou Apple Calendrier : chaque entretien y apparaît et s'y met à jour, avec un rappel la veille pour vous et le candidat." },
    ],
    steps: [
      {
        kicker: "Pendant l'entretien",
        title: "La visio dans Rabotka",
        text: "Le jour venu, l'appel s'ouvre dans votre espace, sans application à installer. Le candidat le rejoint par le lien de son invitation, sur ordinateur ou sur téléphone, sans compte.",
        points: [
          "Un collègue ou un responsable invité, sous son nom",
          "Une page d'attente pour le candidat, avec l'heure d'ouverture",
          "« Terminer l'entretien » ferme l'appel pour tous",
        ],
        photo: "/media/interview-visio-grid.jpg",
        alt: "Un ordinateur portable ouvert sur un appel vidéo à plusieurs, une tasse posée à côté.",
      },
      {
        kicker: "En même temps",
        title: "La voix de chacun mise en texte",
        text: "Activez la transcription : le navigateur de chacun transforme sa propre voix en texte, phrase après phrase, et celle du candidat seulement s'il l'accepte. Vos notes, tapées ou dictées, restent à côté de l'appel.",
        points: [
          "Les deux voix réunies dans l'ordre où elles ont été dites",
          "Une phrase importante ajoutée à vos notes d'un clic",
          "Ni le son ni l'image ne sont enregistrés",
        ],
        photo: "/media/interview-visio.jpg",
        alt: "Un homme en entretien vidéo avec une recruteuse qui apparaît sur l'écran de son ordinateur.",
      },
      {
        kicker: "Après l'entretien",
        title: "Le compte rendu, prêt à partager",
        text: "Rabotka rédige le compte rendu à partir de la transcription et de vos notes, pendant que vous passez à autre chose : une notification vous prévient quand il est prêt. Vous le relisez, le modifiez, l'envoyez à l'équipe ou l'enregistrez en PDF.",
        points: [
          "Résumé, points forts, points de vigilance et prochaines étapes",
          "Les heures réelles de l'entretien, pas seulement celles prévues",
          "Rédigé par IA : à relire avant de l'envoyer",
        ],
        photo: "/media/interview-team-review.jpg",
        alt: "Une équipe autour d'une table, ordinateurs ouverts, qui échange sur un entretien.",
      },
    ],
  },
  tracking: {
    metaTitle: "Missions, contrats et tableau de bord",
    metaDescription:
      "Contrat généré dès qu'un candidat est retenu, missions suivies, tableau de bord de recrutement et rapports en PDF et Excel.",
    heading: "Du contrat au bilan, tout reste au même endroit",
    intro:
      "Le recrutement ne s'arrête pas au « oui ». Le contrat est prêt dès qu'un candidat est retenu, la mission se suit jusqu'à la fin, et vos chiffres de recrutement sont toujours à jour.",
    benefits: [
      { title: "Le contrat généré", text: "Consultable et imprimable depuis votre espace dès qu'un candidat est retenu." },
      { title: "Les missions suivies", text: "Qui arrive, qui est en mission, qui a terminé ; et votre avis sur chaque mission terminée." },
      { title: "Un tableau de bord", text: "Candidatures, entretiens, délais et postes pourvus sur 7, 30 ou 90 jours, comparés à la période d'avant." },
      { title: "Des exports RH", text: "Le rapport de recrutement en PDF, vos données en Excel, et le registre du personnel." },
    ],
  },
  profiles: {
    metaTitle: "Recherche de profils",
    metaDescription:
      "Cherchez parmi les profils vérifiés par métier, compétence ou ville, gardez les plus intéressants et obtenez leur contact.",
    heading: "N'attendez pas les candidats : allez les chercher",
    intro:
      "Recherchez parmi les profils vérifiés de Rabotka par métier, compétence ou ville. Gardez les plus prometteurs dans « Mes profils » et invitez-les à postuler à vos offres.",
    benefits: [
      { title: "Des profils vérifiés", text: "L'identité des profils est vérifiée avant qu'ils ne vous soient proposés." },
      { title: "Mes profils", text: "Gardez les candidats prometteurs avec vos notes et vos mots-clés, et retrouvez ceux que vous avez déjà recrutés." },
      { title: "Invités à vos offres", text: "Proposez une offre en ligne à un profil gardé : il est invité à postuler." },
      { title: "Des agents sur le terrain", text: "Nos agents mobilisent aussi les candidats absents des plateformes." },
    ],
  },
  team: {
    metaTitle: "Recrutement en équipe",
    metaDescription:
      "Invitez recruteurs et évaluateurs : avis Oui, Peut-être, Non, notes partagées, historique et Activité de l'équipe.",
    heading: "Recrutez à plusieurs, décidez ensemble",
    intro:
      "Un recrutement se décide rarement seul. Invitez vos collègues : chacun a son rôle, donne son avis et laisse ses notes, et l'Activité garde la trace de tout.",
    benefits: [
      { title: "Des rôles clairs", text: "L'Administrateur gère le compte, les Recruteurs mènent les offres, les Évaluateurs donnent leur avis." },
      { title: "L'avis de chacun", text: "Oui, Peut-être ou Non sur chaque candidat : la décision se lit d'un coup d'œil." },
      { title: "Des notes privées", text: "Ce que l'équipe écrit sur un candidat n'est jamais vu de lui." },
      { title: "Activité et historique", text: "Qui a fait quoi, et quand : pour l'équipe comme pour chaque candidature." },
    ],
  },
};

export type Guide = {
  slug: string;
  illustration: IllustrationName;
  title: string;
  description: string;
  /** Reading time, in minutes. */
  minutes: number;
  sections: { heading: string; paragraphs?: string[]; list?: string[] }[];
};

/** Practical how-tos about recruiting with Rabotka: method, no figures. */
export const GUIDES: Guide[] = [
  {
    slug: "rediger-une-offre-qui-attire",
    illustration: "job-offers",
    title: "Rédiger une offre qui attire les bons candidats",
    description: "Intitulé, missions, conditions : ce qui fait qu'un candidat qualifié postule, et ce qui le fait fuir.",
    minutes: 5,
    sections: [
      {
        heading: "Un intitulé que le candidat cherche",
        paragraphs: [
          "Le candidat tape un métier, pas le nom interne du poste. « Caissière » trouve plus de monde que « Hôtesse de caisse niveau 2 ». Gardez l'intitulé court et précis, avec le métier en premier.",
        ],
      },
      {
        heading: "Les missions avant le profil",
        paragraphs: [
          "Décrivez d'abord ce que la personne fera au quotidien, en quelques lignes concrètes. Le profil recherché vient ensuite : les compétences réellement nécessaires, pas une liste idéale.",
        ],
        list: [
          "Trois à cinq missions principales, avec des verbes d'action",
          "Les compétences indispensables, séparées des « plus »",
          "Le lieu, les horaires et le type de contrat dès le début",
        ],
      },
      {
        heading: "Écarter ce qui écarte à tort",
        paragraphs: [
          "Un âge, un sexe ou une situation familiale n'ont pas leur place dans une offre, et éloignent des candidats compétents. Rabotka retire ces critères quand il rédige l'offre pour vous.",
        ],
      },
      {
        heading: "Une question pour gagner du temps",
        paragraphs: [
          "Une question de présélection bien choisie (« Avez-vous le permis C ? ») trie mieux qu'un long texte. Rendez-la éliminatoire seulement si la réponse est vraiment bloquante.",
        ],
      },
    ],
  },
  {
    slug: "trier-des-dizaines-de-cv",
    illustration: "online-cv",
    title: "Trier des dizaines de CV sans y passer la journée",
    description: "Une méthode en trois temps pour passer d'une pile de CV à une liste courte, avec l'Analyse de CV.",
    minutes: 4,
    sections: [
      {
        heading: "1. Décrire le poste avant de lire",
        paragraphs: [
          "Avant d'ouvrir un seul CV, écrivez ce qui compte vraiment : l'expérience utile, les compétences indispensables, la ville. C'est ce texte que l'Analyse de CV compare à chaque candidat.",
        ],
      },
      {
        heading: "2. Laisser Rabotka faire la première lecture",
        paragraphs: [
          "Déposez tous les CV d'un coup, ou choisissez-les dans votre messagerie Gmail. Chacun est lu, noté sur 100 et accompagné de ses points forts et de ses points d'attention.",
        ],
        list: [
          "Commencez par les notes les plus hautes, mais lisez le « pourquoi »",
          "Regardez les points d'attention : une absence d'information n'est pas un défaut",
          "Gardez une deuxième liste pour les profils atypiques",
        ],
      },
      {
        heading: "3. Départager les derniers",
        paragraphs: [
          "Comparez jusqu'à 5 CV côte à côte et posez vos questions : « Lequel a déjà encadré une équipe ? ». Exportez le classement en PDF pour le partager avec le responsable du poste.",
        ],
      },
    ],
  },
  {
    slug: "organiser-ses-entretiens",
    illustration: "interview",
    title: "Organiser ses entretiens sans échanges sans fin",
    description: "Proposer ses créneaux, mener la visio, partager le compte rendu : un entretien qui sert vraiment la décision.",
    minutes: 4,
    sections: [
      {
        heading: "Proposer, pas négocier",
        paragraphs: [
          "Proposez un créneau précis, ou jusqu'à trois au choix, avec le format (sur place, téléphone ou visio) et le lieu. Le candidat choisit, confirme ou demande un autre moment depuis son e-mail : vous évitez les allers-retours. En visio, créez le lien dans Rabotka : l'appel s'y déroule, sans application à installer.",
        ],
      },
      {
        heading: "Les mêmes questions pour tous",
        paragraphs: [
          "Pour comparer des candidats, posez-leur les mêmes questions principales, liées aux missions du poste. Notez les réponses pendant l'entretien ou juste après, pendant qu'elles sont fraîches : tapées ou dictées, à côté de la visio.",
        ],
        list: [
          "Une question sur une situation déjà vécue",
          "Une question sur une difficulté du poste",
          "Le temps pour les questions du candidat",
        ],
      },
      {
        heading: "Décider à plusieurs",
        paragraphs: [
          "Invitez le responsable du poste dans l'appel : il entre par son propre lien, sans compte. Après l'entretien, Rabotka rédige le compte rendu à partir de vos notes ; relisez-le et envoyez-le à l'équipe. Chaque membre donne son avis (Oui, Peut-être, Non) : la décision se prend sur des éléments partagés, et le candidat retenu reçoit son contrat dans la foulée.",
        ],
      },
    ],
  },
];
