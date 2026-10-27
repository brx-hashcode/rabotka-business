import { BusinessBaseController } from "./base-controller";
import type { Interview, InterviewAnswer, InterviewInput, InterviewInvitation, InterviewSlot } from "./types";

/** « Entretiens »: interviews with candidates, and the candidate's side of one. */
class InterviewController extends BusinessBaseController {
  list(params: { scope?: "upcoming" | "past"; cvResumeId?: string; applicationId?: string } = {}): Promise<Interview[]> {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
    return this.get(`/business/me/interviews${qs.size ? `?${qs}` : ""}`);
  }

  create(input: InterviewInput): Promise<Interview> {
    return this.post("/business/me/interviews", input);
  }

  reschedule(id: string, slot: InterviewSlot): Promise<Interview> {
    return this.patch(`/business/me/interviews/${encodeURIComponent(id)}`, slot);
  }

  cancel(id: string): Promise<Interview> {
    return this.post(`/business/me/interviews/${encodeURIComponent(id)}/cancel`);
  }

  invitation(token: string): Promise<InterviewInvitation> {
    return this.get(`/public/interviews/${encodeURIComponent(token)}`);
  }

  answer(token: string, answer: InterviewAnswer, note?: string): Promise<InterviewInvitation> {
    return this.post(`/public/interviews/${encodeURIComponent(token)}/answer`, { answer, ...(note ? { note } : {}) });
  }
}

const controller = new InterviewController();

export const listInterviews = controller.list.bind(controller);
export const createInterview = controller.create.bind(controller);
export const rescheduleInterview = controller.reschedule.bind(controller);
export const cancelInterview = controller.cancel.bind(controller);
export const getInvitation = controller.invitation.bind(controller);
export const answerInvitation = controller.answer.bind(controller);

export const interviewsKey = ["interviews"] as const;

export const INTERVIEW_DURATIONS = [15, 30, 45, 60, 90, 120];
