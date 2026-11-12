import { BusinessBaseController } from "./base-controller";
import type {
  Interview,
  InterviewAnswer,
  InterviewInput,
  InterviewInvitation,
  InterviewReport,
  InterviewReportBody,
  InterviewSlot,
  VisioJoin,
} from "./types";

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


  /** « Compte rendu »: the team's notes and the report written from them. */
  report(id: string): Promise<InterviewReport> {
    return this.get(`/business/me/interviews/${encodeURIComponent(id)}/report`);
  }

  saveNotes(id: string, notes: string): Promise<InterviewReport> {
    return this.put(`/business/me/interviews/${encodeURIComponent(id)}/report/notes`, { notes });
  }

  /** Writes (again) the report from the notes saved: the AI, a few seconds. */
  writeReport(id: string): Promise<InterviewReport> {
    return this.post(`/business/me/interviews/${encodeURIComponent(id)}/report/write`);
  }

  editReport(id: string, report: InterviewReportBody): Promise<InterviewReport> {
    return this.patch(`/business/me/interviews/${encodeURIComponent(id)}/report`, { report });
  }

  /** By e-mail to the team: those chosen, or the members who get the hiring e-mails. */
  sendReport(id: string, memberIds?: string[]): Promise<InterviewReport & { sentTo: number }> {
    return this.post(`/business/me/interviews/${encodeURIComponent(id)}/report/send`, memberIds?.length ? { memberIds } : {});
  }

  /** Joining an interview's video call as the business: its host. */
  visioAsHost(room: string): Promise<VisioJoin> {
    return this.get(`/business/me/interviews/visio/${encodeURIComponent(room)}`);
  }

  /** Joining it by its link, signed out: the candidate. */
  /** `guestToken`: the personal link of someone the business invited; none for the candidate. */
  visioAsGuest(room: string, guestToken?: string): Promise<VisioJoin> {
    return this.get(`/public/interviews/visio/${encodeURIComponent(room)}${guestToken ? `?g=${encodeURIComponent(guestToken)}` : ""}`);
  }

  /** « Inviter quelqu'un »: who was invited into the visio. */
  guests(id: string): Promise<InterviewGuest[]> {
    return this.get(`/business/me/interviews/${encodeURIComponent(id)}/guests`);
  }

  /** A personal link by e-mail: they join under their own name, without an account. */
  inviteGuest(id: string, input: { name: string; email: string }): Promise<InterviewGuest> {
    return this.post(`/business/me/interviews/${encodeURIComponent(id)}/guests`, input);
  }

  /** Withdrawn: their link stops working. */
  removeGuest(id: string, guestId: string): Promise<unknown> {
    return this.delete(`/business/me/interviews/${encodeURIComponent(id)}/guests/${encodeURIComponent(guestId)}`);
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
export const getInterviewReport = controller.report.bind(controller);
export const saveInterviewNotes = controller.saveNotes.bind(controller);
export const writeInterviewReport = controller.writeReport.bind(controller);
export const editInterviewReport = controller.editReport.bind(controller);
export const sendInterviewReport = controller.sendReport.bind(controller);
export const interviewReportKey = (id: string) => ["interview-report", id] as const;
export const joinVisioAsHost = controller.visioAsHost.bind(controller);
export const joinVisioAsGuest = controller.visioAsGuest.bind(controller);
export const listInterviewGuests = controller.guests.bind(controller);
export const inviteInterviewGuest = controller.inviteGuest.bind(controller);
export const removeInterviewGuest = controller.removeGuest.bind(controller);
export const interviewGuestsKey = (id: string) => ["interview-guests", id] as const;

/** Someone the business invited into an interview's visio. */
export type InterviewGuest = { id: string; name: string; email: string; createdAt: string };
export const answerInvitation = controller.answer.bind(controller);

export const interviewsKey = ["interviews"] as const;
export const interviewCalendarKey = ["interviews", "calendar"] as const;

export type InterviewCalendarLink = { url: string; webcalUrl: string };

export const INTERVIEW_DURATIONS = [15, 30, 45, 60, 90, 120];
