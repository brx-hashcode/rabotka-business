"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconBriefcase,
  IconCalendarEvent,
  IconCheck,
  IconChevronsLeft,
  IconChevronsRight,
  IconDots,
  IconSearch,
  IconWorld,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { ActionDialog } from "#/components/action-dialog";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "#/components/ui/dialog";
import { ExternalApplicationCard } from "#/features/applications/components/external-application-card";
import { CandidateProfile } from "#/features/candidates/components/candidate-profile";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "#/components/ui/dropdown-menu";
import { band } from "#/features/cv-screening/components/cv-bits";
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

/**
 * The board's five columns: new and seen together (« À examiner », as the
 * page's tile says), then the shortlist, the interview, the decision.
 */
type Column = "review" | "shortlisted" | "interview" | "hired" | "closed";

const COLUMNS: { key: Column; label: string }[] = [
  { key: "review", label: "À examiner" },
  { key: "shortlisted", label: "Présélectionnées" },
  { key: "interview", label: "Entretien" },
  { key: "hired", label: "Retenues" },
  { key: "closed", label: "Refusées" },
];

/** Cards a column shows at first, and adds with each « Voir plus ». */
const PAGE = 20;

/** The fit labels the cards use (cv-bits `band`): « Adaptés » from 60, « Très adaptés » from 80. */
const SCORE_FILTERS = [
  { min: 0, label: "Tous", hint: "Tous les candidats" },
  { min: 60, label: "Adaptés", hint: "Adaptés ou très adaptés au poste (60 et plus)" },
  { min: 80, label: "Très adaptés", hint: "Très adaptés au poste (80 et plus)" },
];

/** Lower case, no accents: « Élodie » is found by « elodie ». */
const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

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
 * each: a name and a fit, nothing more (the list has the rest). A card is
 * dragged (mouse, touch, or the keyboard: space then the arrows) or moved
 * with its « ⋯ »:
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
  // The careers-page candidate open in the panel, read live from the entries.
  const [openedKey, setOpenedKey] = useState<string | null>(null);
  const opened = entries.find((e) => e.key === openedKey);
  const [refusing, setRefusing] = useState<BoardEntry | null>(null);
  const [retaining, setRetaining] = useState<{ entry: BoardEntry; nonce: number } | null>(null);

  const columnOf = (e: BoardEntry): Column => {
    if (waiting(e) && interviewOf(e, interviews.data ?? [])) return "interview";
    if (e.stage === "new" || e.stage === "viewed") return "review";
    return e.stage as Column;
  };
  // Above the board: a name, a minimum fit, those failing a criterion out.
  const [query, setQuery] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [hideOut, setHideOut] = useState(false);
  const words = fold(query).split(/\s+/).filter(Boolean);
  const shownEntries = entries.filter(
    (e) =>
      (words.length === 0 || words.every((w) => fold(nameOf(e)).includes(w))) &&
      (minScore === 0 || (e.score ?? 0) >= minScore) &&
      !(hideOut && e.a.knockedOut),
  );
  const filtering = words.length > 0 || minScore > 0 || hideOut;
  const outCount = entries.filter((e) => e.a.knockedOut).length;

  const byColumn = new Map<Column, BoardEntry[]>(COLUMNS.map((c) => [c.key, []]));
  for (const e of shownEntries) byColumn.get(columnOf(e))?.push(e);
  // Each column shows its best PAGE first, then « Voir plus »: light with
  // hundreds of candidates, the best fits on top.
  const [limits, setLimits] = useState<Partial<Record<Column, number>>>({});
  const limitOf = (c: Column) => limits[c] ?? PAGE;
  // « Refusées » is folded to a strip: rarely worked on, and soon the longest.
  const [closedOpen, setClosedOpen] = useState(false);

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
    if (to === "review") return e.stage === "shortlisted";
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
    else if (to === "review") shortlist.mutate({ targets, shortlisted: false });
    else if (to === "interview") setScheduling(entry);
    else if (to === "closed") setRefusing(entry);
    else if (to === "hired") setRetaining((prev) => ({ entry, nonce: (prev?.nonce ?? 0) + 1 }));
  };

  // The card being dragged: a copy follows the pointer above everything
  // (DragOverlay), the original stays in its column, faded.
  const [dragKey, setDragKey] = useState<string | null>(null);
  const dragged = entries.find((e) => e.key === dragKey);
  const onDragStart = ({ active }: DragStartEvent) => setDragKey(String(active.id));
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragKey(null);
    const entry = entries.find((e) => e.key === active.id);
    if (entry && over) move({ entry, to: over.id as Column });
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        // The column under the pointer, not the one the card overlaps most.
        collisionDetection={pointerWithin}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragKey(null)}
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative min-w-52 flex-1 sm:max-w-xs">
            <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(ev) => setQuery(ev.target.value)}
              placeholder="Rechercher un candidat"
              aria-label="Rechercher un candidat par son nom"
              className="h-9 w-full rounded-full bg-page pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-whatsapp/40"
            />
          </div>
          <div role="group" aria-label="Afficher selon l'adéquation au poste" className="flex items-center gap-1 rounded-full bg-page p-1">
            <span className="pr-1 pl-2.5 text-muted-foreground text-xs">Afficher</span>
            {SCORE_FILTERS.map((f) => (
              <button
                key={f.min}
                type="button"
                title={f.hint}
                aria-pressed={minScore === f.min}
                onClick={() => setMinScore(f.min)}
                className={cn(
                  "rounded-full px-3 py-1 font-medium text-xs transition-colors",
                  minScore === f.min ? "bg-selected text-selected-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          {outCount > 0 && (
            <button
              type="button"
              aria-pressed={hideOut}
              onClick={() => setHideOut((v) => !v)}
              className={cn(
                "h-9 rounded-full px-3.5 font-medium text-xs transition-colors",
                hideOut ? "bg-selected text-selected-foreground" : "bg-page text-muted-foreground hover:text-foreground",
              )}
            >
              Masquer hors critères ({outCount})
            </button>
          )}
          {filtering && (
            <span className="text-muted-foreground text-xs">
              {shownEntries.length} sur {entries.length}
            </span>
          )}
        </div>

        {/* A fixed height, each column scrolling on its own under its title; on a narrow screen they scroll sideways. */}
        <div className="-mx-1 flex snap-x items-start gap-2.5 overflow-x-auto px-1 pb-2">
          {COLUMNS.map((c) => {
            const all = byColumn.get(c.key) ?? [];
            if (c.key === "closed" && !closedOpen) {
              return <FoldedColumn key={c.key} column={c} count={all.length} onOpen={() => setClosedOpen(true)} />;
            }
            const shown = all.slice(0, limitOf(c.key));
            return (
            <BoardColumn
              key={c.key}
              column={c}
              count={all.length}
              more={all.length - shown.length}
              onMore={() => setLimits((l) => ({ ...l, [c.key]: limitOf(c.key) + PAGE }))}
              onFold={c.key === "closed" ? () => setClosedOpen(false) : undefined}
            >
              {shown.map((e) => (
                <BoardCard
                  key={e.key}
                  entry={e}
                  interview={interviewOf(e, interviews.data ?? [])}
                  draggable={hire && waiting(e)}
                  targets={COLUMNS.filter((t) => allowed(e, t.key))}
                  onMove={(to) => move({ entry: e, to })}
                  onOpen={() => setOpenedKey(e.key)}
                />
              ))}
            </BoardColumn>
            );
          })}
        </div>
        <DragOverlay dropAnimation={null}>
          {dragged && (
            <CardFace entry={dragged} interview={interviewOf(dragged, interviews.data ?? [])} className="rotate-2 cursor-grabbing shadow-soft" />
          )}
        </DragOverlay>
      </DndContext>

      {/* The candidate over the board, either kind: the address does not
          change, so the board stays the board (?vue=tableau) behind it. */}
      <Dialog open={!!opened} onOpenChange={(o) => !o && setOpenedKey(null)}>
        <DialogContent
          showClose={false}
          // The CV opens in a panel portalled outside: a click there is not « outside ».
          onInteractOutside={(ev) => {
            if ((ev.target as HTMLElement | null)?.closest("[data-preview-sheet]")) ev.preventDefault();
          }}
          // One surface: the window is the card's own colour, the card adds no frame of its own.
          className="max-h-[90svh] w-[calc(100vw-2rem)] gap-0 overflow-y-auto rounded-3xl border-0 bg-page p-0 shadow-soft sm:max-w-5xl"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-page px-5 pt-4 pb-1 sm:px-6">
            <div className="min-w-0">
              <DialogTitle className="truncate font-medium text-muted-foreground text-sm">Candidature · {jobTitle}</DialogTitle>
              <DialogDescription className="sr-only">
                {opened?.kind === "rabotka" ? "Profil du candidat Rabotka" : "Candidature reçue sur la page carrières"}
              </DialogDescription>
            </div>
            <DialogClose
              aria-label="Fermer"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground outline-none transition-colors hover:bg-card/70 hover:text-foreground focus-visible:ring-2 focus-visible:ring-whatsapp/40"
            >
              <IconX className="size-4" />
            </DialogClose>
          </div>
          {opened?.kind === "rabotka" && (
            <div className="px-5 pb-6 sm:px-8 sm:pb-8">
              <CandidateProfile workerId={opened.a.worker.id} />
            </div>
          )}
          {opened?.kind === "careers" && (
            <ul className="list-none px-1 pb-1 sm:px-2 sm:pb-2">
              <ExternalApplicationCard onOfferPage application={opened.a} />
            </ul>
          )}
        </DialogContent>
      </Dialog>

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
  count,
  more,
  onMore,
  onFold,
  children,
}: Readonly<{
  column: (typeof COLUMNS)[number];
  count: number;
  /** Cards not shown yet in this column. */
  more: number;
  onMore: () => void;
  /** « Refusées » folds back to its strip. */
  onFold?: () => void;
  children: React.ReactNode;
}>) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });
  return (
    <section
      ref={setNodeRef}
      aria-label={column.label}
      className={cn(
        "flex w-72 shrink-0 snap-start flex-col rounded-2xl bg-page transition-colors duration-200",
        isOver && "bg-brand-lime/40",
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 px-4 pt-3 pb-2">
        <span className="font-semibold text-sm">{column.label}</span>
        <span className="flex items-center gap-1">
          <span className="rounded-full bg-card px-2 py-0.5 text-muted-foreground text-xs tabular-nums">{count}</span>
          {onFold && (
            <button
              type="button"
              onClick={onFold}
              aria-label={`Replier « ${column.label} »`}
              className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-card hover:text-foreground"
            >
              <IconChevronsRight className="size-4" />
            </button>
          )}
        </span>
      </header>
      {/* As tall as its cards, up to a ceiling; past it, it scrolls on its own. */}
      <div className="flex max-h-[min(65vh,40rem)] min-h-24 flex-col gap-1.5 overflow-y-auto px-2 pb-2 [scrollbar-width:thin]">
        {count === 0 ? (
          <p className="flex flex-1 items-center justify-center rounded-xl px-3 py-6 text-center text-muted-foreground/70 text-xs">
            Aucun candidat
          </p>
        ) : (
          <>
            {children}
            {more > 0 && (
              <button
                type="button"
                onClick={onMore}
                className="mt-1 h-9 shrink-0 rounded-xl font-medium text-muted-foreground text-xs hover:bg-card hover:text-foreground"
              >
                Voir {Math.min(more, PAGE)} de plus · {more} restant{more > 1 ? "s" : ""}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/** « Refusées » while folded: its name and count on a strip, still a drop target. */
function FoldedColumn({ column, count, onOpen }: Readonly<{ column: (typeof COLUMNS)[number]; count: number; onOpen: () => void }>) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onOpen}
      aria-label={`Afficher « ${column.label} » (${count})`}
      className={cn(
        "flex min-h-40 w-14 shrink-0 flex-col items-center gap-3 self-stretch rounded-2xl bg-page py-3 text-muted-foreground transition-colors duration-200 hover:text-foreground",
        isOver && "bg-brand-lime/40 text-foreground",
      )}
    >
      <IconChevronsLeft className="size-4" />
      <span className="rounded-full bg-card px-2 py-0.5 text-xs tabular-nums">{count}</span>
      <span className="font-semibold text-sm [writing-mode:vertical-rl] rotate-180">{column.label}</span>
    </button>
  );
}

function BoardCard({
  entry: e,
  interview,
  draggable,
  targets,
  onMove,
  onOpen,
}: Readonly<{
  entry: BoardEntry;
  interview?: Interview;
  draggable: boolean;
  targets: (typeof COLUMNS)[number][];
  onMove: (to: Column) => void;
  /** The candidate in a window over the board. */
  onOpen: () => void;
}>) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: e.key, disabled: !draggable });
  const name = nameOf(e);
  return (
    // The whole card is the handle: a short drag moves it (its copy follows
    // the pointer), a click on the name opens the candidate; « ⋯ » moves it
    // without dragging.
    <CardFace
      ref={setNodeRef}
      entry={e}
      interview={interview}
      onOpen={onOpen}
      {...(draggable ? { ...listeners, ...attributes } : {})}
      className={cn(draggable && "cursor-grab touch-none", isDragging && "opacity-40")}
    >
      {targets.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Déplacer ${name}`}
            onPointerDown={(ev) => ev.stopPropagation()}
            className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 outline-none transition-opacity hover:bg-page hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100 max-md:opacity-100"
          >
            <IconDots className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-2xl border-0 bg-card p-1.5 shadow-soft">
            <p className="px-3 pt-1.5 pb-1 text-muted-foreground text-xs">Déplacer vers</p>
            {targets.map((t) => (
              <DropdownMenuItem key={t.key} onSelect={() => onMove(t.key)} className="cursor-pointer rounded-xl px-3 py-2 text-sm focus:bg-page">
                {t.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </CardFace>
  );
}

/**
 * What a card shows, Jira-like: the name as its title, then small markers
 * (where they applied, the score, the interview) and the avatar. Drawn in
 * the column and, while dragged, as the copy under the pointer.
 */
function CardFace({
  ref,
  entry: e,
  interview,
  onOpen,
  className,
  children,
  ...rest
}: Readonly<
  {
    ref?: React.Ref<HTMLElement>;
    entry: BoardEntry;
    interview?: Interview;
    onOpen?: () => void;
    className?: string;
    children?: React.ReactNode;
  } & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">
>) {
  const name = nameOf(e);
  const fit = e.score !== null ? band(e.score) : null;
  const nameClass = "line-clamp-2 text-left font-medium text-sm leading-snug hover:underline";
  return (
    <article
      ref={ref}
      aria-label={name}
      {...rest}
      className={cn(
        "group relative flex select-none flex-col gap-3 rounded-xl bg-card p-3 transition-[opacity,background-color] hover:bg-card/80",
        e.a.knockedOut && "opacity-60",
        className,
      )}
    >
      <div className="flex items-start gap-2 pr-6">
        <button type="button" onClick={onOpen} onPointerDown={(ev) => ev.stopPropagation()} className={nameClass}>
          {name}
        </button>
      </div>
      {children}
      <div className="flex items-center gap-2">
        <span
          title={e.kind === "rabotka" ? "Candidature Rabotka" : "Candidature reçue sur la page carrières"}
          className="flex size-5 shrink-0 items-center justify-center rounded bg-page text-muted-foreground"
        >
          {e.kind === "rabotka" ? <IconBriefcase className="size-3.5" /> : <IconWorld className="size-3.5" />}
        </span>
        {fit && e.score !== null && (
          <span title={fit.label} className={cn("rounded px-1.5 py-0.5 font-semibold text-[11px] tabular-nums", fit.chip)}>
            {e.score}
          </span>
        )}
        {interview && (
          <span title="Entretien prévu" className="inline-flex items-center gap-1 rounded bg-page px-1.5 py-0.5 font-medium text-[11px]">
            <IconCalendarEvent className="size-3" />
            {new Date(interview.startsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </span>
        )}
        {e.a.knockedOut && (
          <span
            title="Ne remplit pas un critère éliminatoire"
            className="rounded bg-chip-amber px-1.5 py-0.5 font-medium text-[11px] text-chip-amber-foreground"
          >
            Critère
          </span>
        )}
        <Avatar className="ml-auto size-6 shrink-0">
          <AvatarFallback className="text-[10px]">{getInitials(name)}</AvatarFallback>
        </Avatar>
      </div>
    </article>
  );
}
