"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";

import { askCvComparison, cvComparisonPdfUrl, cvScreeningsKey, openCvComparison } from "#/lib/api/cv-screening-controller";
import type { CvChat, CvComparison, CvResume } from "#/lib/api/types";
import { cn } from "#/lib/utils";
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
  onChooseOthers,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screeningId: string;
  jobTitle: string;
  /** Best first, as on the page. */
  resumes: CvResume[];
  /** « Choisir d'autres candidats »: those to untick, their CV being gone. */
  onChooseOthers: (resumeIds: string[]) => void;
}>) {
  const t = useTranslations("cv.compare");
  const SUGGESTIONS = t.raw("suggestions") as string[];
  const ids = resumes.map((r) => r.id).sort();
  // Short, but never two alike: « Glody M. », and more of the name where needed.
  const names = shortNames(resumes.map(fullName));
  // The conversation's id, known once it is opened.
  const comparisonId = useRef<string | null>(null);
  const queryKey = [...cvScreeningsKey, screeningId, "compare", ids.join(",")];
  const load = async () => {
    const comparison = await openCvComparison(screeningId, ids);
    comparisonId.current = comparison.id;
    return comparison;
  };
  // The sheet's own query, read here too: the header dims those missing.
  const { data: comparison } = useQuery({ queryKey, queryFn: load, enabled: open });
  const missing = new Map(comparison?.missing?.map((m) => [m.resumeId, m.reason]));
  const shortName = (id: string, fallback: string) => names[resumes.findIndex((r) => r.id === id)] ?? fallback;

  return (
    <ChatSheet
      open={open}
      onOpenChange={onOpenChange}
      queryKey={queryKey}
      load={load}
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
            <li
              key={r.id}
              title={fullName(r)}
              className={cn("flex min-w-0 items-center gap-2 rounded-full bg-page py-1 pr-3.5 pl-1", missing.has(r.id) && "line-through opacity-50")}
            >
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
      gone={(data: CvChat) => {
        const gone = (data as CvComparison).missing ?? [];
        if (gone.length === 0) return null;
        return (
          <>
            <p className="font-medium">{data.available ? t("others") : t("notEnough")}</p>
            {gone.map((m) => (
              <p key={m.resumeId}>{t(`gone.${m.reason}`, { name: shortName(m.resumeId, m.name) })}</p>
            ))}
          </>
        );
      }}
      closed={() => ({
        title: t("closed.title"),
        text: t("closed.text"),
        children: (
          <>
            <ul aria-label={t("candidates")} className="w-full space-y-2">
              {resumes.map((r) => {
                const reason = missing.get(r.id);
                return (
                  <li key={r.id} className="flex items-center gap-3 rounded-2xl bg-card p-3">
                    <ScoreRing score={r.score ?? 0} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm">{fullName(r)}</p>
                      <p className={cn("text-xs", reason ? "text-muted-foreground" : "text-chip-green-foreground")}>
                        {t(`closed.${reason ?? "available"}`)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onChooseOthers([...missing.keys()]);
              }}
              className="inline-flex h-11 items-center rounded-full bg-ink px-5 font-medium text-sm text-white hover:bg-ink/90"
            >
              {t("closed.choose")}
            </button>
          </>
        ),
      })}
    />
  );
}
