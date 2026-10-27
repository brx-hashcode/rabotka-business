"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconArrowLeft,
  IconBriefcase,
  IconChevronDown,
  IconDownload,
  IconEye,
  IconMail,
  IconMapPin,
  IconPhone,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { ActionDialog } from "#/components/action-dialog";
import { Bone, ClaimDetailSkeleton } from "#/components/page-skeletons";
import { PreviewSheet } from "#/components/preview-sheet";
import { cvFileUrl, cvScreeningsKey, deleteCvScreening, getCvScreening } from "#/lib/api/cv-screening-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import type { CvResume, CvScreening } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { CRITERIA, CriterionBar, ScoreRing, VerdictChip, band } from "./cv-bits";

const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/**
 * One analysis: its CVs best first, filling in live while they are read
 * (the notifications socket refreshes it; a slow poll backs it up).
 */
export function CvScreeningPage({ id }: Readonly<{ id: string }>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: [...cvScreeningsKey, id],
    queryFn: () => getCvScreening(id),
    refetchInterval: (q) => (q.state.data?.status === "PROCESSING" ? 8_000 : false),
  });
  const [preview, setPreview] = useState<CvResume | null>(null);
  const [confirm, setConfirm] = useState(false);
  const remove = useMutation({
    mutationFn: () => deleteCvScreening(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cvScreeningsKey });
      toast.success("Analyse supprimée, avec ses fichiers.");
      router.push("/espace/tri-cv");
    },
    onError: (err) => toast.error(friendlyError(err, "L'analyse n'a pas pu être supprimée.")),
  });

  if (query.isLoading) return <ClaimDetailSkeleton />;
  const s = query.data;
  if (!s) {
    return <p className="pt-6 text-muted-foreground">{friendlyError(query.error, "Cette analyse est introuvable.")}</p>;
  }

  const scored = s.resumes.filter((r) => r.status === "SCORED");
  const waiting = s.resumes.filter((r) => r.status === "QUEUED");
  const unread = s.resumes.filter((r) => r.status === "UNREADABLE" || r.status === "FAILED");
  const running = s.status === "PROCESSING";

  return (
    <div className="w-full space-y-6 pt-2">
      <Link href="/espace/tri-cv" className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground">
        <IconArrowLeft className="size-4" />
        Tri des CV
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <h1 className="break-words font-semibold text-3xl tracking-tight">{s.jobTitle}</h1>
          <p className="text-muted-foreground">
            {s.total} CV · le {date(s.createdAt)}
            {s.offerId && (
              <>
                {" · "}
                <Link href={`/espace/offres/${s.offerId}`} className="underline-offset-2 hover:underline">
                  voir l&apos;offre
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportCsv(s)}
            disabled={scored.length === 0}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-card px-4 font-medium text-sm hover:bg-card/70 disabled:opacity-40"
          >
            <IconDownload className="size-4" />
            Exporter
          </button>
          <button
            type="button"
            onClick={() => setConfirm(true)}
            aria-label="Supprimer l'analyse"
            className="inline-flex size-11 items-center justify-center rounded-full bg-card text-muted-foreground hover:bg-card/70 hover:text-destructive"
          >
            <IconTrash className="size-4" />
          </button>
        </div>
      </div>

      {running && (
        <section className="space-y-3 rounded-3xl bg-card p-6" aria-live="polite">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-medium">Lecture des CV…</p>
            <p className="text-muted-foreground text-sm tabular-nums">
              {s.done} / {s.total}
            </p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-page">
            <div className="h-full rounded-full bg-whatsapp-dark transition-[width] duration-500" style={{ width: `${(s.done / s.total) * 100}%` }} />
          </div>
          <p className="text-muted-foreground text-xs">Le classement se complète au fil de la lecture. Vous pouvez quitter la page : une notification vous prévient à la fin.</p>
        </section>
      )}

      {s.purged && (
        <p className="rounded-2xl bg-card px-4 py-3 text-muted-foreground text-sm">
          Les fichiers et les coordonnées ont été supprimés à la fin de leur durée de conservation ; les notes restent.
        </p>
      )}

      <JobBrief text={s.jobText} />

      <section className="space-y-3">
        {scored.map((r) => (
          <ResumeCard key={r.id} r={r} onPreview={() => setPreview(r)} screeningId={s.id} />
        ))}
        {waiting.map((r) => (
          <div key={r.id} className="flex items-center gap-4 rounded-3xl bg-card p-5">
            <Bone className="size-14 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="truncate font-medium text-sm">{r.fileName}</p>
              <p className="text-muted-foreground text-xs">En cours de lecture…</p>
            </div>
          </div>
        ))}
      </section>

      {unread.length > 0 && (
        <section className="space-y-3 rounded-3xl bg-card p-6">
          <div className="space-y-1">
            <h2 className="font-semibold">Non lus</h2>
            <p className="text-muted-foreground text-sm">Ces fichiers ne sont pas décomptés de vos CV inclus.</p>
          </div>
          <ul className="space-y-2">
            {unread.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-page px-4 py-3 text-sm">
                <span className="min-w-0 flex-1 truncate font-medium">{r.fileName}</span>
                <span className="text-muted-foreground">{r.error}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <PreviewSheet
        open={!!preview}
        onOpenChange={(o) => !o && setPreview(null)}
        title={preview?.candidate?.name ?? preview?.fileName ?? "CV"}
        subtitle={preview?.fileName}
        src={preview?.hasFile ? cvFileUrl(s.id, preview.id) : undefined}
        kind={preview?.mimeType.startsWith("image/") ? "image" : "pdf"}
        fileName={preview?.fileName}
        unavailable="Ce CV a été supprimé à la fin de sa durée de conservation."
      />

      <ActionDialog
        open={confirm}
        onOpenChange={setConfirm}
        icon={<IconTrash className="size-5" />}
        tone="warning"
        title="Supprimer cette analyse ?"
        description="Le classement et les CV envoyés sont supprimés. Les CV déjà lus restent décomptés."
        confirmLabel="Supprimer"
        onConfirm={() => remove.mutate()}
        pending={remove.isPending}
      />
    </div>
  );
}

/** What the CVs were measured against, folded: it is the reference, not the subject. */
function JobBrief({ text }: Readonly<{ text: string }>) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-3xl bg-card p-6">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-3 text-left">
        <IconBriefcase className="size-5 shrink-0 text-muted-foreground" />
        <span className="flex-1 font-medium">Le poste</span>
        <IconChevronDown className={cn("size-5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <p className="mt-4 whitespace-pre-line text-muted-foreground text-sm">{text}</p>}
    </section>
  );
}

function ResumeCard({ r, onPreview, screeningId }: Readonly<{ r: CvResume; onPreview: () => void; screeningId: string }>) {
  const [open, setOpen] = useState(r.rank === 1);
  const c = r.candidate;
  const name = c?.name ?? r.fileName;
  const score = r.score ?? 0;
  const facts = [
    c?.currentTitle,
    c?.yearsExperience !== null && c?.yearsExperience !== undefined ? `${c.yearsExperience} an${c.yearsExperience > 1 ? "s" : ""} d'expérience` : null,
  ].filter(Boolean);
  const isDocx = r.mimeType.includes("wordprocessingml");

  return (
    <article className="rounded-3xl bg-card p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <span className="hidden w-6 pt-4 text-center font-semibold text-muted-foreground tabular-nums sm:block">{r.rank}</span>
        <ScoreRing score={score} />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-semibold text-lg">{name}</h2>
            <VerdictChip score={score} />
          </div>
          {facts.length > 0 && <p className="text-muted-foreground text-sm">{facts.join(" · ")}</p>}
          {c?.city && (
            <p className="flex items-center gap-1 text-muted-foreground text-sm">
              <IconMapPin className="size-3.5" />
              {c.city}
            </p>
          )}
        </div>
      </div>

      {r.summary && <p className="mt-4 text-sm leading-relaxed">{r.summary}</p>}

      {open && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr_16rem]">
          <Points title="Points forts" items={r.strengths} tone="good" />
          <Points title="Points d'attention" items={r.gaps} tone="gap" />
          <div className="space-y-2.5 rounded-2xl bg-page p-4">
            {CRITERIA.filter((k) => typeof r.criteria?.[k.key] === "number").map((k) => (
              <CriterionBar key={k.key} label={k.label} value={r.criteria?.[k.key] ?? 0} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-page px-4 font-medium text-sm hover:bg-page/70"
        >
          {open ? "Moins de détails" : "Détails"}
          <IconChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </button>
        {r.hasFile &&
          (isDocx ? (
            <a
              href={cvFileUrl(screeningId, r.id)}
              download={r.fileName}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-page px-4 font-medium text-sm hover:bg-page/70"
            >
              <IconDownload className="size-4" />
              Télécharger le CV
            </a>
          ) : (
            <button
              type="button"
              onClick={onPreview}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-page px-4 font-medium text-sm hover:bg-page/70"
            >
              <IconEye className="size-4" />
              Voir le CV
            </button>
          ))}
        {c?.phone && (
          <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-page px-4 text-sm hover:bg-page/70">
            <IconPhone className="size-4" />
            <span className="whitespace-nowrap">{c.phone}</span>
          </a>
        )}
        {c?.email && (
          <a href={`mailto:${c.email}`} className="inline-flex h-10 min-w-0 items-center gap-1.5 rounded-full bg-page px-4 text-sm hover:bg-page/70">
            <IconMail className="size-4 shrink-0" />
            <span className="truncate">{c.email}</span>
          </a>
        )}
      </div>
    </article>
  );
}

function Points({ title, items, tone }: Readonly<{ title: string; items: string[]; tone: "good" | "gap" }>) {
  return (
    <div className="space-y-2">
      <p className="font-medium text-sm">{title}</p>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">Aucun.</p>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className={cn("mt-2 size-1.5 shrink-0 rounded-full", tone === "good" ? "bg-whatsapp-dark" : "bg-chip-amber-foreground")} />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The ranking as a spreadsheet: one line per CV read, best first. */
function exportCsv(s: CvScreening) {
  const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["Rang", "Nom", "Score", "Appréciation", ...CRITERIA.map((k) => k.label), "Poste actuel", "Ville", "Expérience (ans)", "Téléphone", "E-mail", "Résumé", "Fichier"];
  const rows = s.resumes
    .filter((r) => r.status === "SCORED")
    .map((r) => [
      r.rank,
      r.candidate?.name,
      r.score,
      band(r.score ?? 0).label,
      ...CRITERIA.map((k) => r.criteria?.[k.key] ?? ""),
      r.candidate?.currentTitle,
      r.candidate?.city,
      r.candidate?.yearsExperience,
      r.candidate?.phone,
      r.candidate?.email,
      r.summary,
      r.fileName,
    ]);
  // Semicolons and a BOM: what a French Excel opens as columns, accents intact.
  const csv = `﻿${[header, ...rows].map((line) => line.map(cell).join(";")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `tri-cv-${s.jobTitle.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
