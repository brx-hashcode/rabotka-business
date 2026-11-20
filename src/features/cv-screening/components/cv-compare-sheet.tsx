"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";

import { askCvComparison, cvComparisonPdfUrl, cvScreeningsKey, openCvComparison } from "#/lib/api/cv-screening-controller";
import type { CvResume } from "#/lib/api/types";
import { shortNames } from "../short-names";
import { ChatSheet } from "./chat-sheet";
import { ScoreRing } from "./cv-bits";

const fullName = (r: CvResume) => r.candidate?.name ?? r.fileName;

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
  // Short, but never two alike: « Glody M. », and more of the name where needed.
  const names = shortNames(resumes.map(fullName));
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
      meta={
        <ul aria-label={t("candidates")} className="flex flex-wrap gap-2">
          {resumes.map((r, i) => (
            <li key={r.id} title={fullName(r)} className="flex min-w-0 items-center gap-2 rounded-full bg-page py-1 pr-3.5 pl-1">
              <ScoreRing score={r.score ?? 0} size={36} />
              <span className="truncate font-medium text-sm">{names[i]}</span>
            </li>
          ))}
        </ul>
      }
      intro={{
        title: t("introTitle", { names: names.join(", ") }),
        text: t("intro"),
      }}
      suggestions={SUGGESTIONS}
      placeholder={t("placeholder")}
      usedUp={(limit) => t("usedUp", { limit })}
      unavailable={t("gone")}
    />
  );
}
