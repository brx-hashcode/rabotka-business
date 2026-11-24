"use client";

import { useTranslations } from "next-intl";
import { askCvChat, cvChatPdfUrl, cvScreeningsKey, getCvChat } from "#/lib/api/cv-screening-controller";
import type { CvResume } from "#/lib/api/types";
import { ChatSheet } from "./chat-sheet";
import { ScoreRing, VerdictChip } from "./cv-bits";



/** The conversation about one analysed CV. Kept per CV; the plan sets how many questions one CV allows. */
export function CvChatSheet({
  open,
  onOpenChange,
  screeningId,
  jobTitle,
  resume,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screeningId: string;
  jobTitle: string;
  resume: CvResume;
}>) {
  const t = useTranslations("cv.chat");
  const SUGGESTIONS = t.raw("suggestions") as string[];
  const name = resume.candidate?.name ?? resume.fileName;
  return (
    <ChatSheet
      open={open}
      onOpenChange={onOpenChange}
      queryKey={[...cvScreeningsKey, screeningId, resume.id, "chat"]}
      load={() => getCvChat(screeningId, resume.id)}
      ask={(question, opts) => askCvChat(screeningId, resume.id, question, opts)}
      pdfUrl={() => cvChatPdfUrl(screeningId, resume.id)}
      title={name}
      subtitle={jobTitle}
      lead={resume.score !== null && <ScoreRing score={resume.score} size={48} />}
      meta={resume.score !== null && <VerdictChip score={resume.score} />}
      intro={{
        title: t("introTitle", { name }),
        text: t("intro"),
      }}
      suggestions={SUGGESTIONS}
      placeholder={t("placeholder", { name: name.split(" ")[0] })}
      usedUp={(limit) => t("usedUp", { limit })}
      gone={(data) => (data.available ? null : <p>{t(`gone.${data.reason ?? "expired"}`, { name })}</p>)}
    />
  );
}
