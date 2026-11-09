import { BusinessBaseController } from "./base-controller";

export type Country = { code: string; name: string };

/** `GET public/config/contact` — Rabotka's own contact, set in the admin's Contact card. */
export type SupportContact = { email: string; phone: string; address: string };

/** « Demander une démo »: `POST public/business/demo-requests`. */
export type DemoRequestInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  country: string;
  companySize: string;
  interests: string[];
  message?: string;
  /** The hidden honeypot: only a bot fills it. */
  website?: string;
};

/** No session needed: the geo lists, Rabotka's contact and the demo request. */
class PublicController extends BusinessBaseController {
  getCountries(): Promise<Country[]> {
    return this.get("/public/geo/countries");
  }

  getSupportContact(): Promise<SupportContact> {
    return this.get("/public/config/contact");
  }

  requestDemo(input: DemoRequestInput): Promise<{ ok: true }> {
    return this.post("/public/business/demo-requests", input);
  }

  getCities(countryCode: string): Promise<string[]> {
    return this.get(
      `/public/geo/countries/${encodeURIComponent(countryCode)}/cities`,
    );
  }
}

const controller = new PublicController();

export const getCountries = controller.getCountries.bind(controller);
export const getCities = controller.getCities.bind(controller);
export const getSupportContact = controller.getSupportContact.bind(controller);
export const requestDemo = controller.requestDemo.bind(controller);
