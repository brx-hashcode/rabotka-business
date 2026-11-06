export const appConfig = {
  appName: "Rabotka Business",
  apiUrl: "/api/v1",
  /** Where a signed-in business lands; "/" is the public landing page. */
  homePath: "/espace",
  defaultPaginationLimit: 12,
  /** The worker-facing app: public portfolios live there (`/p/:slug`). */
  clientUrl: (process.env.NEXT_PUBLIC_CLIENT_URL ?? "https://www.rabotka.work").replace(/\/+$/, ""),
  /**
   * A worker's sign-up: it happens in the WhatsApp conversation, not on a
   * page. The client app's short link (its own prefilled message, repointable
   * in WhatsApp Manager without a deploy).
   */
  workerSignupUrl: "https://wa.me/message/U54TM7P5VLMBE1",
} as const;
