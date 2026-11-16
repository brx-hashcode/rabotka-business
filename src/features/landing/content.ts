import {
  IconBook,
  IconBrandLinkedin,
  IconBuildingBank,
  IconBuildingSkyscraper,
  IconCalendarEvent,
  IconFileCertificate,
  IconFileSearch,
  IconHeartHandshake,
  IconHelpCircle,
  IconLayoutKanban,
  IconLock,
  IconMailShare,
  IconSchool,
  IconShieldCheck,
  IconStethoscope,
  IconTrash,
  IconUsers,
  IconUserSearch,
  IconWriting,
  type Icon,
} from "@tabler/icons-react";

/**
 * The landing's structure in one place; its words are the siteCopy messages
 * (French first, English key for key), joined here by `features(copy)`… What Rabotka does today, nothing it does not:
 * no prices (they are the admin's to set), no statistics (they would need a
 * source), no testimonials until a real customer gives one. The numbers in
 * the product mock-ups are examples, and read as such.
 *
 * Photos in public/media come from Unsplash, free licence (no attribution
 * required) — the id after each name, to find the original:
 *   boardroom 1573164574511, team-laptops 1573167101669, interview
 *   1573496267526, meeting-table 1573164574397, manager-office 1758519290996,
 *   candidates-panel 1573497701240, interview-room 1573496130407,
 *   compliance-officer 1653669486816, interview-visio-grid 1588196749597,
 *   interview-visio 1616587894289, interview-team-review 1622675363311.
 * Office and recruitment scenes only — no informal-sector photos here.
 * « Entretiens » shows the three interview-* photos, step by step.
 */

import type { SiteCopy } from "./copy";

export const SIGN_UP_HREF = "/auth/sign-up";
export const DEMO_HREF = "/demo";
export const FEATURES_HREF = "/fonctionnalites";
export const SIGN_IN_HREF = "/auth/sign-in";
export const PUBLIC_SITE = "https://www.rabotka.work";

export type NavLink = {
  href: string;
  label: string;
  description?: string;
  /** A small coloured tile in the Solutions menu. */
  icon?: Icon;
};

export type MockupKey =
  | "cv"
  | "offer"
  | "linkedin"
  | "applicants"
  | "interviews"
  | "tracking"
  | "profiles"
  | "team"
  | "pipeline";

export type Feature = NavLink & {
  id: MockupKey;
  /** Its page: /fonctionnalites/<slug>. */
  slug: string;
  icon: Icon;
  title: string;
  text: string;
  points: string[];
};

/** The product, one section each: the strip, the Solutions menu and the page follow this order. */
const FEATURE_META: { id: Exclude<MockupKey, "pipeline">; slug: string; icon: Icon }[] = [
  { id: "cv", slug: "analyse-cv", icon: IconFileSearch },
  { id: "offer", slug: "redaction-offres", icon: IconWriting },
  { id: "linkedin", slug: "linkedin", icon: IconBrandLinkedin },
  { id: "applicants", slug: "suivi-candidatures", icon: IconLayoutKanban },
  { id: "interviews", slug: "entretiens", icon: IconCalendarEvent },
  { id: "tracking", slug: "missions-et-suivi", icon: IconFileCertificate },
  { id: "profiles", slug: "recherche-de-profils", icon: IconUserSearch },
  { id: "team", slug: "equipe", icon: IconUsers },
];

/** Every feature's slug (the sitemap's, the same in each language). */
export const FEATURE_SLUGS = FEATURE_META.map((f) => f.slug);

export function features(copy: SiteCopy): Feature[] {
  const text = copy.features;
  return FEATURE_META.map(({ id, slug, icon }) => ({
    id,
    slug,
    href: `/fonctionnalites/${slug}`,
    icon,
    ...text[id],
  }));
}

/**
 * The features by stage of a hire, as the Fonctionnalités menu shows them:
 * the menu reads as the pipeline itself.
 */
const FEATURE_GROUP_IDS: MockupKey[][] = [
  ["offer", "linkedin"],
  ["profiles", "cv"],
  ["applicants", "interviews"],
  ["team", "tracking"],
];

export function featureGroups(copy: SiteCopy): { step: string; text: string; ids: MockupKey[] }[] {
  return copy.featureGroups.map((g, i) => ({ ...g, ids: FEATURE_GROUP_IDS[i] }));
}

export function solutionLinks(copy: SiteCopy): NavLink[] {
  return features(copy).map(({ href, label, description, icon }) => ({ href, label, description, icon }));
}

const RESOURCE_META = [
  { href: "/ressources", icon: IconBook },
  { href: "/#faq", icon: IconHelpCircle },
  { href: "/a-propos#confiance", icon: IconShieldCheck },
];

export function resourceLinks(copy: SiteCopy): NavLink[] {
  return copy.resourceLinks.map((l, i) => ({ ...RESOURCE_META[i], ...l }));
}

const COMPANY_HREFS = ["/a-propos", "/contact", DEMO_HREF];

export function companyLinks(copy: SiteCopy): NavLink[] {
  return copy.companyLinks.map((l, i) => ({ href: COMPANY_HREFS[i], ...l }));
}

export type Trust = { title: string; text: string; icon: Icon };

const TRUST_ICONS = [IconShieldCheck, IconMailShare, IconTrash, IconLock];

export function trust(copy: SiteCopy): Trust[] {
  return copy.trust.map((t, i) => ({ ...t, icon: TRUST_ICONS[i] }));
}

/** A sector Rabotka serves: what it recruits, and a few posts it often fills. */
export type Audience = { title: string; text: string; icon: Icon; roles: string[] };

const AUDIENCE_ICONS = [IconBuildingSkyscraper, IconSchool, IconHeartHandshake, IconBuildingBank, IconStethoscope];

export function audiences(copy: SiteCopy): Audience[] {
  return copy.audiences.map((a, i) => ({ ...a, icon: AUDIENCE_ICONS[i] }));
}

/** Behind « Votre secteur n'apparaît pas ? »: an office, not the product. */
export const AUDIENCE_PHOTO = "/media/meeting-table.jpg";

export type FaqItem = { q: string; a: string };

export function faq(copy: SiteCopy): FaqItem[] {
  return copy.faq;
}

/**
 * The questions the home page answers, five at most, in order: what it is,
 * what it does, then the tools a business already uses, then where. -1: a
 * question the page writes itself (the countries, from the catalog).
 */
export function faqShown(copy: SiteCopy): (FaqItem | null)[] {
  return copy.faqShown.map((i) => copy.faq[i] ?? null);
}
