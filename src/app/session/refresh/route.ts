import { NextResponse, type NextRequest } from "next/server";

import { REFRESH_COOKIE } from "#/lib/auth/cookies";
import {
  backendPost,
  clearSessionCookies,
  forbidden,
  isSameOrigin,
  readJson,
  setSessionCookies,
  type SessionTokens,
} from "#/lib/auth/session-server";

/**
 * Rotate the token pair. The refresh token is single-use, so the client calls
 * this once per burst of 401s (see session-client.ts), never per request.
 */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return forbidden();

  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    const upstream = await backendPost(req, "/auth/mobile/refresh", {
      refreshToken,
    });
    if (upstream.ok) {
      const data = await readJson(upstream);
      const res = NextResponse.json({ user: data.user });
      setSessionCookies(res, data as unknown as SessionTokens);
      return res;
    }
  }

  const res = NextResponse.json(
    { message: "Session expirée" },
    { status: 401 },
  );
  clearSessionCookies(res);
  return res;
}
