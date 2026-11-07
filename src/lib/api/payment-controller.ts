import { BusinessBaseController } from "./base-controller";
import type { PaymentByToken, PaymentCurrency, PaymentGateways } from "./types";

/** The public pay API (by token), as the client app's pay page uses it. */
class PaymentController extends BusinessBaseController {
  getByToken(token: string): Promise<PaymentByToken> {
    return this.get(`/pay/${encodeURIComponent(token)}`);
  }

  getGateways(): Promise<PaymentGateways> {
    return this.get("/payment-gateways");
  }

  /** The currency a country's prices are shown and charged in, and how to convert. */
  getCurrency(country: string): Promise<PaymentCurrency> {
    return this.get(`/payment-currency/${encodeURIComponent(country)}`);
  }

  initiate(token: string, body: { phone: string; operator?: string }): Promise<{ success: boolean }> {
    return this.post(`/pay/${encodeURIComponent(token)}/initiate`, body);
  }
}

const controller = new PaymentController();

export const getPaymentByToken = controller.getByToken.bind(controller);
export const getPaymentGateways = controller.getGateways.bind(controller);
export const initiatePayment = controller.initiate.bind(controller);
export const getPaymentCurrency = controller.getCurrency.bind(controller);
