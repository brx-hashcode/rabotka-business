import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE } from "#/lib/auth/cookies";
import { forbidden, isSameOrigin } from "#/lib/auth/session-server";

/**
 * The answer about a CV, streamed. Not through src/proxy.ts: a middleware
 * rewrite hands the browser the response only once it is complete, which is
 * the one thing a streamed answer cannot have. Here the backend's body is
 * passed on as it arrives, and leaving (closing the drawer) reaches the
 * backend through the request's signal.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ screeningId: string; resumeId: string }> },
) {
  if (!isSameOrigin(req)) return forbidden();
  const backend = process.env.BACKEND_URL;
  if (!backend) return NextResponse.json({ message: "BACKEND_URL is not configured" }, { status: 502 });

  const { screeningId, resumeId } = await params;
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  const upstream = await fetch(
    new URL(
      `/api/v1/business/me/cv-screenings/${encodeURIComponent(screeningId)}/resumes/${encodeURIComponent(resumeId)}/chat`,
      backend,
    ),
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: await req.text(),
      signal: req.signal,
    },
  ).catch(() => null);

  if (!upstream) return NextResponse.json({ message: "Service indisponible" }, { status: 502 });
  // Refusals (no plan, questions used up, CV purged, session expired) are
  // plain JSON errors, passed on as they are.
  if (!upstream.ok || !upstream.body) {
    return new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
  }
  return new Response(upstream.body, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
