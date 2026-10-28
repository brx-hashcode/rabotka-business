import { appConfig } from "#/config";
import { refreshSession, SessionError } from "#/lib/auth/session-client";
import { BusinessBaseController } from "./base-controller";
import type { MailAttachmentRef } from "./mailbox-controller";
import { parseSse } from "./sse";
import type { CvChat, CvComparison, CvScreening, CvScreeningSummary } from "./types";

/** « Analyse de CV »: CVs the AI reads and ranks against one job. */
class CvScreeningController extends BusinessBaseController {
  list(page = 0, limit = 20): Promise<{ items: CvScreeningSummary[]; total: number }> {
    return this.get(`/business/me/cv-screenings?page=${page}&limit=${limit}`);
  }

  one(id: string): Promise<CvScreening> {
    return this.get(`/business/me/cv-screenings/${encodeURIComponent(id)}`);
  }

  /**
   * The files and the job, in one multipart request: an offer, or a title and a
   * description. CVs ticked in a connected mailbox go as references; the server reads them.
   */
  create(
    files: File[],
    job: { offerId: string } | { jobTitle: string; jobText: string },
    mailAttachments: MailAttachmentRef[] = [],
  ): Promise<CvScreening> {
    const form = new FormData();
    for (const [key, value] of Object.entries(job)) form.append(key, value);
    for (const file of files) form.append("files", file);
    if (mailAttachments.length) form.append("mailAttachments", JSON.stringify(mailAttachments));
    return this.post("/business/me/cv-screenings", form);
  }

  chat(id: string, resumeId: string): Promise<CvChat> {
    return this.get(`/business/me/cv-screenings/${encodeURIComponent(id)}/resumes/${encodeURIComponent(resumeId)}/chat`);
  }

  /** Opens (or reopens) the conversation comparing these CVs. */
  compare(id: string, resumeIds: string[]): Promise<CvComparison> {
    return this.post(`/business/me/cv-screenings/${encodeURIComponent(id)}/comparisons`, { resumeIds });
  }

  remove(id: string): Promise<unknown> {
    return this.delete(`/business/me/cv-screenings/${encodeURIComponent(id)}`);
  }
}

const controller = new CvScreeningController();

export const listCvScreenings = controller.list.bind(controller);
export const getCvScreening = controller.one.bind(controller);
export const createCvScreening = controller.create.bind(controller);
export const deleteCvScreening = controller.remove.bind(controller);
export const getCvChat = controller.chat.bind(controller);
export const openCvComparison = controller.compare.bind(controller);

type AskOptions = { signal: AbortSignal; onText: (text: string) => void };

/** Asks about one CV; `onText` gets the answer as it is written. */
export function askCvChat(screeningId: string, resumeId: string, question: string, opts: AskOptions) {
  return askStream(`/stream/cv-chat/${encodeURIComponent(screeningId)}/${encodeURIComponent(resumeId)}`, question, opts);
}

/** Asks about the compared CVs; `onText` gets the answer as it is written. */
export function askCvComparison(screeningId: string, comparisonId: string, question: string, opts: AskOptions) {
  return askStream(`/stream/cv-compare/${encodeURIComponent(screeningId)}/${encodeURIComponent(comparisonId)}`, question, opts);
}

/**
 * Resolves with the questions left once the answer is complete. Through a
 * stream route, not the API proxy (which would hold the answer until the
 * end); a 401 refreshes the session once, as every other call does.
 */
export type AskResult = {
  remaining: number | null;
  /** Set when the question was outside the recruitment: the reply to show, nothing saved or counted. */
  offTopic: string | null;
};

async function askStream(url: string, question: string, { signal, onText }: AskOptions): Promise<AskResult> {
  const send = () =>
    fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question }),
      signal,
    });
  let res = await send();
  if (res.status === 401 && (await refreshSession())) res = await send();
  if (!res.ok || !res.body) {
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    throw new SessionError(typeof data.message === "string" ? data.message : "", res.status, data);
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let remaining: number | null = null;
  let offTopic: string | null = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const parsed = parseSse(buffer + value);
    buffer = parsed.rest;
    for (const { event, data } of parsed.events) {
      if (event === "delta" && typeof data.text === "string") onText(data.text);
      else if (event === "done") remaining = typeof data.remaining === "number" ? data.remaining : null;
      else if (event === "off_topic" && typeof data.message === "string") offTopic = data.message;
      else if (event === "error") throw new SessionError(typeof data.message === "string" ? data.message : "", 502, data);
    }
  }
  return { remaining, offTopic };
}

/** Same-origin: the preview fetches it with the session cookie. */
export function cvFileUrl(screeningId: string, resumeId: string): string {
  return `${appConfig.apiUrl}/business/me/cv-screenings/${encodeURIComponent(screeningId)}/resumes/${encodeURIComponent(resumeId)}/file`;
}

/** One CV's conversation, as a PDF (same-origin, through the API proxy). */
export function cvChatPdfUrl(screeningId: string, resumeId: string): string {
  return `${appConfig.apiUrl}/business/me/cv-screenings/${encodeURIComponent(screeningId)}/resumes/${encodeURIComponent(resumeId)}/chat.pdf`;
}

/** A comparison's conversation, as a PDF. */
export function cvComparisonPdfUrl(screeningId: string, comparisonId: string): string {
  return `${appConfig.apiUrl}/business/me/cv-screenings/${encodeURIComponent(screeningId)}/comparisons/${encodeURIComponent(comparisonId)}/chat.pdf`;
}

export const cvScreeningsKey = ["cv-screenings"] as const;

export const CV_ACCEPT =
  "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp,.pdf,.docx";
