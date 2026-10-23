import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "./cookies";

export type SessionTokens = { token: string; refreshToken: string };

/** Fallback lifetime when a token carries no readable `exp`. */
const DEFAULT_MAX_AGE = 15 * 60;

/**
 * Seconds until a JWT expires, read from its payload without verifying it —
 * only to size the cookie. Verifying is the backend's job on every request.
 */
export function jwtMaxAge(token: string, now = Date.now()): number {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8"),
    ) as { exp?: unknown };
    if (typeof payload.exp !== "number") return DEFAULT_MAX_AGE;
    return Math.max(Math.floor(payload.exp - now / 1000), 0);
  } catch {
    return DEFAULT_MAX_AGE;
  }
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: process.env.NODE_ENV === "production",
} as const;

export function setSessionCookies(res: NextResponse, tokens: SessionTokens) {
  res.cookies.set(ACCESS_COOKIE, tokens.token, {
    ...cookieOptions,
    maxAge: jwtMaxAge(tokens.token),
  });
  res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...cookieOptions,
    maxAge: jwtMaxAge(tokens.refreshToken),
  });
}

export function clearSessionCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}

/**
 * The session routes take only same-origin calls. SameSite=Lax already keeps
 * the cookies off cross-site POSTs; this also refuses the request itself.
 */
export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * POST to rabotka-backend from the server. Forwards the caller's address and
 * browser so the backend's login audit records the person, not this container.
 */
export function backendPost(
  req: NextRequest,
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<Response> {
  const backend = process.env.BACKEND_URL;
  if (!backend) throw new Error("BACKEND_URL is not configured");

  const forwarded: Record<string, string> = {};
  const ua = req.headers.get("user-agent");
  const xff = req.headers.get("x-forwarded-for");
  if (ua) forwarded["user-agent"] = ua;
  if (xff) forwarded["x-forwarded-for"] = xff;

  return fetch(new URL(`/api/v1${path}`, backend), {
    method: "POST",
    headers: { "content-type": "application/json", ...forwarded, ...headers },
    body: JSON.stringify(body ?? {}),
    cache: "no-store",
  });
}

export async function readJson(source: {
  json(): Promise<unknown>;
}): Promise<Record<string, unknown>> {
  try {
    return (await source.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function forbidden() {
  return NextResponse.json({ message: "Requête refusée" }, { status: 403 });
}
