import { httpStatusOf } from "#/lib/api/friendly-error";
import type { BusinessSignUpBody, SessionUser } from "#/lib/api/types";

/** An error shaped like mvc-front-sdk's ApiError, so friendlyError reads it. */
export class SessionError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly body: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "SessionError";
  }
}

async function postSession<T>(
  path: string,
  body?: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const res = await fetchImpl(path, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const message = typeof data.message === "string" ? data.message : "";
    throw new SessionError(message, res.status, data);
  }
  return data as T;
}

/**
 * Set by a deliberate sign-out. The screens still mounted then refetch, get
 * 401s, fail to refresh — and without this the "session expired" handler
 * opened the sign-in dialog right after the person chose to leave. A new
 * sign-in clears it.
 */
let signedOut = false;

export function verifySession(input: {
  email: string;
  otp: string;
}): Promise<{ user: SessionUser }> {
  return postSession<{ user: SessionUser }>("/session/verify", input).then((result) => {
    signedOut = false;
    return result;
  });
}

/** Create the business profile and sign in with it (src/app/session/sign-up). */
export function signUpSession(body: BusinessSignUpBody): Promise<{ user: SessionUser }> {
  return postSession<{ user: SessionUser }>("/session/sign-up", body).then((result) => {
    signedOut = false;
    return result;
  });
}

export function logoutSession(): Promise<{ success: true }> {
  signedOut = true;
  return postSession("/session/logout");
}

let inflight: Promise<boolean> | null = null;

/**
 * Rotate the session once, however many requests asked.
 *
 * The refresh token is single-use: two parallel refreshes would spend it twice
 * and the second would be refused as "already used", logging the person out.
 * Every 401 that arrives while one refresh is running waits on that one.
 */
export function refreshSession(fetchImpl: typeof fetch = fetch): Promise<boolean> {
  inflight ??= postSession("/session/refresh", undefined, fetchImpl)
    .then(() => true)
    .catch(() => false)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

type ExpireHandler = () => void;
let onExpired: ExpireHandler = () => undefined;

/** Registered once by the providers: what to do when the session is gone. */
export function setSessionExpiredHandler(handler: ExpireHandler) {
  onExpired = handler;
}

/**
 * Run an API call; on a 401, refresh the session and try once more. If the
 * refresh fails too, the session is over: hand off to the expiry handler and
 * rethrow, so the caller's error state still renders.
 */
export async function withSession<T>(
  call: () => Promise<T>,
  refresh: () => Promise<boolean> = refreshSession,
): Promise<T> {
  try {
    return await call();
  } catch (error) {
    if (httpStatusOf(error) !== 401) throw error;
    if (!(await refresh())) {
      if (!signedOut) onExpired();
      throw error;
    }
    return call();
  }
}
