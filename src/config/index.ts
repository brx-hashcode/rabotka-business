export const appConfig = {
  appName: "Rabotka Business",
  apiUrl: "/api/v1",
  /** Where a signed-in business lands; "/" is the public landing page. */
  homePath: "/espace",
  defaultPaginationLimit: 12,
  /** The worker-facing app: public portfolios live there (`/p/:slug`). */
  clientUrl: (process.env.NEXT_PUBLIC_CLIENT_URL ?? "https://www.rabotka.work").replace(/\/+$/, ""),
} as const;
