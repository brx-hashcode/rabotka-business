import { BusinessBaseController } from "./base-controller";

/** A worker in the talent pool: kept by the business, or already hired by it. Never a contact field. */
export type Talent = {
  workerId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  city: string | null;
  categoryName: string | null;
  description: string | null;
  reliabilityScore: number | null;
  ratingAvg: number | null;
  ratingCount: number;
  /** Still active and verified: may be invited or reached. */
  available: boolean;
  saved: boolean;
  note: string | null;
  tags: string[];
  savedAt: string | null;
  missionsWithUs: number;
  lastMissionAt: string | null;
  lastMissionTitle: string | null;
};

/** The business's talent pool (`business/me/talents/*`). */
class TalentController extends BusinessBaseController {
  list(): Promise<Talent[]> {
    return this.get("/business/me/talents");
  }

  save(workerId: string, body: { note?: string | null; tags?: string[] } = {}): Promise<unknown> {
    return this.put(`/business/me/talents/${encodeURIComponent(workerId)}`, body);
  }

  remove(workerId: string): Promise<unknown> {
    return this.delete(`/business/me/talents/${encodeURIComponent(workerId)}`);
  }

  /** Asks the worker to apply to one of the open offers (in their notifications). */
  invite(workerId: string, offerId: string): Promise<unknown> {
    return this.post(`/business/me/talents/${encodeURIComponent(workerId)}/invite`, { offerId });
  }
}

const controller = new TalentController();

export const listTalents = controller.list.bind(controller);
export const saveTalent = controller.save.bind(controller);
export const removeTalent = controller.remove.bind(controller);
export const inviteTalent = controller.invite.bind(controller);
export const talentsKey = ["business", "me", "talents"] as const;

/** Beyond Rabotka workers: a careers-page candidature kept with consent, or a CV the business analysed. */
export type PoolKind = "external" | "cv";

export type PoolCandidate = {
  kind: PoolKind;
  id: string;
  /** A CV's screening, to open its analysis. */
  screeningId?: string;
  name: string;
  email: string | null;
  phone: string | null;
  currentTitle: string | null;
  city: string | null;
  score: number | null;
  summary: string | null;
  /** The offer they applied to, or the post the CV was analysed for. */
  appliedFor: { id: string | null; title: string };
  addedAt: string;
  /** Until when it may be kept and found: the candidate's consent, or the plan's retention. */
  keptUntil: string | null;
  kept: boolean;
  note: string | null;
  tags: string[];
};

class PoolController extends BusinessBaseController {
  search(params: { source: PoolKind; q?: string; kept?: boolean; page?: number }): Promise<{ items: PoolCandidate[]; page: number; hasMore: boolean }> {
    const qs = new URLSearchParams({ source: params.source });
    if (params.q?.trim()) qs.set("q", params.q.trim());
    if (params.kept) qs.set("kept", "true");
    if (params.page && params.page > 1) qs.set("page", String(params.page));
    return this.get(`/business/me/talents/candidates?${qs}`);
  }

  save(kind: PoolKind, id: string, body: { note?: string | null; tags?: string[] }): Promise<{ kept: boolean; note: string | null; tags: string[] }> {
    return this.put(`/business/me/talents/candidates/${kind}/${encodeURIComponent(id)}`, body);
  }

  remove(kind: PoolKind, id: string): Promise<{ kept: boolean }> {
    return this.delete(`/business/me/talents/candidates/${kind}/${encodeURIComponent(id)}`);
  }

  invite(kind: PoolKind, id: string, offerId: string): Promise<{ invited: boolean }> {
    return this.post(`/business/me/talents/candidates/${kind}/${encodeURIComponent(id)}/invite`, { offerId });
  }
}

const pool = new PoolController();
export const searchPoolCandidates = pool.search.bind(pool);
export const keepPoolCandidate = pool.save.bind(pool);
export const dropPoolCandidate = pool.remove.bind(pool);
export const invitePoolCandidate = pool.invite.bind(pool);
export const poolKey = ["talents", "pool"] as const;
