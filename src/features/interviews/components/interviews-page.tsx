"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  IconCalendarEvent,
  IconCalendarMonth,
  IconCalendarPlus,
  IconCalendarRepeat,
  IconCircleCheck,
  IconHourglass,
  IconLayoutGrid,
} from "@tabler/icons-react";

import { CardGridSkeleton, TilesSkeleton } from "#/components/page-skeletons";
import { StatTile } from "#/features/home/components/stat-tile";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import { interviewsKey, listInterviews } from "#/lib/api/interview-controller";
import type { Interview } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { CalendarLinkDialog } from "./calendar-link-dialog";
import { InterviewCard } from "./interview-card";
import { InterviewReportDialog } from "./interview-report-panel";
import { InterviewsCalendar } from "./interviews-calendar";
import { useVideoPlan } from "../use-video-plan";
import { useVisioWarm } from "../visio-warm";

const VIEWS = [
  { key: "calendrier", icon: IconCalendarMonth },
  { key: "liste", icon: IconLayoutGrid },
] as const;

const TABS = [{ key: "upcoming" }, { key: "past" }] as const;

/** The business's interviews as cards, in date order: who, when, how, and what the candidate answered. */
export function InterviewsPage() {
  const t = useTranslations("interviews.page");
  const friendlyError = useFriendlyError();
  const [calendarOpen, setCalendarOpen] = useState(false);
  // The tab lives in the URL (?onglet=), so a reload or a shared link keeps it.
  const [tab, setTab] = useQueryState("onglet", parseAsStringLiteral(["upcoming", "past"] as const).withDefault("upcoming"));
  // The calendar first, or the cards (?vue=liste), kept on reload too.
  const [view, setView] = useQueryState("vue", parseAsStringLiteral(["calendrier", "liste"] as const).withDefault("calendrier"));
  // The upcoming ones feed the tiles whatever the tab.
  const upcoming = useQuery({ queryKey: [...interviewsKey, "upcoming"], queryFn: () => listInterviews({ scope: "upcoming" }) });
  useVisioWarm(upcoming.data, useVideoPlan().allowed);
  // « Votre compte rendu est prêt » links here (?compte-rendu=): that report, opened over the page.
  const [reportId, setReportId] = useQueryState("compte-rendu");
  const past = useQuery({
    queryKey: [...interviewsKey, "past"],
    queryFn: () => listInterviews({ scope: "past" }),
    enabled: tab === "past" || Boolean(reportId),
  });
  const reportFor = reportId ? [...(past.data ?? []), ...(upcoming.data ?? [])].find((i) => i.id === reportId) : undefined;
  const query = tab === "upcoming" ? upcoming : past;
  const items = query.data ?? [];

  // Opened from a notification on one interview: its tab, then its card in view.
  const focusId = useSearchParams().get("entretien");
  const inUpcoming = (upcoming.data ?? []).some((i) => i.id === focusId);
  useEffect(() => {
    if (!focusId || !upcoming.isSuccess) return;
    const want = inUpcoming ? "upcoming" : "past";
    if (tab !== want) void setTab(want);
    // The card is highlighted in the list, whatever view was open last.
    if (view !== "liste") void setView("liste");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the tab is chosen once the list is in
  }, [focusId, upcoming.isSuccess, inUpcoming]);
  const shown = items.some((i) => i.id === focusId);
  useEffect(() => {
    if (!focusId || !shown) return;
    const t = setTimeout(
      () => document.getElementById(`entretien-${focusId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
      150,
    );
    return () => clearTimeout(t);
  }, [focusId, shown]);

  const live = (upcoming.data ?? []).filter((i) => i.status !== "CANCELLED");
  const count = (status: Interview["status"]) => live.filter((i) => i.status === status).length;

  return (
    <div className="w-full space-y-6 pt-2">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="font-semibold text-3xl tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("intro")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div role="tablist" aria-label={t("display")} className="inline-flex h-12 items-center rounded-full bg-card p-1">
            {VIEWS.map((v) => (
              <button
                key={v.key}
                type="button"
                role="tab"
                aria-selected={view === v.key}
                onClick={() => void setView(v.key)}
                className={cn(
                  "inline-flex h-full items-center gap-2 rounded-full px-4 font-medium text-sm",
                  view === v.key ? "bg-selected text-selected-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <v.icon className="size-4" />
                {t(`views.${v.key}`)}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-card px-5 font-medium hover:bg-card/70"
          >
            <IconCalendarPlus className="size-4" />
            {t("addToCalendar")}
          </button>
        </div>
      </div>
      <CalendarLinkDialog open={calendarOpen} onOpenChange={setCalendarOpen} />

      {upcoming.isLoading ? (
        <div className="rounded-3xl bg-card p-6 sm:p-8">
          <TilesSkeleton />
        </div>
      ) : (
        upcoming.data && (
          <section className="grid grid-cols-2 gap-3 rounded-3xl bg-card p-6 sm:gap-4 sm:p-8 xl:grid-cols-4">
            <StatTile icon={IconCalendarEvent} label={t("upcoming")} value={String(live.length)} />
            <StatTile icon={IconCircleCheck} label={t("confirmed")} value={String(count("CONFIRMED"))} />
            <StatTile icon={IconHourglass} label={t("pending")} value={String(count("PENDING"))} hint={t("pendingHint")} />
            <StatTile icon={IconCalendarRepeat} label={t("reschedule")} value={String(count("RESCHEDULE_REQUESTED"))} hint={t("rescheduleHint")} />
          </section>
        )
      )}

      {view === "calendrier" ? (
        <InterviewsCalendar />
      ) : (
      <section className="space-y-4">
        <div role="tablist" aria-label={t("period")} className="inline-flex rounded-full bg-card p-1">
          {TABS.map((x) => (
            <button
              key={x.key}
              type="button"
              role="tab"
              aria-selected={tab === x.key}
              onClick={() => void setTab(x.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium text-sm",
                tab === x.key ? "bg-selected text-selected-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`tabs.${x.key}`)}
              {x.key === "upcoming" && upcoming.data && <span className="tabular-nums opacity-70">{live.length}</span>}
            </button>
          ))}
        </div>

        {query.isLoading ? (
          <CardGridSkeleton kind="mission" count={3} />
        ) : !query.data ? (
          <p className="rounded-3xl bg-card p-6 text-muted-foreground">
            {friendlyError(query.error, t("unavailable"))}
          </p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-card px-6 py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-page">
              <IconCalendarEvent className="size-6 text-muted-foreground" />
            </span>
            <p className="font-medium">{tab === "upcoming" ? t("noneUpcoming") : t("nonePast")}</p>
            {tab === "upcoming" && (
              <p className="max-w-sm text-muted-foreground text-sm">
                {t.rich("howTo", {
                  cv: (chunks) => (
                    <Link href="/espace/analyse-cv" className="font-medium text-foreground underline underline-offset-2">
                      {chunks}
                    </Link>
                  ),
                  application: (chunks) => (
                    <Link href="/espace/candidatures" className="font-medium text-foreground underline underline-offset-2">
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
            )}
          </div>
        ) : (
          // Each card carries its date: all of them, in date order, no day headings.
          <ul className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((i) => (
              <InterviewCard key={i.id} interview={i} past={tab === "past"} focused={i.id === focusId} />
            ))}
          </ul>
        )}
      </section>
      )}
      {reportFor && (
        <InterviewReportDialog
          open
          onOpenChange={(open) => {
            if (!open) void setReportId(null);
          }}
          interviewId={reportFor.id}
          candidateName={reportFor.candidateName}
          jobTitle={reportFor.jobTitle}
          startsAt={reportFor.startsAt}
        />
      )}
    </div>
  );
}

