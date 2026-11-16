import {
  IconLayoutKanban,
  IconMapPin,
  IconSortDescending,
  IconUsers,
  type Icon,
} from "@tabler/icons-react";

import type { IllustrationName } from "#/components/illustration";

import type { MockupKey } from "./content";
import type { SiteCopy } from "./copy";

/*
 * The public site's pages beyond the landing: the ATS story, each feature's
 * page, the guides and « À propos ». Same rule as content.ts: what Rabotka
 * does today, no prices, no statistics, no invented customers. The words are
 * in the siteCopy messages; here, what is not words (icons, photos, order).
 */

/** The pipeline every candidate goes through, as the ATS board shows it. */
export function pipeline(copy: SiteCopy): { title: string; text: string }[] {
  return copy.pipeline;
}

export type Pillar = { title: string; text: string; icon: Icon };

const PILLAR_ICONS = [IconSortDescending, IconLayoutKanban, IconUsers, IconMapPin];

/** What makes Rabotka Business an ATS of its generation, not a job board. */
export function atsPillars(copy: SiteCopy): Pillar[] {
  return copy.atsPillars.map((p, i) => ({ ...p, icon: PILLAR_ICONS[i] }));
}

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

type FeaturePageKey = Exclude<MockupKey, "pipeline">;

/** The photos beside each feature page's steps, in order. */
const STEP_PHOTOS: Partial<Record<FeaturePageKey, string[]>> = {
  interviews: ["/media/interview-visio-grid.jpg", "/media/interview-visio.jpg", "/media/interview-team-review.jpg"],
};

/** One page per feature, keyed like features(). */
export function featurePage(copy: SiteCopy, key: FeaturePageKey): FeaturePage {
  const page = copy.featurePages[key] as Omit<FeaturePage, "steps"> & {
    steps?: Omit<NonNullable<FeaturePage["steps"]>[number], "photo">[];
  };
  const photos = STEP_PHOTOS[key] ?? [];
  return { ...page, steps: page.steps?.map((step, i) => ({ ...step, photo: photos[i] })) };
}

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
const GUIDE_META: { slug: keyof SiteCopy["guides"]; illustration: IllustrationName; minutes: number }[] = [
  { slug: "rediger-une-offre-qui-attire", illustration: "job-offers", minutes: 5 },
  { slug: "trier-des-dizaines-de-cv", illustration: "online-cv", minutes: 4 },
  { slug: "organiser-ses-entretiens", illustration: "interview", minutes: 4 },
];

/** Every guide's slug (the sitemap's, the same in each language). */
export const GUIDE_SLUGS: string[] = GUIDE_META.map((g) => g.slug);

export function guides(copy: SiteCopy): Guide[] {
  const text = copy.guides;
  return GUIDE_META.map((g) => ({ ...g, ...text[g.slug] }));
}
