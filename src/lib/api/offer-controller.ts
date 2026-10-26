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
  worker: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    reliabilityScore: number | null;
  };
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
export const createOffer = controller.create.bind(controller);
export const updateOffer = controller.update.bind(controller);
export const deleteOffer = controller.remove.bind(controller);
export const republishOffer = controller.republish.bind(controller);
export const getJobCategories = controller.categories.bind(controller);

export const offersKey = ["offers"] as const;
