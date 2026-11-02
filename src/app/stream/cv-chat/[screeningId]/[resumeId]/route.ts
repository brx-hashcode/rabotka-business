import type { NextRequest } from "next/server";

import { streamFromBackend } from "#/lib/auth/stream-proxy";

/** The answer about one CV, streamed (see streamFromBackend). */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ screeningId: string; resumeId: string }> },
) {
  const { screeningId, resumeId } = await params;
  return streamFromBackend(
    req,
    `/api/v1/business/me/cv-screenings/${encodeURIComponent(screeningId)}/resumes/${encodeURIComponent(resumeId)}/chat`,
  );
}
