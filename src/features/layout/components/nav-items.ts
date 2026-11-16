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
  IconUsersGroup,
  IconWorldWww,
  type Icon,
} from "@tabler/icons-react";

import type { Messages } from "#/i18n/messages";

/** A key of `layout.nav` (src/i18n/messages/fr/layout.json). */
export type NavKey = keyof Messages["layout"]["nav"];

export type NavItem = {
  label: NavKey;
  href: string;
  icon: Icon;
  /** Shown greyed with « Bientôt » until the page exists. */
  soon?: boolean;
};

export type NavGroup = { title: NavKey | null; items: NavItem[] };

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
      { label: "dashboard", href: "/espace", icon: IconLayoutDashboard },
      { label: "messages", href: "/espace/discussions", icon: IconMessageCircle },
    ],
  },
  {
    title: "recruitment",
    items: [
      { label: "offers", href: "/espace/offres", icon: IconBriefcase },
      { label: "careersPage", href: "/espace/page-carrieres", icon: IconWorldWww },
      { label: "applications", href: "/espace/candidatures", icon: IconUsers },
      { label: "interviews", href: "/espace/entretiens", icon: IconCalendarTime },
      { label: "missions", href: "/espace/missions", icon: IconCalendarCheck },
    ],
  },
  {
    title: "profiles",
    items: [
      { label: "search", href: "/espace/recherche", icon: IconSearch },
      { label: "pool", href: "/espace/vivier", icon: IconBookmark },
      { label: "cvAnalysis", href: "/espace/analyse-cv", icon: IconFileSearch },
    ],
  },
  {
    title: "account",
    items: [
      { label: "organisation", href: "/espace/organisation", icon: IconBuilding },
      { label: "team", href: "/espace/equipe", icon: IconUsersGroup },
      { label: "subscription", href: "/espace/abonnement", icon: IconCreditCard },
      { label: "invoices", href: "/espace/factures", icon: IconFileInvoice },
    ],
  },
  {
    title: null,
    items: [{ label: "help", href: "/espace/reclamations", icon: IconAlertCircle }],
  },
];

/** Every page, in sidebar order (also the ⌘K list). */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** Whether `href` is the page shown (the dashboard only on its own path). */
export function isActive(pathname: string, href: string): boolean {
  return href === "/espace" ? pathname === "/espace" : pathname.startsWith(href);
}
