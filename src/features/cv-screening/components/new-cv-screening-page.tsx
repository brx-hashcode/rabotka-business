"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconBell,
  IconClock,
  IconFileText,
  IconFilePlus,
  IconFileTypeDocx,
  IconFileTypePdf,
  IconPhoto,
  IconShieldLock,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { FormPageSkeleton } from "#/components/page-skeletons";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { Combobox } from "#/features/sign-up/components/combobox";
import { getMySubscription, mySubscriptionKey } from "#/lib/api/business-controller";
import { CV_ACCEPT, createCvScreening, cvScreeningsKey } from "#/lib/api/cv-screening-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { listOffers, offersKey } from "#/lib/api/offer-controller";
import { cn } from "#/lib/utils";
import { CvLocked, fileSize } from "./cv-bits";

const TYPES: Record<string, "pdf" | "docx" | "image"> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
};

/** A file's kind from its type, or its extension when the browser gives none (Word on some systems). */
function kindOf(file: File): "pdf" | "docx" | "image" | null {
  return TYPES[file.type] ?? (/\.docx$/i.test(file.name) ? "docx" : /\.pdf$/i.test(file.name) ? "pdf" : null);
}

const KIND = {
  pdf: { icon: IconFileTypePdf, label: "PDF", tile: "bg-destructive/10 text-destructive" },
  docx: { icon: IconFileTypeDocx, label: "Word", tile: "bg-chip-violet text-chip-violet-foreground" },
  image: { icon: IconPhoto, label: "Photo", tile: "bg-chip-amber text-chip-amber-foreground" },
} as const;

/**
 * A new « Analyse de CV »: the job (an offer, or one described here), then the
 * CVs, within what the plan covers. The analysis runs in the background; the
 * page it opens fills in as each CV is read.
 */
export function NewCvScreeningPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const subscription = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription });
  const offers = useQuery({ queryKey: [...offersKey, "cv-picker"], queryFn: () => listOffers({ pageSize: 100 }) });

  const [source, setSource] = useState<"offer" | "custom">("offer");
  const [offerId, setOfferId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobText, setJobText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [refused, setRefused] = useState<{ name: string; reason: string }[]>([]);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const e = subscription.data?.entitlements;
  const room = e ? Math.min(e.cvBatchMax, e.cvRemaining ?? Number.POSITIVE_INFINITY) : 0;

  const offerOptions = useMemo(() => (offers.data?.items ?? []).map((o) => ({ value: o.id, label: o.title })), [offers.data]);
  const offerTitle = offers.data?.items.find((o) => o.id === offerId)?.title;
  const jobReady = source === "offer" ? !!offerId : jobTitle.trim().length >= 3 && jobText.trim().length >= 30;

  function add(list: FileList | File[]) {
    if (!e) return;
    const next = [...files];
    const out: { name: string; reason: string }[] = [];
    for (const file of Array.from(list)) {
      if (!kindOf(file)) out.push({ name: file.name, reason: "type non pris en charge" });
      else if (file.size > e.cvFileMaxMb * 1024 * 1024) out.push({ name: file.name, reason: `plus de ${e.cvFileMaxMb} Mo` });
      else if (next.some((f) => f.name === file.name && f.size === file.size)) continue;
      else if (next.length >= room) out.push({ name: file.name, reason: `${room} CV au plus pour cette analyse` });
      else next.push(file);
    }
    setFiles(next);
    setRefused(out);
  }

  const start = useMutation({
    mutationFn: () =>
      createCvScreening(files, source === "offer" ? { offerId } : { jobTitle: jobTitle.trim(), jobText: jobText.trim() }),
    onSuccess: (screening) => {
      void queryClient.invalidateQueries({ queryKey: cvScreeningsKey });
      void queryClient.invalidateQueries({ queryKey: mySubscriptionKey });
      router.push(`/espace/analyse-cv/${screening.id}`);
    },
    onError: (err) => toast.error(friendlyError(err, "L'analyse n'a pas pu démarrer. Réessayez dans un instant.")),
  });

  if (subscription.isLoading) return <FormPageSkeleton back />;

  return (
    <div className="w-full space-y-6 pt-2">
      <Link href="/espace/analyse-cv" className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground">
        <IconArrowLeft className="size-4" />
        Analyse de CV
      </Link>
      <div className="space-y-1.5">
        <h1 className="font-semibold text-3xl tracking-tight">Nouvelle analyse</h1>
        <p className="text-muted-foreground">Le poste, puis les CV : Rabotka lit chacun et le note par rapport au poste.</p>
      </div>

      {!e || e.cvQuota === 0 ? (
        <CvLocked />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_26rem]">
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              if (jobReady && files.length > 0) start.mutate();
            }}
            className="space-y-8 rounded-3xl bg-card p-5 sm:p-8"
          >
            <Section title="Le poste">
              <div role="radiogroup" aria-label="Poste" className="inline-flex rounded-full bg-page p-1">
                {(
                  [
                    ["offer", "Une de mes offres"],
                    ["custom", "Autre poste"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={source === key}
                    onClick={() => setSource(key)}
                    className={cn(
                      "rounded-full px-4 py-1.5 font-medium text-sm",
                      source === key ? "bg-selected text-selected-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {source === "offer" ? (
                <div className="space-y-2">
                  <label className="font-medium text-sm" htmlFor="cv-offer">
                    Offre
                  </label>
                  <Combobox
                    value={offerId}
                    onChange={setOfferId}
                    options={offerOptions}
                    placeholder={offers.isLoading ? "Chargement…" : "Choisir une offre"}
                    searchPlaceholder="Rechercher une offre…"
                    emptyText="Aucune offre. Choisissez « Autre poste »."
                    disabled={offers.isLoading}
                  />
                  <p className="text-muted-foreground text-xs">Les CV sont notés d&apos;après l&apos;intitulé, la description, le métier et le lieu de l&apos;offre.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="font-medium text-sm" htmlFor="cv-title">
                      Intitulé du poste
                    </label>
                    <Input
                      id="cv-title"
                      value={jobTitle}
                      onChange={(ev) => setJobTitle(ev.target.value)}
                      maxLength={120}
                      placeholder="Ex. : Caissier en supermarché"
                      className="h-12 rounded-xl border-0 bg-page px-4 text-base shadow-none md:text-[15px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-medium text-sm" htmlFor="cv-text">
                      Missions et profil recherché
                    </label>
                    <Textarea
                      id="cv-text"
                      value={jobText}
                      onChange={(ev) => setJobText(ev.target.value)}
                      rows={6}
                      maxLength={8000}
                      placeholder="Les missions, l'expérience et les diplômes attendus, le lieu, les langues…"
                      className="min-h-36 rounded-xl border-0 bg-page px-4 py-3 text-base shadow-none md:text-[15px]"
                    />
                    <p className="text-muted-foreground text-xs">Plus la description est précise, plus le classement l&apos;est.</p>
                  </div>
                </div>
              )}
            </Section>

            <Section title="Les CV">
              <CvDrop
                files={files}
                room={room === Number.POSITIVE_INFINITY ? e.cvBatchMax : room}
                maxMb={e.cvFileMaxMb}
                dragging={dragging}
                disabled={start.isPending}
                onPick={() => input.current?.click()}
                onDragging={setDragging}
                onDrop={add}
                onRemove={(file) => setFiles(files.filter((f) => f !== file))}
                onClear={() => {
                  setFiles([]);
                  setRefused([]);
                }}
              />
              <input
                ref={input}
                type="file"
                multiple
                accept={CV_ACCEPT}
                className="hidden"
                onChange={(ev) => {
                  if (ev.target.files) add(ev.target.files);
                  ev.target.value = "";
                }}
              />

              {refused.length > 0 && (
                <div className="flex gap-3 rounded-2xl bg-chip-amber px-4 py-3 text-chip-amber-foreground text-sm">
                  <IconAlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <ul className="space-y-1">
                    {refused.map((r) => (
                      <li key={r.name}>
                        <span className="font-medium">{r.name}</span> non ajouté : {r.reason}.
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Section>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link href="/espace/analyse-cv" className="inline-flex h-12 items-center justify-center rounded-full bg-page px-6 font-medium hover:bg-page/70">
                Annuler
              </Link>
              <button
                type="submit"
                disabled={!jobReady || files.length === 0 || start.isPending}
                className="inline-flex h-12 items-center justify-center rounded-full bg-ink px-6 font-medium text-white hover:bg-ink/90 disabled:opacity-40"
              >
                {start.isPending ? "Envoi des CV…" : `Lancer l'analyse${files.length ? ` de ${files.length} CV` : ""}`}
              </button>
            </div>
          </form>

          <aside className="space-y-6 lg:sticky lg:top-24">
            <section className="space-y-4 rounded-3xl bg-card p-6">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Votre analyse</p>
              <h2 className={cn("break-words font-semibold text-xl leading-snug", !(offerTitle || jobTitle.trim()) && "text-muted-foreground")}>
                {(source === "offer" ? offerTitle : jobTitle.trim()) || "Poste à choisir"}
              </h2>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-page p-3">
                  <dt className="text-muted-foreground text-xs">CV ajoutés</dt>
                  <dd className="font-semibold text-xl tabular-nums">{files.length}</dd>
                </div>
                <div className="rounded-2xl bg-page p-3">
                  <dt className="text-muted-foreground text-xs">CV inclus restants</dt>
                  <dd className="font-semibold text-xl tabular-nums">{e.cvRemaining === null ? "illimité" : Math.max(0, e.cvRemaining - files.length)}</dd>
                </div>
              </dl>
            </section>
            <section className="space-y-3 rounded-3xl bg-card p-6">
              <p className="font-medium text-sm">Et ensuite</p>
              <ul className="space-y-2.5 text-muted-foreground text-sm">
                <Step icon={IconClock}>Une dizaine de secondes par CV ; vous pouvez quitter la page.</Step>
                <Step icon={IconBell}>Une notification vous prévient quand le classement est prêt.</Step>
                <Step icon={IconFileText}>Un CV illisible ou qui n&apos;en est pas un n&apos;est pas décompté.</Step>
                <Step icon={IconShieldLock}>
                  Les fichiers et les coordonnées sont supprimés au bout de {e.cvRetentionDays} jours ; les notes restent.
                </Step>
              </ul>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <h2 className="shrink-0 font-semibold text-base">{title}</h2>
        <span aria-hidden className="h-px flex-1 bg-page" />
      </div>
      {children}
    </section>
  );
}

function Step({ icon: Icon, children }: Readonly<{ icon: typeof IconClock; children: React.ReactNode }>) {
  return (
    <li className="flex gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </li>
  );
}

/**
 * The CVs to send. Empty: one large drop area. With files: the area shrinks
 * to a bar (more can still be dropped there) and the files show as tiles,
 * with how many more the analysis can take.
 */
function CvDrop({
  files,
  room,
  maxMb,
  dragging,
  disabled,
  onPick,
  onDragging,
  onDrop,
  onRemove,
  onClear,
}: Readonly<{
  files: File[];
  room: number;
  maxMb: number;
  dragging: boolean;
  disabled: boolean;
  onPick: () => void;
  onDragging: (on: boolean) => void;
  onDrop: (files: FileList) => void;
  onRemove: (file: File) => void;
  onClear: () => void;
}>) {
  const full = files.length >= room;
  const dropProps = {
    onDragOver: (ev: React.DragEvent) => {
      ev.preventDefault();
      onDragging(true);
    },
    onDragLeave: () => onDragging(false),
    onDrop: (ev: React.DragEvent) => {
      ev.preventDefault();
      onDragging(false);
      if (!full) onDrop(ev.dataTransfer.files);
    },
  };
  // Flat like every card here: a drop is shown by the fill and a ring, not a border.
  const surface = dragging ? "bg-chip-green ring-2 ring-whatsapp-dark" : "bg-page hover:bg-page/70";
  const hint = `PDF, Word (.docx) ou photo · ${maxMb} Mo au plus par fichier`;

  if (files.length === 0) {
    return (
      <button
        type="button"
        onClick={onPick}
        disabled={disabled}
        {...dropProps}
        className={cn("flex w-full flex-col items-center gap-3 rounded-3xl px-6 py-12 text-center transition-colors disabled:opacity-50", surface)}
      >
        <span className="flex size-14 items-center justify-center rounded-2xl bg-card">
          <IconUpload className="size-6" />
        </span>
        <span className="space-y-1">
          <span className="block font-medium">Déposez les CV ici</span>
          <span className="block text-muted-foreground text-sm">
            ou <span className="font-medium text-foreground underline underline-offset-4">choisissez-les</span> sur votre appareil
          </span>
        </span>
        <span className="flex flex-wrap justify-center gap-1.5 pt-1">
          {Object.values(KIND).map((k) => (
            <span key={k.label} className={cn("rounded-full px-2.5 py-1 font-medium text-xs", k.tile)}>
              {k.label}
            </span>
          ))}
        </span>
        <span className="text-muted-foreground text-xs">
          {maxMb} Mo au plus par fichier · {room} CV au plus
        </span>
      </button>
    );
  }

  const total = files.reduce((n, f) => n + f.size, 0);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-40 flex-1 space-y-1.5">
          <p className="text-sm">
            <span className="font-semibold tabular-nums">
              {files.length} / {room}
            </span>{" "}
            <span className="text-muted-foreground">CV · {fileSize(total)}</span>
          </p>
          <div className="h-1.5 max-w-64 overflow-hidden rounded-full bg-page">
            <div className="h-full rounded-full bg-whatsapp-dark transition-[width]" style={{ width: `${Math.min(100, (files.length / room) * 100)}%` }} />
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="font-medium text-muted-foreground text-sm hover:text-foreground disabled:opacity-50"
        >
          Tout retirer
        </button>
      </div>

      <ul className="grid gap-2.5 sm:grid-cols-2">
        {files.map((file) => {
          const k = KIND[kindOf(file) ?? "pdf"];
          return (
            <li key={`${file.name}-${file.size}`} className="group flex items-center gap-3 rounded-2xl bg-page p-3">
              <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", k.tile)}>
                <k.icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-sm" title={file.name}>
                  {file.name}
                </span>
                <span className="block text-muted-foreground text-xs">
                  {k.label} · {fileSize(file.size)}
                </span>
              </span>
              <button
                type="button"
                aria-label={`Retirer ${file.name}`}
                onClick={() => onRemove(file)}
                disabled={disabled}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-card hover:text-foreground"
              >
                <IconX className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>

      {!full && (
        <button
          type="button"
          onClick={onPick}
          disabled={disabled}
          {...dropProps}
          className={cn("flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors disabled:opacity-50", surface)}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card">
            <IconFilePlus className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium text-sm">Ajouter des CV</span>
            <span className="block truncate text-muted-foreground text-xs">
              Encore {room - files.length} possible{room - files.length > 1 ? "s" : ""} · {hint}
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
