import { appConfig } from "#/config";
import { BusinessBaseController } from "./base-controller";
import type { CvScreening, CvScreeningSummary } from "./types";

/** « Tri des CV »: CVs the AI reads and ranks against one job. */
class CvScreeningController extends BusinessBaseController {
  list(page = 0, limit = 20): Promise<{ items: CvScreeningSummary[]; total: number }> {
    return this.get(`/business/me/cv-screenings?page=${page}&limit=${limit}`);
  }

  one(id: string): Promise<CvScreening> {
    return this.get(`/business/me/cv-screenings/${encodeURIComponent(id)}`);
  }

  /** The files and the job, in one multipart request: an offer, or a title and a description. */
  create(files: File[], job: { offerId: string } | { jobTitle: string; jobText: string }): Promise<CvScreening> {
    const form = new FormData();
    for (const [key, value] of Object.entries(job)) form.append(key, value);
    for (const file of files) form.append("files", file);
    return this.post("/business/me/cv-screenings", form);
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

/** Same-origin: the preview fetches it with the session cookie. */
export function cvFileUrl(screeningId: string, resumeId: string): string {
  return `${appConfig.apiUrl}/business/me/cv-screenings/${encodeURIComponent(screeningId)}/resumes/${encodeURIComponent(resumeId)}/file`;
}

export const cvScreeningsKey = ["cv-screenings"] as const;

export const CV_ACCEPT =
  "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp,.pdf,.docx";
