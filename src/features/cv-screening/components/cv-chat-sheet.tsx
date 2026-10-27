"use client";

import { askCvChat, cvChatPdfUrl, cvScreeningsKey, getCvChat } from "#/lib/api/cv-screening-controller";
import type { CvResume } from "#/lib/api/types";
import { ChatSheet } from "./chat-sheet";
import { ScoreRing, VerdictChip } from "./cv-bits";

const SUGGESTIONS = [
  "Résumez son parcours en quelques lignes.",
  "Quelles questions lui poser en entretien ?",
  "Quels points vérifier avant de le retenir ?",
  "Son expérience correspond-elle au niveau demandé ?",
];

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
        title: `Interrogez le CV de ${name}`,
        text: "Parcours, compétences, points à vérifier, questions d'entretien : Rabotka répond d'après le CV et l'offre.",
      }}
      suggestions={SUGGESTIONS}
      placeholder={`Une question sur ${name.split(" ")[0]}…`}
      usedUp={(limit) => `Vous avez posé les ${limit} questions prévues pour ce CV.`}
      unavailable="Ce CV a été supprimé à la fin de sa durée de conservation : la conversation reste lisible, sans nouvelle question."
    />
  );
}
