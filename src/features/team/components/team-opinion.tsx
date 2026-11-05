"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconHistory,
  IconMessage2,
  IconMoodHappy,
  IconMoodNeutral,
  IconMoodSad,
  IconPencil,
  IconTrash,
  IconUsers,
} from "@tabler/icons-react";
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
  VERDICT_LABEL,
  type ApplicationKind,
  type CandidateNote,
  type Opinions,
  type Verdict,
} from "#/lib/api/candidate-notes-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { timeAgo } from "#/lib/api/notification-controller";
import { ROLE_LABEL } from "#/lib/api/team-controller";
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
        Avis de l&apos;équipe
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
          <div className="space-y-1 px-6 pt-6 pb-4">
            <SheetTitle className="font-semibold text-xl">Avis de l&apos;équipe</SheetTitle>
            <SheetDescription>{name} · visible de votre équipe seulement, jamais du candidat.</SheetDescription>
          </div>
          {open && <TeamPanel kind={kind} id={id} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

function TeamPanel({ kind, id }: Readonly<{ kind: ApplicationKind; id: string }>) {
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
    onError: (err) => toast.error(friendlyError(err, "Votre avis n'a pas pu être enregistré.")),
  });
  const [draft, setDraft] = useState("");
  const add = useMutation({
    mutationFn: () => addNote(kind, id, draft.trim()),
    onSuccess: (next) => {
      queryClient.setQueryData([...key, "notes"], next);
      setDraft("");
      after();
    },
    onError: (err) => toast.error(friendlyError(err, "La note n'a pas pu être ajoutée.")),
  });

  const mine = opinions.data?.mine ?? null;

  return (
    <div className="space-y-6 px-6 pb-8">
      <section className="space-y-3">
        <p className="font-medium text-sm">Mon avis</p>
        <div className="grid grid-cols-3 gap-2">
          {VERDICTS.map(({ v, icon: Icon, on }) => (
            <button
              key={v}
              type="button"
              aria-pressed={mine === v}
              disabled={opinions.isLoading || opinion.isPending}
              onClick={() => opinion.mutate(mine === v ? null : v)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl py-3 font-medium text-sm transition-colors disabled:opacity-60",
                mine === v ? on : "bg-page text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-5" />
              {VERDICT_LABEL[v]}
            </button>
          ))}
        </div>
        {opinions.data && opinions.data.all.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {opinions.data.all.map((o) => {
              const style = VERDICTS.find((x) => x.v === o.verdict)!;
              return (
                <li key={o.member.id} className={cn("inline-flex items-center gap-1.5 rounded-full py-1 pr-3 pl-1 text-xs", style.on)}>
                  <span className="flex size-5 items-center justify-center rounded-full bg-card/70 font-semibold text-[10px] text-foreground">
                    {getInitials(o.member.name)}
                  </span>
                  <span className="font-medium">{o.member.name}</span>· {VERDICT_LABEL[o.verdict]}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <p className="flex items-center gap-2 font-medium text-sm">
          <IconMessage2 className="size-4" />
          Notes
        </p>
        {notes.isLoading ? (
          <Bone className="h-20 rounded-2xl" />
        ) : (notes.data ?? []).length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune note pour l&apos;instant.</p>
        ) : (
          <ul className="space-y-2">
            {notes.data!.map((n) => (
              <NoteItem key={n.id} note={n} kind={kind} id={id} onChanged={after} />
            ))}
          </ul>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) add.mutate();
          }}
          className="space-y-2"
        >
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={4000}
            rows={3}
            placeholder="Ce que l'équipe doit savoir : entretien, références, points à vérifier…"
            className="min-h-20 rounded-2xl border-0 bg-page px-4 py-3 shadow-none focus-visible:ring-2 focus-visible:ring-whatsapp/40"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!draft.trim() || add.isPending}
              className="h-10 rounded-full bg-ink px-5 font-medium text-sm text-white disabled:opacity-50"
            >
              Ajouter la note
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <p className="flex items-center gap-2 font-medium text-sm">
          <IconHistory className="size-4" />
          Historique
        </p>
        {timeline.isLoading ? (
          <Bone className="h-24 rounded-2xl" />
        ) : (
          <ol className="relative space-y-3 pl-4">
            <span aria-hidden className="absolute top-1 bottom-1 left-0 w-0.5 rounded-full bg-page" />
            {(timeline.data ?? []).map((e, i) => (
              <li key={`${e.kind}-${e.at}-${i}`} className="relative">
                <span aria-hidden className="-left-[1.2rem] absolute top-1.5 size-2 rounded-full bg-whatsapp-dark" />
                <p className="text-sm">{timelineLabel(e)}</p>
                <p className="text-muted-foreground text-xs">{timeAgo(e.at)}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function NoteItem({
  note,
  kind,
  id,
  onChanged,
}: Readonly<{ note: CandidateNote; kind: ApplicationKind; id: string; onChanged: () => void }>) {
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
    onError: (err) => toast.error(friendlyError(err, "La note n'a pas pu être modifiée.")),
  });
  const remove = useMutation({
    mutationFn: () => deleteNote(kind, id, note.id),
    onSuccess: (next) => {
      queryClient.setQueryData(key, next);
      onChanged();
    },
    onError: (err) => toast.error(friendlyError(err, "La note n'a pas pu être supprimée.")),
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
            {ROLE_LABEL[note.author.role]} · {timeAgo(note.createdAt)}
            {note.edited && " · modifiée"}
          </span>
        </p>
        {note.mine && !editing && (
          <span className="flex shrink-0 gap-1">
            <button type="button" aria-label="Modifier la note" onClick={() => setEditing(true)} className="rounded-full p-1.5 text-muted-foreground hover:bg-card hover:text-foreground">
              <IconPencil className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Supprimer la note"
              disabled={remove.isPending}
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
              Annuler
            </button>
            <button
              type="button"
              disabled={!text.trim() || save.isPending}
              onClick={() => save.mutate()}
              className="h-9 rounded-full bg-ink px-4 font-medium text-sm text-white disabled:opacity-50"
            >
              Enregistrer
            </button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-line text-sm leading-relaxed">{note.body}</p>
      )}
    </li>
  );
}
