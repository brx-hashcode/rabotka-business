import { BusinessBaseController } from "./base-controller";

/**
 * `auth/*` calls the browser makes directly. The ones that hand out tokens
 * (verify, refresh, logout) go through src/app/session instead, so the tokens
 * land in httpOnly cookies — see lib/auth/session-client.ts.
 *
 * The `business/` routes are the backend's bearer-token login for this space:
 * the account holder or one of its team members, by email code, with the
 * tokens returned in the body rather than set as a cookie on the API's domain.
 */
class AuthController extends BusinessBaseController {
  sendOtp(email: string): Promise<{ success: true }> {
    return this.post("/auth/business/send-otp", { email });
  }

  resendOtp(email: string): Promise<{ success: true }> {
    return this.post("/auth/business/resend-otp", { email });
  }
}

const controller = new AuthController();

export const sendOtp = controller.sendOtp.bind(controller);
export const resendOtp = controller.resendOtp.bind(controller);
