import {
  IconBriefcase,
  IconBuilding,
  IconCreditCard,
  IconLayoutDashboard,
  IconMessage,
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

/** The business space's pages, in sidebar order (also the ⌘K list). */
export const NAV_ITEMS: NavItem[] = [
  { label: "Tableau de bord", href: "/espace", icon: IconLayoutDashboard },
  { label: "Mon organisation", href: "/espace/organisation", icon: IconBuilding },
  { label: "Abonnement", href: "/espace/abonnement", icon: IconCreditCard },
  { label: "Offres", href: "/espace/offres", icon: IconBriefcase, soon: true },
  { label: "Candidats", href: "/espace/candidats", icon: IconUsers, soon: true },
  { label: "Messages", href: "/espace/messages", icon: IconMessage, soon: true },
];

/** Whether `href` is the page shown (the dashboard only on its own path). */
export function isActive(pathname: string, href: string): boolean {
  return href === "/espace" ? pathname === "/espace" : pathname.startsWith(href);
}
