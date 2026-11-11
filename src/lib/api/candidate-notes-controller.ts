import { BusinessBaseController } from "./base-controller";
import type { MemberRole } from "./team-controller";

/** A Rabotka application, or one from the careers page. */
export type ApplicationKind = "rabotka" | "external";
export type Verdict = "YES" | "MAYBE" | "NO";
export type Author = { id: string; name: string; role: MemberRole };

export type CandidateNote = { id: string; body: string; createdAt: string; edited: boolean; author: Author; mine: boolean };
export type Opinions = {
  mine: Verdict | null;
  all: { member: Author; verdict: Verdict; at: string }[];
  summary: Record<Verdict, number>;
};
export type TimelineEvent = {
  at: string;
  kind: "APPLIED" | "VIEWED" | "RETAINED" | "REFUSED" | "WITHDRAWN" | "INTERVIEW" | "REPORT" | "NOTE" | "OPINION";
  member?: Author | null;
  verdict?: Verdict;
  interview?: { startsAt: string; status: string };
  /** WITHDRAWN: who ended it. Absent from an older backend. */
  cancelledBy?: "WORKER" | "EMPLOYER" | "SYSTEM" | null;
};
export type OfferOpinions = Record<ApplicationKind, Record<string, Record<Verdict, number>>>;

const base = (kind: ApplicationKind, id: string) => `/business/me/applications/${kind}/${encodeURIComponent(id)}`;

/** The team's private side of a candidate (never shown to the candidate). */
class CandidateNotesController extends BusinessBaseController {
  notes(kind: ApplicationKind, id: string): Promise<CandidateNote[]> {
    return this.get(`${base(kind, id)}/notes`);
  }
  addNote(kind: ApplicationKind, id: string, body: string): Promise<CandidateNote[]> {
    return this.post(`${base(kind, id)}/notes`, { body });
  }
  editNote(kind: ApplicationKind, id: string, noteId: string, body: string): Promise<CandidateNote[]> {
    return this.patch(`${base(kind, id)}/notes/${encodeURIComponent(noteId)}`, { body });
  }
  deleteNote(kind: ApplicationKind, id: string, noteId: string): Promise<CandidateNote[]> {
    return this.delete(`${base(kind, id)}/notes/${encodeURIComponent(noteId)}`);
  }
  opinions(kind: ApplicationKind, id: string): Promise<Opinions> {
    return this.get(`${base(kind, id)}/opinion`);
  }
  setOpinion(kind: ApplicationKind, id: string, verdict: Verdict): Promise<Opinions> {
    return this.put(`${base(kind, id)}/opinion`, { verdict });
  }
  clearOpinion(kind: ApplicationKind, id: string): Promise<Opinions> {
    return this.delete(`${base(kind, id)}/opinion`);
  }
  timeline(kind: ApplicationKind, id: string): Promise<TimelineEvent[]> {
    return this.get(`${base(kind, id)}/timeline`);
  }
  offerOpinions(offerId: string): Promise<OfferOpinions> {
    return this.get(`/business/me/offers/${encodeURIComponent(offerId)}/opinions`);
  }
}

const c = new CandidateNotesController();
export const getNotes = c.notes.bind(c);
export const addNote = c.addNote.bind(c);
export const editNote = c.editNote.bind(c);
export const deleteNote = c.deleteNote.bind(c);
export const getOpinions = c.opinions.bind(c);
export const setOpinion = c.setOpinion.bind(c);
export const clearOpinion = c.clearOpinion.bind(c);
export const getTimeline = c.timeline.bind(c);
export const getOfferOpinions = c.offerOpinions.bind(c);

export const candidateKey = (kind: ApplicationKind, id: string) => ["candidate-team", kind, id] as const;
export const offerOpinionsKey = (offerId: string) => ["offer-opinions", offerId] as const;

export const VERDICT_LABEL: Record<Verdict, string> = { YES: "Oui", MAYBE: "Peut-être", NO: "Non" };
