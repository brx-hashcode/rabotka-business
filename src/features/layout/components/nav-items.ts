import {
  IconAlertCircle,
  IconBookmark,
  IconBriefcase,
  IconBuilding,
  IconCalendarCheck,
  IconCalendarTime,
  IconCreditCard,
  IconFileInvoice,
  IconFileSearch,
  IconLayoutDashboard,
  IconMessageCircle,
  IconSearch,
  IconUsers,
  type Icon,
} from "@tabler/icons-react";

export type NavItem = {
  label: string;
  href: string;
  icon: Icon;
  /** Shown greyed with « Bientôt » until the page exists. */
  soon?: boolean;
};

export type NavGroup = { title: string | null; items: NavItem[] };

/**
 * The business space's pages, grouped as an employer works: the daily stops
 * first (dashboard, messages), then hiring (offer → candidatures → mission),
 * then people (search, kept profiles, CV analysis), then the account, and
 * help apart at the end. Pages not built yet are « Bientôt ».
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    title: null,
    items: [
      { label: "Tableau de bord", href: "/espace", icon: IconLayoutDashboard },
      { label: "Messages", href: "/espace/discussions", icon: IconMessageCircle },
    ],
  },
  {
    title: "Recrutement",
    items: [
      { label: "Offres", href: "/espace/offres", icon: IconBriefcase },
      { label: "Candidatures", href: "/espace/candidatures", icon: IconUsers },
      { label: "Entretiens", href: "/espace/entretiens", icon: IconCalendarTime },
      { label: "Missions", href: "/espace/missions", icon: IconCalendarCheck },
    ],
  },
  {
    title: "Profils",
    items: [
      { label: "Trouver des profils", href: "/espace/recherche", icon: IconSearch },
      { label: "Mes profils", href: "/espace/vivier", icon: IconBookmark },
      { label: "Analyse de CV", href: "/espace/analyse-cv", icon: IconFileSearch },
    ],
  },
  {
    title: "Mon compte",
    items: [
      { label: "Organisation", href: "/espace/organisation", icon: IconBuilding },
      { label: "Abonnement", href: "/espace/abonnement", icon: IconCreditCard },
      { label: "Factures", href: "/espace/factures", icon: IconFileInvoice },
    ],
  },
  {
    title: null,
    items: [{ label: "Aide", href: "/espace/reclamations", icon: IconAlertCircle }],
  },
];

/** Every page, in sidebar order (also the ⌘K list). */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** Whether `href` is the page shown (the dashboard only on its own path). */
export function isActive(pathname: string, href: string): boolean {
  return href === "/espace" ? pathname === "/espace" : pathname.startsWith(href);
}
