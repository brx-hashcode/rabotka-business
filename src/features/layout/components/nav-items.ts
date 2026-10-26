import {
  IconAlertCircle,
  IconBriefcase,
  IconBuilding,
  IconCalendarCheck,
  IconCreditCard,
  IconFileInvoice,
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
 * The business space's pages, grouped as an employer works: the employer
 * options of the client app (offres, candidatures, missions, discussions,
 * profils contactés, réclamations) plus what is a business's own
 * (organisation, abonnement, factures). Pages not built yet are « Bientôt ».
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    title: null,
    items: [{ label: "Tableau de bord", href: "/espace", icon: IconLayoutDashboard }],
  },
  {
    title: "Recrutement",
    items: [
      { label: "Mes offres", href: "/espace/offres", icon: IconBriefcase },
      { label: "Candidatures", href: "/espace/candidatures", icon: IconUsers },
      { label: "Recherche", href: "/espace/recherche", icon: IconSearch },
      { label: "Missions", href: "/espace/missions", icon: IconCalendarCheck },
    ],
  },
  {
    title: "Échanges",
    items: [
      { label: "Discussions", href: "/espace/discussions", icon: IconMessageCircle },
    ],
  },
  {
    title: "Mon compte",
    items: [
      { label: "Mon organisation", href: "/espace/organisation", icon: IconBuilding },
      { label: "Abonnement", href: "/espace/abonnement", icon: IconCreditCard },
      { label: "Factures", href: "/espace/factures", icon: IconFileInvoice },
      { label: "Réclamations", href: "/espace/reclamations", icon: IconAlertCircle },
    ],
  },
];

/** Every page, in sidebar order (also the ⌘K list). */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** Whether `href` is the page shown (the dashboard only on its own path). */
export function isActive(pathname: string, href: string): boolean {
  return href === "/espace" ? pathname === "/espace" : pathname.startsWith(href);
}
