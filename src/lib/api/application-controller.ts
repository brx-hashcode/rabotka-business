import { BusinessBaseController } from "./base-controller";

/** Where the contact unlock of an accepted candidate stands. */
export type ApplicationUnlock = {
  status: "PENDING_BOTH" | "PENDING_EMPLOYER" | "PENDING_WORKER" | "UNLOCKED" | "EXPIRED" | "CONVERTED_TO_CREDIT";
  employerFee: number;
  walletBalance: number;
  expiresAt: string;
  employerPaid: boolean;
  workerPaid: boolean;
};

export type ApplicationDetail = {
  status: string;
  unlock: ApplicationUnlock | null;
  /** Before accepting: what the employer side would cost (0 when the plan covers it server side). */
  quote: { employerFee: number; walletBalance: number } | null;
};

type Raw = { application: { status: string }; unlock: ApplicationUnlock | null; quote: ApplicationDetail["quote"] };
const toDetail = (r: Raw): ApplicationDetail => ({ status: r.application.status, unlock: r.unlock, quote: r.quote });

/**
 * An employer's decisions on applications — the client app's endpoints
 * (`profile/applications/*`). Accepting starts the contact unlock: a
 * business's plan covers its side while the quota lasts. Contacts never come
 * through here.
 */
class ApplicationController extends BusinessBaseController {
  async detail(id: string): Promise<ApplicationDetail> {
    return toDetail(await this.get<Raw>(`/profile/applications/${encodeURIComponent(id)}`));
  }

  async accept(id: string): Promise<ApplicationDetail> {
    return toDetail(await this.post<Raw>(`/profile/applications/${encodeURIComponent(id)}/accept`));
  }

  reject(id: string, reason?: string): Promise<unknown> {
    return this.post(`/profile/applications/${encodeURIComponent(id)}/reject`, reason ? { reason } : {});
  }

  /** Undoes a hire (accepted, or its unlock still pending). */
  cancel(id: string, reason?: string): Promise<unknown> {
    return this.post(`/profile/applications/${encodeURIComponent(id)}/cancel`, reason ? { reason } : {});
  }

  /** Rates the worker of a finished mission (1–5, optional note). Only once the worker has confirmed it. */
  rate(id: string, score: number, note?: string): Promise<unknown> {
    return this.post(`/profile/applications/${encodeURIComponent(id)}/rate`, note ? { score, note } : { score });
  }

  async payWithWallet(id: string): Promise<ApplicationDetail> {
    return toDetail(await this.post<Raw>(`/profile/applications/${encodeURIComponent(id)}/unlock/pay-wallet`));
  }
}

const controller = new ApplicationController();

export const getApplication = controller.detail.bind(controller);
export const acceptApplication = controller.accept.bind(controller);
export const rejectApplication = controller.reject.bind(controller);
export const cancelApplication = controller.cancel.bind(controller);
export const rateWorker = controller.rate.bind(controller);
export const payUnlockWithWallet = controller.payWithWallet.bind(controller);

export const applicationKey = (id: string) => ["application", id] as const;
