const OPAQUE_ORIGIN = "http://same-origin.invalid";

/**
 * A post-login destination, or null when it is not a path on this site.
 *
 * Ported from rabotka-admin's login route. Rejects absolute and
 * protocol-relative URLs (an open redirect would turn the login page into a
 * phishing hop) and anything under /auth, which would loop back to sign-in.
 */
export function safeRedirectPath(raw: string | null | undefined): string | null {
  if (!raw?.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return null;
  }
  try {
    const url = new URL(raw, OPAQUE_ORIGIN);
    if (url.origin !== OPAQUE_ORIGIN) return null;
    if (url.pathname === "/auth" || url.pathname.startsWith("/auth/")) {
      return null;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
