import { BusinessBaseController } from "./base-controller";
import type { BusinessCatalog, UploadedFile } from "./types";

/** Header carrying the token from signup/verify-otp (SignupUploadGuard). */
const SIGNUP_TOKEN_HEADER = "X-Signup-Token";

/**
 * The business sign-up, before any session exists: the email code, the
 * catalog the form is built from, the document uploads. Creating the profile
 * goes through src/app/session/sign-up instead, so its tokens land in
 * httpOnly cookies.
 */
class SignUpController extends BusinessBaseController {
  getCatalog(): Promise<BusinessCatalog> {
    return this.get("/public/business/catalog");
  }

  /** A code to the email; the account holder's name feeds drop-off tracking. */
  sendCode(body: { email: string; firstName: string; lastName: string }): Promise<{ success: true }> {
    return this.post("/auth/signup/send-otp", { ...body, profileType: "EMPLOYER" });
  }

  verifyCode(email: string, code: string): Promise<{ signupToken: string; expiresIn: number }> {
    return this.post("/auth/signup/verify-otp", { email, code });
  }

  uploadDocument(file: File, signupToken: string): Promise<UploadedFile> {
    const form = new FormData();
    form.append("file", file);
    return this.post("/profile/kyc-upload", form, { [SIGNUP_TOKEN_HEADER]: signupToken });
  }

  /** Drop-off tracking: the screen reached. Never fails the sign-up. */
  reportProgress(stage: "DOCUMENTS" | "CONFIRMATION", signupToken: string): Promise<unknown> {
    return this.post(
      "/auth/signup/progress",
      { stage, profileType: "EMPLOYER" },
      { [SIGNUP_TOKEN_HEADER]: signupToken },
    ).catch(() => undefined);
  }
}

const controller = new SignUpController();

export const getBusinessCatalog = controller.getCatalog.bind(controller);
export const sendSignUpCode = controller.sendCode.bind(controller);
export const verifySignUpCode = controller.verifyCode.bind(controller);
export const uploadSignUpDocument = controller.uploadDocument.bind(controller);
export const reportSignUpProgress = controller.reportProgress.bind(controller);
