import { BusinessBaseController } from "./base-controller";
import type { EmploymentType, PaymentFlow } from "./offer-controller";

export type CareersCompany = {
  slug: string;
  name: string;
  logoUrl: string | null;
  categoryLabel: string;
  city: string | null;
  website: string | null;
  description: string | null;
};

export type CareersOfferSummary = {
  reference: string;
  title: string;
  employmentType: EmploymentType;
  closesAt: string | null;
  isRemote: boolean;
  city: string | null;
  countryName: string | null;
  quantity: number;
};

export type CareersQuestion = {
  id: string;
  kind: "YES_NO" | "CHOICE" | "SHORT_TEXT";
  label: string;
  options: string[];
  required: boolean;
};

export type CareersOffer = CareersOfferSummary & {
  description: string;
  amount: number | null;
  paymentFlow: PaymentFlow | null;
  categoryName: string | null;
  questions: CareersQuestion[];
};

export type ApplyInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cv: File;
  website: string;
  answers: { questionId: string; value: string }[];
};

/** Who applied from the public careers page: the business's side. */
export type ExternalApplication = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: "PENDING" | "RETAINED" | "REFUSED";
  answers: { label: string; kind: CareersQuestion["kind"]; value: string; passed: boolean | null }[];
  knockedOut: boolean;
  hasCv: boolean;
  cvFileName: string;
  cvMimeType: string;
  createdAt: string;
  viewedAt: string | null;
  offer: { id: string; title: string };
  /** Once the business asked for it: the score lives in Analyse de CV. */
  analysis: {
    resumeId: string;
    screeningId: string;
    status: "QUEUED" | "SCORED" | "UNREADABLE" | "FAILED";
    score: number | null;
    summary: string | null;
  } | null;
};

export const externalApplicationsKey = ["external-applications"];

/** A business's public careers page (`public/careers/*`): no session. */
class CareersController extends BusinessBaseController {
  companies(): Promise<(CareersCompany & { openOffers: number })[]> {
    return this.get("/public/careers");
  }

  company(slug: string): Promise<{ company: CareersCompany; offers: CareersOfferSummary[] }> {
    return this.get(`/public/careers/${encodeURIComponent(slug)}`);
  }

  offer(slug: string, reference: string): Promise<{ company: CareersCompany; offer: CareersOffer }> {
    return this.get(`/public/careers/${encodeURIComponent(slug)}/offers/${encodeURIComponent(reference)}`);
  }

  apply(slug: string, reference: string, { cv, answers, ...fields }: ApplyInput): Promise<{ sent: boolean }> {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) form.append(key, value);
    form.append("consent", "true");
    form.append("answers", JSON.stringify(answers));
    form.append("cv", cv);
    return this.post(`/public/careers/${encodeURIComponent(slug)}/offers/${encodeURIComponent(reference)}/apply`, form);
  }

  listExternal(): Promise<ExternalApplication[]> {
    return this.get("/business/me/external-applications");
  }

  /** One candidate, or the offer's not yet read. Each CV uses one « CV inclus ». */
  analyseExternal(offerId: string, applicationId?: string): Promise<{ screeningId: string; analysed: number; left: number }> {
    return this.post("/business/me/external-applications/analyse", { offerId, ...(applicationId ? { applicationId } : {}) });
  }

  retainExternal(id: string): Promise<unknown> {
    return this.post(`/business/me/external-applications/${encodeURIComponent(id)}/retain`);
  }

  refuseExternal(id: string, message?: string): Promise<unknown> {
    return this.post(`/business/me/external-applications/${encodeURIComponent(id)}/refuse`, message ? { message } : {});
  }
}

const controller = new CareersController();

export const getCareersCompanies = controller.companies.bind(controller);
export const getCareersCompany = controller.company.bind(controller);
export const getCareersOffer = controller.offer.bind(controller);
export const applyToOffer = controller.apply.bind(controller);
export const listExternalApplications = controller.listExternal.bind(controller);
export const analyseExternalApplications = controller.analyseExternal.bind(controller);
export const retainExternalApplication = controller.retainExternal.bind(controller);
export const refuseExternalApplication = controller.refuseExternal.bind(controller);
