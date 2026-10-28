import { appConfig } from "#/config";
import { BusinessBaseController } from "./base-controller";

/** A worker as an employer sees them (RecommendedWorker in rabotka-backend). */
export type Candidate = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  reliabilityScore: number | null;
  ratingAvg: number | null;
  ratingCount: number;
  categoryName: string | null;
  categoryNames: string[];
  description: string | null;
  /** Often a home: never shown (reaching a worker is what a contact unlock sells). */
  address: string | null;
  isVerified: boolean;
  completedMissions: number;
  portfolioSlug: string | null;
  matchScore: number | null;
};

export type CandidateFilters = {
  q?: string;
  categoryId?: string;
  city?: string;
  minReliability?: number;
  minRating?: number;
};

/** A worker's public portfolio (`GET public/workers/:slug`): no contact field. */
export type CandidatePortfolio = {
  slug: string;
  /** « Ville, Pays » — never a street address. */
  location: string | null;
  completedMissionsCount: number;
  portfolio: {
    id: string;
    description: string | null;
    createdAt: string;
    images: { id: string; imageUrl: string; position: number }[];
  }[];
};

/**
 * The employer's worker search and worker detail — the same endpoints as the
 * client app's « Recherche ». For a business, its plan must include the
 * preselection (403 otherwise).
 */
class CandidateController extends BusinessBaseController {
  search(q: string, pageSize = 8): Promise<{ items: Candidate[]; total: number }> {
    const params = new URLSearchParams({ q, page: "0", pageSize: String(pageSize) });
    return this.get(`/profile/worker-search?${params}`);
  }

  /** The search with its filters (all optional), a page at a time. */
  find(filters: CandidateFilters, page = 0, pageSize = 24): Promise<{ items: Candidate[]; total: number }> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (filters.q?.trim()) params.set("q", filters.q.trim());
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.city) params.set("city", filters.city);
    if (filters.minReliability) params.set("minReliability", String(filters.minReliability));
    if (filters.minRating) params.set("minRating", String(filters.minRating));
    return this.get(`/profile/worker-search?${params}`);
  }

  /** Profiles ranked for this employer (its offers' trades, reliability, rating). */
  suggested(limit = 6): Promise<Candidate[]> {
    return this.get(`/profile/worker-feed?limit=${limit}`);
  }

  /** The worker (the response also carries the contact fee and wallet). */
  async detail(workerId: string): Promise<Candidate> {
    const { worker } = await this.get<{ worker: Candidate }>(
      `/profile/worker-feed/${encodeURIComponent(workerId)}`,
    );
    return worker;
  }

  portfolio(slug: string): Promise<CandidatePortfolio> {
    return this.get(`/public/workers/${encodeURIComponent(slug)}`);
  }
}

const controller = new CandidateController();

/** The candidate's Rabotka CV (PDF, without contact details). */
export function candidateResumeUrl(workerId: string): string {
  return `${appConfig.apiUrl}/business/me/candidates/${encodeURIComponent(workerId)}/resume`;
}

export const searchCandidates = controller.search.bind(controller);
export const getCandidate = controller.detail.bind(controller);
export const findCandidates = controller.find.bind(controller);
export const getSuggestedCandidates = controller.suggested.bind(controller);
export const getCandidatePortfolio = controller.portfolio.bind(controller);
