import type { MemberRole } from "#/lib/api/team-controller";

/**
 * What each role sees in the space. The backend refuses the rest anyway
 * (team-access.ts in rabotka-backend); this only spares people pages and
 * buttons they cannot use.
 *
 * - Administrateur (the account holder): everything.
 * - Recruteur: the hiring, not the account (plan, invoices, organisation,
 *   careers page, team).
 * - Évaluateur: reads candidates and gives its opinion; no messages, missions
 *   or search, where everything is an action.
 */
const ADMIN_ONLY = ["/espace/abonnement", "/espace/factures", "/espace/organisation", "/espace/page-carrieres", "/espace/equipe"];
const NOT_FOR_REVIEWERS = ["/espace/discussions", "/espace/missions", "/espace/recherche"];

export function pageAllowed(role: MemberRole | undefined, href: string): boolean {
  // Unknown yet (loading): show what everyone sees.
  const r = role ?? "REVIEWER";
  if (r === "ADMIN") return true;
  const under = (paths: string[]) => paths.some((p) => href === p || href.startsWith(`${p}/`));
  if (under(ADMIN_ONLY)) return false;
  if (r === "REVIEWER" && under(NOT_FOR_REVIEWERS)) return false;
  return true;
}

/** Publishing, deciding, inviting to interview, messaging: Recruteurs and up. */
export function canHire(role: MemberRole | undefined): boolean {
  return role === "ADMIN" || role === "RECRUITER";
}

export function isAdmin(role: MemberRole | undefined): boolean {
  return role === "ADMIN";
}
