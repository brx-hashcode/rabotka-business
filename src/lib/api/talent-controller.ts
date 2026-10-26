import { BusinessBaseController } from "./base-controller";

/** A worker in the talent pool: kept by the business, or already hired by it. Never a contact field. */
export type Talent = {
  workerId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  city: string | null;
  categoryName: string | null;
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
