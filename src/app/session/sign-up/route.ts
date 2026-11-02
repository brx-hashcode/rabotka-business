import { NextResponse, type NextRequest } from "next/server";

import {
  backendPost,
  forbidden,
  isSameOrigin,
  readJson,
  setSessionCookies,
  type SessionTokens,
} from "#/lib/auth/session-server";

/**
 * Create the business profile and open its session in one step. The backend
 * answers `X-Session: bearer` with the same token pair as the email login,
 * which lands in this origin's httpOnly cookies like any other sign-in.
 */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return forbidden();

  const body = await readJson(req);
  const upstream = await backendPost(req, "/profile", body, { "x-session": "bearer" });
  const data = await readJson(upstream);
  if (!upstream.ok) return NextResponse.json(data, { status: upstream.status });
  // A backend that ignored `X-Session: bearer` (one older than #934) created
  // the account and set its own cookie: no tokens to keep. That is still a
  // success — the account exists, and a retry would fail on the spent token
  // and the taken email — so say it, and let the person sign in by code.
  if (typeof data.token !== "string" || typeof data.refreshToken !== "string") {
    return NextResponse.json({ user: null, signInRequired: true });
  }

  const res = NextResponse.json({ user: data.user, signInRequired: false });
  setSessionCookies(res, data as unknown as SessionTokens);
  return res;
}
