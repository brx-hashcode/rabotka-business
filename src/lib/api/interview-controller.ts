import { BusinessBaseController } from "./base-controller";
import type { Interview, InterviewAnswer, InterviewInput, InterviewInvitation, InterviewSlot, VisioJoin } from "./types";

/** « Entretiens »: interviews with candidates, and the candidate's side of one. */
class InterviewController extends BusinessBaseController {
  list(
    params: { scope?: "upcoming" | "past"; cvResumeId?: string; applicationId?: string; externalApplicationId?: string } = {},
  ): Promise<Interview[]> {
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
  /** The private link of the interview calendar (made on first ask). */
  calendar(): Promise<InterviewCalendarLink> {
    return this.get("/business/me/interviews/calendar");
  }

  /** A new calendar link; the old one stops working. */
  resetCalendar(): Promise<InterviewCalendarLink> {
    return this.post("/business/me/interviews/calendar/reset");
  }


  /** Joining an interview's video call as the business: its host. */
  visioAsHost(room: string): Promise<VisioJoin> {
    return this.get(`/business/me/interviews/visio/${encodeURIComponent(room)}`);
  }

  /** Joining it by its link, signed out: the candidate. */
  visioAsGuest(room: string): Promise<VisioJoin> {
    return this.get(`/public/interviews/visio/${encodeURIComponent(room)}`);
  }

  invitation(token: string): Promise<InterviewInvitation> {
    return this.get(`/public/interviews/${encodeURIComponent(token)}`);
  }

  /** `slotId`: with CONFIRMED, the time chosen when several were offered. */
  answer(token: string, answer: InterviewAnswer, note?: string, slotId?: string): Promise<InterviewInvitation> {
    return this.post(`/public/interviews/${encodeURIComponent(token)}/answer`, {
      answer,
      ...(note ? { note } : {}),
      ...(slotId ? { slotId } : {}),
    });
  }
}

const controller = new InterviewController();

export const listInterviews = controller.list.bind(controller);
export const createInterview = controller.create.bind(controller);
export const rescheduleInterview = controller.reschedule.bind(controller);
export const cancelInterview = controller.cancel.bind(controller);
export const getInterviewCalendar = controller.calendar.bind(controller);
export const resetInterviewCalendar = controller.resetCalendar.bind(controller);
export const getInvitation = controller.invitation.bind(controller);
export const joinVisioAsHost = controller.visioAsHost.bind(controller);
export const joinVisioAsGuest = controller.visioAsGuest.bind(controller);
export const answerInvitation = controller.answer.bind(controller);

export const interviewsKey = ["interviews"] as const;
export const interviewCalendarKey = ["interviews", "calendar"] as const;

export type InterviewCalendarLink = { url: string; webcalUrl: string };

export const INTERVIEW_DURATIONS = [15, 30, 45, 60, 90, 120];
