"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";

import { askCvComparison, cvComparisonPdfUrl, cvScreeningsKey, openCvComparison } from "#/lib/api/cv-screening-controller";
import type { CvResume } from "#/lib/api/types";
import { ChatSheet } from "./chat-sheet";
import { ScoreRing } from "./cv-bits";



const firstName = (r: CvResume) => (r.candidate?.name ?? r.fileName).split(" ")[0];

/**
 * A conversation comparing the selected CVs of one analysis, to settle whom
 * to see first. One per selection: choosing the same CVs reopens it.
 */
export function CvCompareSheet({
  open,
  onOpenChange,
  screeningId,
  jobTitle,
  resumes,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screeningId: string;
  jobTitle: string;
  /** Best first, as on the page. */
  resumes: CvResume[];
}>) {
  const t = useTranslations("cv.compare");
  const SUGGESTIONS = t.raw("suggestions") as string[];
  const ids = resumes.map((r) => r.id).sort();
  // The conversation's id, known once it is opened.
  const comparisonId = useRef<string | null>(null);

  return (
    <ChatSheet
      open={open}
      onOpenChange={onOpenChange}
      queryKey={[...cvScreeningsKey, screeningId, "compare", ids.join(",")]}
      load={async () => {
        const comparison = await openCvComparison(screeningId, ids);
        comparisonId.current = comparison.id;
        return comparison;
      }}
      pdfUrl={() => (comparisonId.current ? cvComparisonPdfUrl(screeningId, comparisonId.current) : null)}
      ask={(question, opts) => {
        if (!comparisonId.current) return Promise.reject(new Error(t("notOpen")));
        return askCvComparison(screeningId, comparisonId.current, question, opts);
      }}
      title={t("title", { count: resumes.length })}
      subtitle={jobTitle}
      lead={
        <span className="flex shrink-0 -space-x-2">
          {resumes.slice(0, 3).map((r) => (
            <span key={r.id} className="rounded-full bg-card ring-2 ring-card">
              <ScoreRing score={r.score ?? 0} size={40} />
            </span>
          ))}
        </span>
      }
      meta={
        <span className="max-w-full truncate rounded-full bg-page px-2.5 py-1 font-medium text-xs">
          {resumes.map(firstName).join(" · ")}
        </span>
      }
      intro={{
        title: `Comparez ${resumes.map(firstName).join(", ")}`,
        text: t("intro"),
      }}
      suggestions={SUGGESTIONS}
      placeholder={t("placeholder")}
      usedUp={(limit) => t("usedUp", { limit })}
      unavailable={t("gone")}
    />
  );
}
