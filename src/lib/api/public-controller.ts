import { BusinessBaseController } from "./base-controller";

export type Country = { code: string; name: string };

/** `GET public/config/contact` — Rabotka's own contact, set in the admin's Contact card. */
export type SupportContact = { email: string; phone: string; address: string };

/** No session needed: the geo lists and Rabotka's contact. */
class PublicController extends BusinessBaseController {
  getCountries(): Promise<Country[]> {
    return this.get("/public/geo/countries");
  }

  getSupportContact(): Promise<SupportContact> {
    return this.get("/public/config/contact");
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
