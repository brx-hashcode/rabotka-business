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

/** A business's public careers page (`public/careers/*`): no session. */
class CareersController extends BusinessBaseController {
  company(slug: string): Promise<{ company: CareersCompany; offers: CareersOfferSummary[] }> {
    return this.get(`/public/careers/${encodeURIComponent(slug)}`);
  }

  offer(slug: string, reference: string): Promise<{ company: CareersCompany; offer: CareersOffer }> {
    return this.get(`/public/careers/${encodeURIComponent(slug)}/offers/${encodeURIComponent(reference)}`);
  }
}

const controller = new CareersController();

export const getCareersCompany = controller.company.bind(controller);
export const getCareersOffer = controller.offer.bind(controller);
