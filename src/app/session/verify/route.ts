import { NextResponse, type NextRequest } from "next/server";

import {
  backendPost,
  forbidden,
  isSameOrigin,
  readJson,
  setSessionCookies,
  type SessionTokens,
} from "#/lib/auth/session-server";

/** Exchange email + code for a session. The tokens never reach the browser's JS. */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return forbidden();

  const { email, otp } = (await readJson(req)) as {
    email?: string;
    otp?: string;
  };
  const upstream = await backendPost(req, "/auth/mobile/verify-otp", {
    emailOrPhone: email,
    otp,
  });
  const data = await readJson(upstream);
  if (!upstream.ok) return NextResponse.json(data, { status: upstream.status });

  const res = NextResponse.json({ user: data.user });
  setSessionCookies(res, data as unknown as SessionTokens);
  return res;
}
