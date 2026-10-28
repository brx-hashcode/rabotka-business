import { appConfig } from "#/config";
import { BusinessBaseController } from "./base-controller";

export type OfferStatus =
  | "DRAFT"
  | "ACTIVE"
  | "PARTIALLY_FILLED"
  | "FILLED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELLED";

export type EmploymentType = "MISSION" | "CDD" | "CDI" | "STAGE";
export type PaymentFlow = "TASK" | "HOURLY" | "DAILY" | "MONTHLY";

export type OfferListItem = {
  id: string;
  title: string;
  status: OfferStatus;
  scheduledAt: string | null;
  employmentType: EmploymentType;
  amount: number | null;
  paymentFlow: PaymentFlow | null;
  isRemote: boolean;
  city: string | null;
  countryName: string | null;
  quantity: number;
  acceptedCount: number;
  createdAt: string;
  description: string;
  address: string | null;
};

export type Offer = OfferListItem & {
  reference: string;
  description: string;
  address: string | null;
  countryCode: string | null;
  categoryId: string | null;
  note: string | null;
};

/** One applicant on an offer — public fields only, never a phone. */
export type OfferApplicant = {
  applicationId: string;
  status: string;
  createdAt: string;
  /** Rated by this employer already (finished missions only). */
  ratedByEmployer?: boolean;
  worker: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    reliabilityScore: number | null;
  };
};

/** An application in the employer's inbox: the applicant and the offer it is for. */
export type ReceivedApplication = OfferApplicant & {
  offer: { id: string; title: string; scheduledAt: string | null; status: OfferStatus };
};

export type OfferInput = {
  title: string;
  description: string;
  /** ISO instant: the day of the work (MISSION) or the closing date. */
  scheduled_at: string;
  employment_type: EmploymentType;
  isRemote: boolean;
  countryCode?: string;
  countryName?: string;
  city?: string;
  address?: string;
  quantity: number;
  amount?: number | null;
  payment_flow?: PaymentFlow | null;
  note?: string;
  category_id: string;
};

export type JobCategory = { id: string; name: string; slug: string };

type Raw = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : null);

function toListItem(o: Raw): OfferListItem {
  return {
    id: String(o.id),
    title: String(o.title ?? ""),
    status: o.status as OfferStatus,
    scheduledAt: str(o.scheduled_at),
    employmentType: (o.employment_type as EmploymentType) ?? "MISSION",
    amount: o.amount == null ? null : Number(o.amount),
    paymentFlow: (o.payment_flow as PaymentFlow | null) ?? null,
    isRemote: Boolean(o.is_remote),
    city: str(o.city),
    countryName: str(o.country_name),
    quantity: Number(o.quantity ?? 1),
    acceptedCount: Number(o.acceptedCount ?? 0),
    createdAt: String(o.created_at ?? ""),
    description: String(o.description ?? ""),
    address: str(o.address),
  };
}

/**
 * The employer's offers — the same endpoints as the client app's « Mes
 * offres ». A business publishes within its plan's active-offer limit (the
 * server answers 403 with the upgrade message past it).
 */
class OfferController extends BusinessBaseController {
  async list(params: { page?: number; pageSize?: number; statuses?: OfferStatus[] } = {}) {
    const qs = new URLSearchParams({ page: String(params.page ?? 0), pageSize: String(params.pageSize ?? 50) });
    if (params.statuses?.length) qs.set("status", params.statuses.join(","));
    const res = await this.get<{ items: Raw[]; total: number }>(`/profile/job-offers?${qs}`);
    return { items: res.items.map(toListItem), total: res.total };
  }

  async detail(id: string): Promise<Offer> {
    const o = await this.get<Raw>(`/job-offers/${encodeURIComponent(id)}`);
    return {
      ...toListItem(o),
      reference: String(o.reference ?? ""),
      description: String(o.description ?? ""),
      address: str(o.address),
      countryCode: str(o.country_code),
      categoryId: str(o.category_id),
      note: str(o.note),
    };
  }

  async applicants(id: string): Promise<OfferApplicant[]> {
    const rows = await this.get<Raw[]>(`/profile/job-offers/${encodeURIComponent(id)}/applications`);
    return rows.map((a) => {
      const w = (a.worker ?? {}) as Raw;
      return {
        applicationId: String(a.id),
        status: String(a.status),
        createdAt: String(a.created_at ?? ""),
        ratedByEmployer: Boolean(a.ratedByEmployer),
        worker: {
          id: String(w.id ?? ""),
          firstName: String(w.first_name ?? ""),
          lastName: String(w.last_name ?? ""),
          avatarUrl: str(w.avatar_url),
          reliabilityScore: w.reliability_score == null ? null : Number(w.reliability_score),
        },
      };
    });
  }

  /**
   * Every application to the employer's offers, newest first (the client
   * app's « Candidatures reçues »). The server sends the worker's phone too:
   * it is dropped here, never mapped — contact details are what an unlock sells.
   */
  async received(page = 0, pageSize = 100): Promise<{ items: ReceivedApplication[]; total: number }> {
    const res = await this.get<{ items: Raw[]; total: number }>(`/profile/received-applications?page=${page}&pageSize=${pageSize}`);
    return {
      total: res.total,
      items: res.items.map((a) => {
        const w = (a.worker ?? {}) as Raw;
        const o = (a.job_offer ?? {}) as Raw;
        return {
          applicationId: String(a.id),
          status: String(a.status),
          createdAt: String(a.created_at ?? ""),
          worker: {
            id: String(w.id ?? ""),
            firstName: String(w.first_name ?? ""),
            lastName: String(w.last_name ?? ""),
            avatarUrl: str(w.avatar_url),
            reliabilityScore: w.reliability_score == null ? null : Number(w.reliability_score),
          },
          offer: {
            id: String(o.id ?? ""),
            title: String(o.title ?? ""),
            scheduledAt: str(o.scheduled_at),
            status: (o.status as OfferStatus) ?? "ACTIVE",
          },
        };
      }),
    };
  }

  create(input: OfferInput): Promise<{ id: string; reference: string }> {
    return this.post("/job-offers", input as unknown as Record<string, unknown>);
  }

  update(id: string, input: Partial<OfferInput>): Promise<unknown> {
    return this.patch(`/profile/job-offers/${encodeURIComponent(id)}`, input as unknown as Record<string, unknown>);
  }

  remove(id: string): Promise<unknown> {
    return this.delete(`/profile/job-offers/${encodeURIComponent(id)}`);
  }

  republish(id: string, scheduledAt: string): Promise<unknown> {
    return this.post(`/job-offers/${encodeURIComponent(id)}/republish`, { scheduledAt });
  }

  categories(): Promise<JobCategory[]> {
    return this.get("/job-categories");
  }
}

const controller = new OfferController();

export const listOffers = controller.list.bind(controller);
export const getOffer = controller.detail.bind(controller);
export const getOfferApplicants = controller.applicants.bind(controller);
export const listReceivedApplications = controller.received.bind(controller);
export const createOffer = controller.create.bind(controller);
export const updateOffer = controller.update.bind(controller);
export const deleteOffer = controller.remove.bind(controller);
export const republishOffer = controller.republish.bind(controller);
export const getJobCategories = controller.categories.bind(controller);

export const offersKey = ["offers"] as const;

/** A retained candidate's contract (PDF), made by the server if it was missing. */
export function applicationContractUrl(applicationId: string): string {
  return `${appConfig.apiUrl}/business/me/applications/${encodeURIComponent(applicationId)}/contract.pdf`;
}

/** An applicant's fit with the offer, scored in the background (like a CV). */
export type ApplicantAssessment = {
  applicationId: string;
  score: number | null;
  criteria: Partial<Record<"trade" | "experience" | "location" | "reliability", number>> | null;
  summary: string | null;
  strengths: string[];
  gaps: string[];
};

class AssessmentController extends BusinessBaseController {
  forOffer(offerId: string): Promise<{ assessments: ApplicantAssessment[]; pending: number }> {
    return this.get(`/business/me/offers/${encodeURIComponent(offerId)}/assessments`);
  }

  /** Refuses the applications picked, or every one still waiting, with one message. */
  refuse(
    offerId: string,
    body: { applicationIds?: string[]; remaining?: boolean; message?: string },
  ): Promise<{ refused: number; skipped: number }> {
    return this.post(`/business/me/offers/${encodeURIComponent(offerId)}/applications/refuse`, body);
  }
}

const assessments = new AssessmentController();
export const getOfferAssessments = assessments.forOffer.bind(assessments);
export const refuseApplications = assessments.refuse.bind(assessments);
