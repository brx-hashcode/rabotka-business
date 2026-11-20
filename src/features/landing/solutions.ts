import type { SiteCopy } from "./copy";
import type { MockupKey, NavLink } from "./content";

/**
 * Pages written for what a business types into Google before it knows
 * Rabotka's name: « logiciel de recrutement pour PME », « ATS Afrique ». Each
 * says it in its title, heading and text, then sends on to the features and
 * the demo. All live under one path, the words people search for.
 */
export const SOLUTIONS_PATH = "/logiciel-de-recrutement";

const SOLUTION_META: { slug: keyof SiteCopy["solutions"]; mockup: Exclude<MockupKey, "pipeline"> }[] = [
  { slug: "pme", mockup: "applicants" },
  { slug: "afrique", mockup: "cv" },
];

/** Every page's slug (the sitemap's, the same in each language). */
export const SOLUTION_SLUGS: string[] = SOLUTION_META.map((s) => s.slug);

export type Solution = SiteCopy["solutions"][keyof SiteCopy["solutions"]] & {
  slug: string;
  href: string;
  mockup: Exclude<MockupKey, "pipeline">;
};

export function solutions(copy: SiteCopy): Solution[] {
  return SOLUTION_META.map(({ slug, mockup }) => ({
    ...copy.solutions[slug],
    slug,
    href: `${SOLUTIONS_PATH}/${slug}`,
    mockup,
  }));
}

/** The footer's « Solutions » column. */
export function solutionPageLinks(copy: SiteCopy): NavLink[] {
  return solutions(copy).map(({ href, label }) => ({ href, label }));
}
