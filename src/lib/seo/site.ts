import { headers } from "next/headers";

import { isIndexedHost } from "./indexed-host";

/** The request's own origin, as the root layout reads it behind the tunnel. */
export async function siteOrigin(): Promise<{ origin: string; indexed: boolean }> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3500";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return { origin: `${proto}://${host}`, indexed: isIndexedHost(host) };
}
