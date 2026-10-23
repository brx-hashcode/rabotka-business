import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "#/lib/auth/cookies";
import {
  backendPost,
  clearSessionCookies,
  forbidden,
  isSameOrigin,
} from "#/lib/auth/session-server";

/** Revoke the session upstream, then drop the cookies whatever it answered. */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return forbidden();

  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (accessToken) {
    await backendPost(
      req,
      "/auth/mobile/logout",
      { refreshToken },
      { authorization: `Bearer ${accessToken}` },
    ).catch(() => undefined);
  }

  const res = NextResponse.json({ success: true });
  clearSessionCookies(res);
  return res;
}
