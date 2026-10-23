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
  // A backend that ignored `X-Session: bearer` created the account but set
  // its own cookie: no tokens to keep. Say so rather than store empty ones —
  // the account exists, and signing in by email code works.
  if (typeof data.token !== "string" || typeof data.refreshToken !== "string") {
    return NextResponse.json(
      { message: "Votre compte est créé. Connectez-vous avec votre adresse email pour y accéder." },
      { status: 502 },
    );
  }

  const res = NextResponse.json({ user: data.user });
  setSessionCookies(res, data as unknown as SessionTokens);
  return res;
}
