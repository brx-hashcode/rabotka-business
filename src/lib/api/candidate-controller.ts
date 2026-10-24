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

export const searchCandidates = controller.search.bind(controller);
export const getCandidate = controller.detail.bind(controller);
export const getCandidatePortfolio = controller.portfolio.bind(controller);
