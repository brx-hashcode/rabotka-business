import { appConfig } from "#/config";
import { BusinessBaseController } from "./base-controller";
import type { MyBusiness, UpdateMyBusiness } from "./types";

/** The signed-in business's own routes (`business/*`, BusinessProfileGuard). */
class BusinessController extends BusinessBaseController {
  getMe(): Promise<MyBusiness> {
    return this.get("/business/me");
  }

  /** `reopened`: the edit touched what the review checked, so it is reviewed again. */
  updateMe(body: UpdateMyBusiness): Promise<{ business: MyBusiness; reopened: boolean }> {
    return this.patch("/business/me", body);
  }

  /** The logo is the account's profile picture (POST profile/avatar). */
  uploadLogo(file: File): Promise<{ avatarUrl: string }> {
    const form = new FormData();
    form.append("avatar", file);
    return this.post("/profile/avatar", form);
  }

  /** A new paper, or the replacement of a refused one (`replacesId`). */
  uploadDocument(file: File, documentType: string, replacesId?: string): Promise<MyBusiness> {
    const form = new FormData();
    form.append("file", file);
    form.append("documentType", documentType);
    if (replacesId) form.append("replacesId", replacesId);
    return this.post("/business/me/documents", form);
  }
}

const controller = new BusinessController();

/** React Query key of `GET business/me`. */
export const myBusinessKey = ["business", "me"] as const;

export const getMyBusiness = controller.getMe.bind(controller);
export const updateMyBusiness = controller.updateMe.bind(controller);
export const uploadMyBusinessDocument = controller.uploadDocument.bind(controller);
export const uploadMyBusinessLogo = controller.uploadLogo.bind(controller);

/** A paper's bytes, same-origin: the proxy adds the session. */
export function myBusinessDocumentUrl(documentId: string): string {
  return `${appConfig.apiUrl}/business/me/documents/${encodeURIComponent(documentId)}/raw`;
}
