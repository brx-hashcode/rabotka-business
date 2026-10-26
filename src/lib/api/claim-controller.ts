import { BusinessBaseController } from "./base-controller";

export type ClaimStatus = "CREATED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";

export type Claim = {
  id: string;
  title: string;
  description: string;
  status: ClaimStatus;
  attachmentUrls: string[];
  createdAt: string;
  updatedAt: string;
};

export type ClaimComment = {
  id: string;
  /** Empty for an image-only comment. */
  content: string;
  attachmentUrls?: string[];
  userId: string | null;
  userName: string | null;
  profileId: string | null;
  profileName: string | null;
  /** `user`: the Rabotka team; `profile`: the account. */
  createdByType: "user" | "profile";
  createdAt: string;
};

export type Paged<T> = { data: T[]; total: number; page: number; limit: number };

/** The client app's claim endpoints (`profile/claims/*`), unchanged. */
class ClaimController extends BusinessBaseController {
  list(page = 1, limit = 50): Promise<Paged<Claim>> {
    return this.get(`/profile/claims?page=${page}&limit=${limit}`);
  }

  one(id: string): Promise<Claim> {
    return this.get(`/profile/claims/${encodeURIComponent(id)}`);
  }

  create(body: { title: string; description: string; attachment_urls?: string[] }): Promise<Claim> {
    return this.post("/profile/claims", body);
  }

  /** Images only (JPG, PNG, WEBP), checked server side; returns their urls to reference. */
  async upload(files: File[]): Promise<string[]> {
    const form = new FormData();
    for (const f of files) form.append("files", f);
    const res = await this.post<{ files: { url: string }[] }>("/profile/claims/attachments", form);
    return res.files.map((f) => f.url);
  }

  comments(id: string): Promise<ClaimComment[]> {
    return this.get(`/profile/claims/${encodeURIComponent(id)}/comments`);
  }

  comment(id: string, body: { content?: string; attachment_urls?: string[] }): Promise<ClaimComment> {
    return this.post(`/profile/claims/${encodeURIComponent(id)}/comments`, body);
  }
}

const controller = new ClaimController();

export const listClaims = controller.list.bind(controller);
export const getClaim = controller.one.bind(controller);
export const createClaim = controller.create.bind(controller);
export const uploadClaimImages = controller.upload.bind(controller);
export const listClaimComments = controller.comments.bind(controller);
export const addClaimComment = controller.comment.bind(controller);

export const claimsKey = ["claims"] as const;

/** Mirrors the server: images only, 5 MB each; the UI keeps 3 per message as the client app does. */
export const CLAIM_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
export const CLAIM_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const CLAIM_MAX_IMAGES = 3;
