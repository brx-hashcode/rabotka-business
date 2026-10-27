import type { NextRequest } from "next/server";

import { streamFromBackend } from "#/lib/auth/stream-proxy";

/** The answer about several compared CVs, streamed (see streamFromBackend). */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ screeningId: string; comparisonId: string }> },
) {
  const { screeningId, comparisonId } = await params;
  return streamFromBackend(
    req,
    `/api/v1/business/me/cv-screenings/${encodeURIComponent(screeningId)}/comparisons/${encodeURIComponent(comparisonId)}/chat`,
  );
}
