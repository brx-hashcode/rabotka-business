"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconArrowsMove, IconCalendarEvent, IconCheck, IconGripVertical } from "@tabler/icons-react";
import { toast } from "sonner";

import { ActionDialog } from "#/components/action-dialog";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "#/components/ui/dropdown-menu";
import { VerdictChip } from "#/features/cv-screening/components/cv-bits";
import { ScheduleInterviewDialog } from "#/features/interviews/components/schedule-interview-dialog";
import { showExternalStatus } from "#/features/offers/application-cache";
import { canHire } from "#/features/team/member-access";
import { useMember } from "#/features/team/use-member";
import { externalApplicationsKey, retainExternalApplication, type ExternalApplication } from "#/lib/api/careers-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { interviewsKey, listInterviews } from "#/lib/api/interview-controller";
import type { OfferApplicant } from "#/lib/api/offer-controller";
import type { Interview } from "#/lib/api/types";
import { cn, getInitials } from "#/lib/utils";
import type { ApplicationStage } from "../offer-labels";
import { useShortlist } from "../use-shortlist";
import { ApplicationActions } from "./application-actions";
import { BulkRefuseDialog } from "./bulk-refuse-dialog";

/** A candidate of the offer, as the board shows it. */
export type BoardEntry = {
  key: string;
  stage: ApplicationStage;
  score: number | null;
} & ({ kind: "rabotka"; a: OfferApplicant } | { kind: "careers"; a: ExternalApplication });

/** The board's columns: the tabs' stages, with « Entretien » before the decision. */
type Column = "new" | "viewed" | "shortlisted" | "interview" | "hired" | "closed";

const COLUMNS: { key: Column; label: string; hint: string }[] = [
  { key: "new", label: "Nouvelles", hint: "Pas encore ouvertes" },
  { key: "viewed", label: "Vues", hint: "CV ou profil consulté" },
  { key: "shortlisted", label: "Présélectionnées", hint: "À rencontrer ou à revoir" },
  { key: "interview", label: "Entretien", hint: "Un entretien est prévu" },
  { key: "hired", label: "Retenues", hint: "Votre choix" },
  { key: "closed", label: "Refusées ou annulées", hint: "Le candidat en est prévenu" },
];

/** Interviews that still stand: proposed, confirmed, or to move. */
const LIVE = new Set(["PENDING", "CONFIRMED", "RESCHEDULE_REQUESTED"]);

const waiting = (e: BoardEntry) => e.stage === "new" || e.stage === "viewed" || e.stage === "shortlisted";
const nameOf = (e: BoardEntry) =>
  (e.kind === "rabotka" ? `${e.a.worker.firstName} ${e.a.worker.lastName}` : `${e.a.firstName} ${e.a.lastName}`).trim();
const idOf = (e: BoardEntry) => (e.kind === "rabotka" ? e.a.applicationId : e.a.id);

/** The upcoming interview of a candidate, if it still stands. */
function interviewOf(e: BoardEntry, interviews: Interview[]): Interview | undefined {
  return interviews.find(
    (i) =>
      LIVE.has(i.status) &&
      (e.kind === "rabotka"
        ? i.applicationId === e.a.applicationId
        : i.externalApplicationId === e.a.id || (!!e.a.analysis && i.cvResumeId === e.a.analysis.resumeId)),
  );
}

/** What a drop asks for; `null` when the card cannot go there. */
type Move = { entry: BoardEntry; to: Column };

/**
 * The offer's candidates as a board, one column per step, best fit first in
 * each. A card is dragged (mouse, touch, or the keyboard: space then the
 * arrows) or moved with « Déplacer vers »:
 * - Présélectionnées and back: at once, the candidate is not told;
 * - Entretien: the invitation to fill in;
 * - Retenues / Refusées: the usual confirmation, the candidate is told.
 * A decided candidature stays where it is.
 */
export function OfferBoard({
  offerId,
  jobTitle,
  entries,
  recruiting,
}: Readonly<{ offerId: string; jobTitle: string; entries: BoardEntry[]; recruiting: boolean }>) {
  const hire = canHire(useMember().role);
  const queryClient = useQueryClient();
  const interviews = useQuery({ queryKey: [...interviewsKey, "upcoming"], queryFn: () => listInterviews({ scope: "upcoming" }) });
  const shortlist = useShortlist(offerId);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));

  const [scheduling, setScheduling] = useState<BoardEntry | null>(null);
  const [refusing, setRefusing] = useState<BoardEntry | null>(null);
  const [retaining, setRetaining] = useState<{ entry: BoardEntry; nonce: number } | null>(null);

  const columnOf = (e: BoardEntry): Column =>
    waiting(e) && interviewOf(e, interviews.data ?? []) ? "interview" : (e.stage as Column);
  const byColumn = new Map<Column, BoardEntry[]>(COLUMNS.map((c) => [c.key, []]));
  for (const e of entries) byColumn.get(columnOf(e))?.push(e);

  const retainCareers = useMutation({
    mutationFn: (id: string) => retainExternalApplication(id),
    onMutate: (id) => ({ undo: showExternalStatus(queryClient, id, "RETAINED") }),
    onSuccess: () => toast.success("Candidature retenue : le candidat est prévenu par e-mail."),
    onError: (err, _id, ctx) => {
      ctx?.undo();
      toast.error(friendlyError(err, "La candidature n'a pas pu être retenue."));
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: externalApplicationsKey }),
  });

  /** Where a card may go from where it is; the board refuses the rest. */
  const allowed = (e: BoardEntry, to: Column): boolean => {
    const from = columnOf(e);
    if (!hire || from === to || !waiting(e)) return false;
    if (to === "new" || to === "viewed") return e.stage === "shortlisted";
    if (to === "interview" || to === "hired") return recruiting;
    return true;
  };

  const move = ({ entry, to }: Move) => {
    if (!allowed(entry, to)) {
      if (columnOf(entry) !== to) {
        toast.info(waiting(entry) ? "Cette candidature ne peut pas aller à cette étape." : "Cette candidature est déjà décidée.");
      }
      return;
    }
    const targets = entry.kind === "rabotka" ? { rabotka: [idOf(entry)], external: [] } : { rabotka: [], external: [idOf(entry)] };
    if (to === "shortlisted") shortlist.mutate({ targets, shortlisted: true });
    else if (to === "new" || to === "viewed") shortlist.mutate({ targets, shortlisted: false });
    else if (to === "interview") setScheduling(entry);
    else if (to === "closed") setRefusing(entry);
    else if (to === "hired") setRetaining((prev) => ({ entry, nonce: (prev?.nonce ?? 0) + 1 }));
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const entry = entries.find((e) => e.key === active.id);
    if (entry && over) move({ entry, to: over.id as Column });
  };

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        {/* Six columns side by side; on a phone they scroll sideways, one card width each. */}
        <div className="-mx-2 flex snap-x gap-3 overflow-x-auto px-2 pb-2">
          {COLUMNS.map((c) => (
            <BoardColumn key={c.key} column={c} entries={byColumn.get(c.key) ?? []}>
              {(byColumn.get(c.key) ?? []).map((e) => (
                <BoardCard
                  key={e.key}
                  entry={e}
                  interview={interviewOf(e, interviews.data ?? [])}
                  draggable={hire && waiting(e)}
                  targets={COLUMNS.filter((t) => allowed(e, t.key))}
                  onMove={(to) => move({ entry: e, to })}
                />
              ))}
            </BoardColumn>
          ))}
        </div>
      </DndContext>

      {scheduling && (
        <ScheduleInterviewDialog
          open
          onOpenChange={(o) => !o && setScheduling(null)}
          jobTitle={jobTitle}
          candidate={
            scheduling.kind === "rabotka"
              ? { name: nameOf(scheduling), applicationId: scheduling.a.applicationId }
              : scheduling.score !== null && scheduling.a.analysis
                ? { name: nameOf(scheduling), cvResumeId: scheduling.a.analysis.resumeId, email: scheduling.a.email }
                : { name: nameOf(scheduling), externalApplicationId: scheduling.a.id, email: scheduling.a.email }
          }
        />
      )}

      <BulkRefuseDialog
        key={refusing?.key ?? "closed"}
        offerId={offerId}
        mode={refusing ? "selected" : null}
        ids={refusing?.kind === "rabotka" ? [refusing.a.applicationId] : []}
        selectedOutsiderIds={refusing?.kind === "careers" ? [refusing.a.id] : []}
        count={1}
        onClose={() => setRefusing(null)}
        onDone={() => setRefusing(null)}
      />

      {/* Rabotka: the usual « Retenir », with the contact to obtain after it. */}
      {retaining?.entry.kind === "rabotka" && (
        <ApplicationActions
          applicant={retaining.entry.a}
          name={nameOf(retaining.entry)}
          variant="dialogs"
          request={{ dialog: "accept", nonce: retaining.nonce }}
        />
      )}
      {/* Careers page: the contact came with the application. */}
      <ActionDialog
        open={retaining?.entry.kind === "careers"}
        onOpenChange={(o) => !o && setRetaining(null)}
        icon={<IconCheck className="size-5" />}
        title={retaining ? `Retenir ${nameOf(retaining.entry)} ?` : ""}
        description="Le candidat est prévenu par e-mail. Vous pourrez annuler ce choix ensuite."
        confirmLabel="Retenir"
        pending={retainCareers.isPending}
        onConfirm={() => {
          if (retaining?.entry.kind !== "careers") return;
          retainCareers.mutate(retaining.entry.a.id);
          setRetaining(null);
        }}
      />
    </>
  );
}

function BoardColumn({
  column,
  entries,
  children,
}: Readonly<{ column: (typeof COLUMNS)[number]; entries: BoardEntry[]; children: React.ReactNode }>) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });
  return (
    <section
      ref={setNodeRef}
      aria-label={column.label}
      className={cn(
        "flex w-72 shrink-0 snap-start flex-col gap-2 rounded-3xl bg-page p-2.5 transition-colors duration-200",
        isOver && "bg-brand-lime/40",
      )}
    >
      <header className="flex items-baseline justify-between gap-2 px-1.5 pt-1">
        <span className="font-semibold text-sm">{column.label}</span>
        <span className="text-muted-foreground text-xs tabular-nums">{entries.length}</span>
      </header>
      <p className="px-1.5 text-muted-foreground text-xs">{column.hint}</p>
      <div className="flex min-h-24 flex-1 flex-col gap-2">{children}</div>
    </section>
  );
}

function BoardCard({
  entry: e,
  interview,
  draggable,
  targets,
  onMove,
}: Readonly<{
  entry: BoardEntry;
  interview?: Interview;
  draggable: boolean;
  targets: (typeof COLUMNS)[number][];
  onMove: (to: Column) => void;
}>) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: e.key, disabled: !draggable });
  const name = nameOf(e);
  const source = e.kind === "rabotka" ? "Rabotka" : "Page carrières";
  const href = `?vue=liste&candidature=${idOf(e)}`;
  return (
    <article
      ref={setNodeRef}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      className={cn(
        "group relative rounded-2xl bg-card p-3 transition-shadow",
        isDragging && "z-20 rotate-1 shadow-soft",
        e.a.knockedOut && "opacity-70",
      )}
    >
      <div className="flex items-start gap-2.5">
        {draggable && (
          <button
            type="button"
            {...listeners}
            {...attributes}
            aria-label={`Déplacer ${name}`}
            className="-ml-1 mt-1.5 flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-page active:cursor-grabbing"
          >
            <IconGripVertical className="size-4" />
          </button>
        )}
        <Avatar className="size-9 shrink-0">
          <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <Link href={href} className="block truncate font-medium text-sm hover:underline">
            {name}
          </Link>
          <p className="truncate text-muted-foreground text-xs">
            {source}
            {e.a.knockedOut && " · ne remplit pas un critère"}
          </p>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {e.score !== null && <VerdictChip score={e.score} />}
        {interview && (
          <span className="inline-flex items-center gap-1 rounded-full bg-page px-2.5 py-1 font-medium text-xs">
            <IconCalendarEvent className="size-3.5" />
            {new Date(interview.startsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </span>
        )}
        {targets.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`Déplacer ${name} vers une autre étape`}
              className="ml-auto inline-flex h-7 items-center gap-1 rounded-full px-2 text-muted-foreground text-xs outline-none hover:bg-page hover:text-foreground"
            >
              <IconArrowsMove className="size-3.5" />
              Déplacer vers
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl border-0 bg-card p-1.5 shadow-soft">
              {targets.map((t) => (
                <DropdownMenuItem
                  key={t.key}
                  onSelect={() => onMove(t.key)}
                  className="cursor-pointer rounded-xl px-3 py-2 text-sm focus:bg-page"
                >
                  {t.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </article>
  );
}
