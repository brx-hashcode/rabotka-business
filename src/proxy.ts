import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "#/lib/auth/cookies";
import { safeRedirectPath } from "#/lib/safe-redirect";
import { appConfig } from "#/config";

const HOME = appConfig.homePath;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/")) return forwardApi(request);
  // Socket.IO's long-polling transport is plain HTTP: it goes the same way,
  // so the socket is authenticated by the same cookie-to-bearer swap. Next
  // redirects away a trailing slash, so it arrives without the one the
  // server's path has (see use-notifications-socket).
  if (pathname === "/socket.io") return forwardApi(request, "/socket.io/");
  if (pathname.startsWith("/auth/")) return redirectSignedIn(request);
  if (pathname === "/") return landing(request);
  return requireSession(request);
}

function forwardApi(request: NextRequest, path = request.nextUrl.pathname) {
  const backend = process.env.BACKEND_URL;
  if (!backend) {
    return NextResponse.json(
      { message: "BACKEND_URL is not configured" },
      { status: 502 },
    );
  }

  // The session lives in httpOnly cookies on this origin; the backend only
  // understands a bearer token, and never needs to see our cookies.
  //
  // Origin and Referer go too. The backend refuses a cookie-less POST whose
  // Origin is not in its ALLOW_ORIGINS — a CSRF check on ITS session cookie,
  // which never travels from here. Without this the anonymous sign-up calls
  // (send-otp, uploads) would need this site listed there; with it, the
  // request is what it is, a server-to-server call.
  const headers = new Headers(request.headers);
  headers.delete("cookie");
  headers.delete("origin");
  headers.delete("referer");
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (token) headers.set("authorization", `Bearer ${token}`);

  const target = new URL(path + request.nextUrl.search, backend);
  return NextResponse.rewrite(target, { request: { headers } });
}

function redirectSignedIn(request: NextRequest) {
  if (!request.cookies.has(REFRESH_COOKIE)) return NextResponse.next();
  const next = safeRedirectPath(request.nextUrl.searchParams.get("next")) ?? HOME;
  return NextResponse.redirect(new URL(next, request.url));
}

/** The public landing page; a signed-in business goes straight to its space. */
function landing(request: NextRequest) {
  if (!request.cookies.has(REFRESH_COOKIE)) return NextResponse.next();
  return NextResponse.redirect(new URL(HOME, request.url));
}

/**
 * Every page but the landing is for a signed-in business. Without a session the visitor goes
 * to sign-in, and `next` brings them back. Whether the account really is a
 * business is the backend's answer (BusinessProfileGuard), not this cookie's.
 */
function requireSession(request: NextRequest) {
  if (request.cookies.has(REFRESH_COOKIE)) return NextResponse.next();
  const { pathname, search } = request.nextUrl;
  const url = new URL("/auth/sign-in", request.url);
  if (pathname !== HOME) url.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export const config = {
  // Pages and the API; never Next's assets, the session routes or files in public/.
  matcher: [
    "/((?!_next/|session/|favicon.ico|icon|apple-icon|opengraph-image|twitter-image|manifest.json|robots.txt|fonts/|media/|rabotka-).*)",
  ],
};
