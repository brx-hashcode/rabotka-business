"use client";

import { useLocale, useTranslations } from "next-intl";
import { useWhyNot } from "#/lib/use-why-not";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconArrowBackUp,
  IconCalendarEvent,
  IconCircleCheck,
  IconCircleX,
  IconEye,
  IconFileImport,
  IconFileText,
  IconGauge,
  IconHistory,
  IconInbox,
  IconLock,
  IconMessage2,
  IconMoodHappy,
  IconMoodNeutral,
  IconMoodSad,
  IconPencil,
  IconSend,
  IconStar,
  IconTrash,
  IconUsers,
} from "@tabler/icons-react";
import { Loader } from "lucide-react";
import { toast } from "sonner";

import { Bone } from "#/components/page-skeletons";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "#/components/ui/sheet";
import { Textarea } from "#/components/ui/textarea";
import {
  addNote,
  candidateKey,
  clearOpinion,
  deleteNote,
  editNote,
  getNotes,
  getOpinions,
  getTimeline,
  setOpinion,
  type ApplicationKind,
  type CandidateNote,
  type Opinions,
  type TimelineEvent,
  type Verdict,
} from "#/lib/api/candidate-notes-controller";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import { timeAgo } from "#/lib/api/notification-controller";
import { cn, getInitials } from "#/lib/utils";
import { timelineLabel } from "../timeline-labels";

const VERDICTS: { v: Verdict; icon: typeof IconMoodHappy; on: string }[] = [
  { v: "YES", icon: IconMoodHappy, on: "bg-chip-green text-chip-green-foreground" },
  { v: "MAYBE", icon: IconMoodNeutral, on: "bg-chip-amber text-chip-amber-foreground" },
  { v: "NO", icon: IconMoodSad, on: "bg-destructive/10 text-destructive" },
];

/**
 * « Avis » on a candidate: opens the team's private side — my Oui / Peut-être
 * / Non, everyone's, the notes and the history. `summary`, when the page has
 * it (an offer's candidates), shows the count on the button.
 */
export function TeamOpinionButton({
  kind,
  id,
  name,
  summary,
  className,
  open: controlled,
  onOpenChange,
}: Readonly<{
  kind: ApplicationKind;
  id: string;
  name: string;
  summary?: Record<Verdict, number>;
  className?: string;
  /** Opened from elsewhere (a « ⋯ » menu): no button of its own then. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}>) {
  const t = useTranslations("team.opinion");
  const [own, setOwn] = useState(false);
  const open = controlled ?? own;
  const setOpen = onOpenChange ?? setOwn;
  const total = summary ? summary.YES + summary.MAYBE + summary.NO : 0;
  return (
    <>
      {controlled === undefined && (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-card px-3.5 font-medium text-sm hover:bg-card/70", className)}
      >
        <IconUsers className="size-4" />
        {t("button")}
        {total > 0 && summary && (
          <span className="flex items-center gap-1 text-xs tabular-nums">
            {summary.YES > 0 && <span className="rounded-full bg-chip-green px-1.5 text-chip-green-foreground">{summary.YES}</span>}
            {summary.MAYBE > 0 && <span className="rounded-full bg-chip-amber px-1.5 text-chip-amber-foreground">{summary.MAYBE}</span>}
            {summary.NO > 0 && <span className="rounded-full bg-destructive/10 px-1.5 text-destructive">{summary.NO}</span>}
          </span>
        )}
      </button>
      )}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto border-0 bg-card p-0 sm:max-w-lg">
          <div className="space-y-1.5 px-6 pt-6 pb-5">
            <SheetTitle className="font-semibold text-xl">{t("title")}</SheetTitle>
            <SheetDescription className="font-medium text-foreground">{name}</SheetDescription>
            <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <IconLock className="size-3.5 shrink-0" />
              {t("private")}
            </p>
          </div>
          {open && <TeamPanel kind={kind} id={id} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

function TeamPanel({ kind, id }: Readonly<{ kind: ApplicationKind; id: string }>) {
  const t = useTranslations("team.opinion");
  const tTeam = useTranslations("team");
  const tTimeline = useTranslations("team.timeline");
  const whyNot = useWhyNot();
  const locale = useLocale();
  const friendlyError = useFriendlyError();
  const queryClient = useQueryClient();
  const key = candidateKey(kind, id);
  const opinions = useQuery({ queryKey: [...key, "opinions"], queryFn: () => getOpinions(kind, id) });
  const notes = useQuery({ queryKey: [...key, "notes"], queryFn: () => getNotes(kind, id) });
  const timeline = useQuery({ queryKey: [...key, "timeline"], queryFn: () => getTimeline(kind, id) });
  const after = () => {
    void queryClient.invalidateQueries({ queryKey: [...key, "timeline"] });
    // The counts on the offer's cards.
    void queryClient.invalidateQueries({ queryKey: ["offer-opinions"] });
  };

  const opinion = useMutation({
    mutationFn: (v: Verdict | null) => (v ? setOpinion(kind, id, v) : clearOpinion(kind, id)),
    onSuccess: (next: Opinions) => {
      queryClient.setQueryData([...key, "opinions"], next);
      after();
    },
    onError: (err) => toast.error(friendlyError(err, t("saveFailed"))),
  });
  const [draft, setDraft] = useState("");
  const add = useMutation({
    mutationFn: () => addNote(kind, id, draft.trim()),
    onSuccess: (next) => {
      queryClient.setQueryData([...key, "notes"], next);
      setDraft("");
      after();
    },
    onError: (err) => toast.error(friendlyError(err, t("noteAddFailed"))),
  });
  const submit = () => {
    if (draft.trim() && !add.isPending) add.mutate();
  };

  const mine = opinions.data?.mine ?? null;
  const summary = opinions.data?.summary;
  // Newest first: what changed last is what the team opens it for.
  const history = [...(timeline.data ?? [])].reverse();
  const noteList = [...(notes.data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-7 px-6 pb-8">
      <section className="space-y-3">
        <p className="font-medium text-sm">{t("mine")}</p>
        <div role="group" aria-label={t("mine")} className="grid grid-cols-3 gap-1 rounded-full bg-page p-1">
          {VERDICTS.map(({ v, icon: Icon, on }) => (
            <button
              key={v}
              type="button"
              aria-pressed={mine === v}
              disabled={opinions.isLoading || opinion.isPending}
              title={whyNot([opinion.isPending, "wait"], [opinions.isLoading, "loading"])}
              onClick={() => opinion.mutate(mine === v ? null : v)}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-1.5 rounded-full font-medium text-sm transition-colors disabled:opacity-60",
                mine === v ? on : "text-muted-foreground hover:bg-card hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {tTeam(`verdict.${v}`)}
            </button>
          ))}
        </div>

        {/* Everyone's, counted, then by name. */}
        <div className="space-y-2 rounded-2xl bg-page p-3.5">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 font-medium text-sm">
              <IconUsers className="size-4 text-muted-foreground" />
              {t("team")}
            </p>
            {summary && summary.YES + summary.MAYBE + summary.NO > 0 && (
              <span className="flex gap-1 text-xs tabular-nums">
                {VERDICTS.filter(({ v }) => summary[v] > 0).map(({ v, on }) => (
                  <span key={v} className={cn("rounded-full px-2 py-0.5 font-medium", on)}>
                    {summary[v]} {tTeam(`verdict.${v}`)}
                  </span>
                ))}
              </span>
            )}
          </div>
          {opinions.isLoading ? (
            <Bone className="h-6 rounded-full" />
          ) : (opinions.data?.all ?? []).length === 0 ? (
            <p className="text-muted-foreground text-xs">{t("noOpinion")}</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {opinions.data!.all.map((o) => {
                const style = VERDICTS.find((x) => x.v === o.verdict)!;
                return (
                  <li key={o.member.id} className={cn("inline-flex items-center gap-1.5 rounded-full py-1 pr-3 pl-1 text-xs", style.on)}>
                    <span className="flex size-5 items-center justify-center rounded-full bg-card/70 font-semibold text-[10px] text-foreground">
                      {getInitials(o.member.name)}
                    </span>
                    <span className="font-medium">{o.member.name}</span>
                    <style.icon className="size-3.5" aria-label={tTeam(`verdict.${o.verdict}`)} />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <p className="flex items-center gap-2 font-medium text-sm">
          <IconMessage2 className="size-4" />
          {t("notes")}
          {noteList.length > 0 && <span className="text-muted-foreground tabular-nums">{noteList.length}</span>}
        </p>
        {/* Writing first: the reason the panel is opened most often. */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="rounded-2xl bg-page p-1.5 focus-within:ring-2 focus-within:ring-whatsapp/40"
        >
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit();
              }
            }}
            maxLength={4000}
            rows={3}
            placeholder={t("notePlaceholder")}
            className="min-h-20 resize-none border-0 bg-transparent px-2.5 py-2 shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center justify-between gap-2 px-1.5 pb-0.5">
            <span className="hidden text-muted-foreground text-xs sm:inline">{draft.trim() ? t("noteHint") : ""}</span>
            <button
              type="submit"
              disabled={!draft.trim() || add.isPending}
              title={whyNot([add.isPending, "wait"], [!draft.trim(), "write"])}
              className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 font-medium text-sm text-white disabled:opacity-40"
            >
              {add.isPending ? <Loader className="size-4 animate-spin" /> : <IconSend className="size-4" />}
              {t("addNote")}
            </button>
          </div>
        </form>
        {notes.isLoading ? (
          <Bone className="h-20 rounded-2xl" />
        ) : noteList.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noNotes")}</p>
        ) : (
          <ul className="space-y-2">
            {noteList.map((n) => (
              <NoteItem key={n.id} note={n} kind={kind} id={id} onChanged={after} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <p className="flex items-center gap-2 font-medium text-sm">
          <IconHistory className="size-4" />
          {t("history")}
        </p>
        {timeline.isLoading ? (
          <Bone className="h-24 rounded-2xl" />
        ) : history.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noHistory")}</p>
        ) : (
          <ol className="space-y-0">
            {history.map((e, i) => {
              const { icon: Icon, tone } = EVENT_LOOK[e.kind] ?? EVENT_LOOK.APPLIED;
              return (
                <li key={`${e.kind}-${e.at}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
                  {/* The thread between two events. */}
                  {i < history.length - 1 && <span aria-hidden className="absolute top-8 bottom-0 left-[0.9375rem] w-px bg-page" />}
                  <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", tone)}>
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 pt-0.5">
                    <span className="block text-sm">{timelineLabel(e, tTimeline, locale)}</span>
                    <span className="block text-muted-foreground text-xs">{timeAgo(e.at, locale)}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

/** How each kind of event looks in the history. */
const EVENT_LOOK: Record<TimelineEvent["kind"], { icon: typeof IconMoodHappy; tone: string }> = {
  APPLIED: { icon: IconInbox, tone: "bg-page text-foreground" },
  IMPORTED: { icon: IconFileImport, tone: "bg-page text-foreground" },
  ANALYSED: { icon: IconGauge, tone: "bg-chip-violet text-chip-violet-foreground" },
  VIEWED: { icon: IconEye, tone: "bg-page text-muted-foreground" },
  SHORTLISTED: { icon: IconStar, tone: "bg-chip-amber text-chip-amber-foreground" },
  RETAINED: { icon: IconCircleCheck, tone: "bg-chip-green text-chip-green-foreground" },
  REFUSED: { icon: IconCircleX, tone: "bg-destructive/10 text-destructive" },
  WITHDRAWN: { icon: IconArrowBackUp, tone: "bg-page text-muted-foreground" },
  INTERVIEW: { icon: IconCalendarEvent, tone: "bg-chip-sky text-chip-sky-foreground" },
  REPORT: { icon: IconFileText, tone: "bg-chip-sky text-chip-sky-foreground" },
  NOTE: { icon: IconMessage2, tone: "bg-page text-foreground" },
  OPINION: { icon: IconUsers, tone: "bg-page text-foreground" },
};

function NoteItem({
  note,
  kind,
  id,
  onChanged,
}: Readonly<{ note: CandidateNote; kind: ApplicationKind; id: string; onChanged: () => void }>) {
  const t = useTranslations("team.opinion");
  const whyNot = useWhyNot();
  const tLabels = useTranslations("labels");
  const locale = useLocale();
  const friendlyError = useFriendlyError();
  const queryClient = useQueryClient();
  const key = [...candidateKey(kind, id), "notes"];
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.body);
  const save = useMutation({
    mutationFn: () => editNote(kind, id, note.id, text.trim()),
    onSuccess: (next) => {
      queryClient.setQueryData(key, next);
      setEditing(false);
    },
    onError: (err) => toast.error(friendlyError(err, t("noteEditFailed"))),
  });
  const remove = useMutation({
    mutationFn: () => deleteNote(kind, id, note.id),
    onSuccess: (next) => {
      queryClient.setQueryData(key, next);
      onChanged();
    },
    onError: (err) => toast.error(friendlyError(err, t("noteDeleteFailed"))),
  });

  return (
    <li className="space-y-2 rounded-2xl bg-page p-3.5">
      <div className="flex items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-lime font-semibold text-[#0f2414] text-[11px]">
          {getInitials(note.author.name)}
        </span>
        <p className="min-w-0 flex-1 truncate text-xs">
          <span className="font-medium text-sm">{note.author.name}</span>{" "}
          <span className="text-muted-foreground">
            {tLabels(`role.${note.author.role}`)} · {timeAgo(note.createdAt, locale)}
            {note.edited && ` · ${t("edited")}`}
          </span>
        </p>
        {note.mine && !editing && (
          <span className="flex shrink-0 gap-1">
            <button type="button" aria-label={t("editNote")} onClick={() => setEditing(true)} className="rounded-full p-1.5 text-muted-foreground hover:bg-card hover:text-foreground">
              <IconPencil className="size-4" />
            </button>
            <button
              type="button"
              aria-label={t("deleteNote")}
              disabled={remove.isPending}
              title={whyNot([remove.isPending, "wait"])}
              onClick={() => remove.mutate()}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-card hover:text-destructive"
            >
              <IconTrash className="size-4" />
            </button>
          </span>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={4000}
            rows={3}
            className="min-h-20 rounded-xl border-0 bg-card px-3 py-2 shadow-none"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => (setEditing(false), setText(note.body))} className="h-9 rounded-full px-4 text-muted-foreground text-sm">
              {t("cancel")}
            </button>
            <button
              type="button"
              disabled={!text.trim() || save.isPending}
              title={whyNot([save.isPending, "wait"], [!text.trim(), "write"])}
              onClick={() => save.mutate()}
              className="h-9 rounded-full bg-ink px-4 font-medium text-sm text-white disabled:opacity-50"
            >
              {t("save")}
            </button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-line text-sm leading-relaxed">{note.body}</p>
      )}
    </li>
  );
}
