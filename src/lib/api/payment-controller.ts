import { BusinessBaseController } from "./base-controller";
import type { PaymentByToken, PaymentGateways } from "./types";

/** The public pay API (by token), as the client app's pay page uses it. */
class PaymentController extends BusinessBaseController {
  getByToken(token: string): Promise<PaymentByToken> {
    return this.get(`/pay/${encodeURIComponent(token)}`);
  }

  getGateways(): Promise<PaymentGateways> {
    return this.get("/payment-gateways");
  }

  initiate(token: string, body: { phone: string; operator?: string }): Promise<{ success: boolean }> {
    return this.post(`/pay/${encodeURIComponent(token)}/initiate`, body);
  }
}

const controller = new PaymentController();

export const getPaymentByToken = controller.getByToken.bind(controller);
export const getPaymentGateways = controller.getGateways.bind(controller);
export const initiatePayment = controller.initiate.bind(controller);
