import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "#/lib/auth/cookies";
import { safeRedirectPath } from "#/lib/safe-redirect";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/")) return forwardApi(request);
  if (pathname.startsWith("/auth/")) return redirectSignedIn(request);
  return requireSession(request);
}

function forwardApi(request: NextRequest) {
  const backend = process.env.BACKEND_URL;
  if (!backend) {
    return NextResponse.json(
      { message: "BACKEND_URL is not configured" },
      { status: 502 },
    );
  }

  // The session lives in httpOnly cookies on this origin; the backend only
  // understands a bearer token, and never needs to see our cookies.
  const headers = new Headers(request.headers);
  headers.delete("cookie");
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (token) headers.set("authorization", `Bearer ${token}`);

  const target = new URL(request.nextUrl.pathname + request.nextUrl.search, backend);
  return NextResponse.rewrite(target, { request: { headers } });
}

function redirectSignedIn(request: NextRequest) {
  if (!request.cookies.has(REFRESH_COOKIE)) return NextResponse.next();
  const next = safeRedirectPath(request.nextUrl.searchParams.get("next")) ?? "/";
  return NextResponse.redirect(new URL(next, request.url));
}

/**
 * Every page is for a signed-in business. Without a session the visitor goes
 * to sign-in, and `next` brings them back. Whether the account really is a
 * business is the backend's answer (BusinessProfileGuard), not this cookie's.
 */
function requireSession(request: NextRequest) {
  if (request.cookies.has(REFRESH_COOKIE)) return NextResponse.next();
  const { pathname, search } = request.nextUrl;
  const url = new URL("/auth/sign-in", request.url);
  if (pathname !== "/") url.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export const config = {
  // Pages and the API; never Next's assets, the session routes or files in public/.
  matcher: [
    "/((?!_next/|session/|favicon.ico|icon|apple-icon|opengraph-image|twitter-image|manifest.json|robots.txt|fonts/|hero/|sign-in/|rabotka-).*)",
  ],
};
