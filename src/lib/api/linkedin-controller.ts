import { BusinessBaseController } from "./base-controller";

/** The signed-in person's own LinkedIn: each team member connects theirs. */
export type LinkedinInfo = {
  /** False when Rabotka's LinkedIn app is not set up: the share link only. */
  available: boolean;
  account: { name: string; pictureUrl: string | null; connectedAt: string; expired: boolean } | null;
};

export type LinkedinPost = {
  id: string;
  status: "QUEUED" | "PUBLISHED" | "FAILED";
  authorName: string;
  url: string | null;
  error: string | null;
  createdAt: string;
  publishedAt: string | null;
  /** The newest post's own picture on LinkedIn; null: it carried the offer's share image. */
  imageUrl: string | null;
};

/** `business/me/linkedin`: connect, disconnect, post an offer on it. */
class LinkedinController extends BusinessBaseController {
  info(): Promise<LinkedinInfo> {
    return this.get("/business/me/linkedin");
  }

  connect(): Promise<{ url: string }> {
    return this.post("/business/me/linkedin/connect", {});
  }

  disconnect(): Promise<unknown> {
    return this.delete("/business/me/linkedin");
  }

  /**
   * Queued: the post goes out in a few seconds, then a notification says so.
   * `image` replaces the offer's share picture on the card (sent as a form).
   */
  publish(offerId: string, text: string, again = false, image?: File | null): Promise<{ id: string; status: LinkedinPost["status"] }> {
    if (!image) return this.post("/business/me/linkedin/posts", { offerId, text, ...(again ? { again } : {}) });
    const form = new FormData();
    form.append("offerId", offerId);
    form.append("text", text);
    if (again) form.append("again", "true");
    form.append("image", image);
    return this.post("/business/me/linkedin/posts", form);
  }

  posts(offerId: string): Promise<LinkedinPost[]> {
    return this.get(`/business/me/linkedin/offers/${encodeURIComponent(offerId)}/posts`);
  }
}

const controller = new LinkedinController();

export const getLinkedin = controller.info.bind(controller);
export const connectLinkedin = controller.connect.bind(controller);
export const disconnectLinkedin = controller.disconnect.bind(controller);
export const postOnLinkedin = controller.publish.bind(controller);
export const getLinkedinPosts = controller.posts.bind(controller);

export const linkedinKey = ["business", "me", "linkedin"] as const;
export const linkedinPostsKey = (offerId: string) => [...linkedinKey, "posts", offerId] as const;
