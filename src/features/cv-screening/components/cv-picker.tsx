"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { IconAlertTriangle, IconFilePlus, IconFileTypeDocx, IconFileTypePdf, IconMail, IconPhoto, IconUpload, IconX } from "@tabler/icons-react";

import type { Locale } from "#/i18n/config";
import { CV_ACCEPT } from "#/lib/api/cv-screening-controller";
import { cn } from "#/lib/utils";
import { kindFromName, pickKey, type MailPick } from "../mail-picks";
import { refusedLines, type RefusedFile } from "../refused-files";
import { fileSize } from "./cv-bits";
import { MailImport } from "./mail-import";

const TYPES: Record<string, "pdf" | "docx" | "image"> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
};

/** A file's kind from its type, or its extension when the browser gives none (Word on some systems). */
export function kindOf(file: File): "pdf" | "docx" | "image" | null {
  return TYPES[file.type] ?? (/\.docx$/i.test(file.name) ? "docx" : /\.pdf$/i.test(file.name) ? "pdf" : null);
}

/** One CV in the list: a file from the device, or one ticked in a mail. */
type CvItem = { key: string; name: string; size: number; kind: "pdf" | "docx" | "image"; from?: string };

const KIND = {
  pdf: { icon: IconFileTypePdf, label: "PDF", tile: "bg-destructive/10 text-destructive" },
  docx: { icon: IconFileTypeDocx, label: "Word", tile: "bg-chip-violet text-chip-violet-foreground" },
  image: { icon: IconPhoto, label: "Photo", tile: "bg-chip-amber text-chip-amber-foreground" },
} as const;

/**
 * The CVs to send, from the device (dropped or picked) and from a connected
 * mailbox, within `room`: « Analyse de CV » and an offer's « Importer des CV ».
 * The parent keeps the lists; what was turned away is said here.
 */
export function CvPicker({
  files,
  mails,
  room,
  maxMb,
  disabled,
  onFiles,
  onMails,
  withMail = true,
}: Readonly<{
  files: File[];
  mails: MailPick[];
  /** Also « depuis votre messagerie » under the drop area. */
  withMail?: boolean;
  room: number;
  maxMb: number;
  disabled: boolean;
  onFiles: (files: File[]) => void;
  onMails: (mails: MailPick[]) => void;
}>) {
  const tRefused = useTranslations("cv.refused");
  const [refused, setRefused] = useState<RefusedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const items: CvItem[] = [
    ...files.map((f) => ({ key: `f:${f.name}:${f.size}`, name: f.name, size: f.size, kind: kindOf(f) ?? "pdf" })),
    ...mails.map((m) => ({ key: `m:${pickKey(m)}`, name: m.name, size: m.size, kind: kindFromName(m.name), from: m.fromName })),
  ];

  function add(list: FileList | File[]) {
    const next = [...files];
    const out: RefusedFile[] = [];
    for (const file of Array.from(list)) {
      if (!kindOf(file)) out.push({ name: file.name, reason: { kind: "type" } });
      else if (file.size > maxMb * 1024 * 1024) out.push({ name: file.name, reason: { kind: "size", mb: maxMb } });
      else if (next.some((f) => f.name === file.name && f.size === file.size)) continue;
      else if (next.length + mails.length >= room) out.push({ name: file.name, reason: { kind: "over", limit: room } });
      else next.push(file);
    }
    onFiles(next);
    setRefused(out);
  }

  return (
    <>
      <CvDrop
        items={items}
        room={room}
        maxMb={maxMb}
        dragging={dragging}
        disabled={disabled}
        onPick={() => input.current?.click()}
        onDragging={setDragging}
        onDrop={add}
        onRemove={(key) => {
          onFiles(files.filter((f) => `f:${f.name}:${f.size}` !== key));
          onMails(mails.filter((m) => `m:${pickKey(m)}` !== key));
        }}
        onClear={() => {
          onFiles([]);
          onMails([]);
          setRefused([]);
        }}
      />
      {withMail && <MailImport picks={mails} room={Math.max(0, room - files.length)} disabled={disabled} onChange={onMails} />}
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
            {refusedLines(refused, tRefused).map((line) => (
              <li key={line.key}>
                {line.name ? <span className="font-medium">{line.name}</span> : null}
                {line.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

/**
 * The CVs to send. Empty: one large drop area. With files: the area shrinks
 * to a bar (more can still be dropped there) and the files show as tiles,
 * with how many more the analysis can take.
 */
/** Files listed before « Afficher les N autres ». */
const LIST_SHOWN = 12;

function CvDrop({
  items,
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
  items: CvItem[];
  room: number;
  maxMb: number;
  dragging: boolean;
  disabled: boolean;
  onPick: () => void;
  onDragging: (on: boolean) => void;
  onDrop: (files: FileList) => void;
  onRemove: (key: string) => void;
  onClear: () => void;
}>) {
  const full = items.length >= room;
  // Up to 100 CVs: the list folds past a dozen.
  const [unfolded, setUnfolded] = useState(false);
  const shown = unfolded ? items : items.slice(0, LIST_SHOWN);
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
  const t = useTranslations("cv.new");
  const tc = useTranslations("cv");
  const locale = useLocale() as Locale;
  const kindLabel = (label: string) => (label === "Photo" ? t("photo") : label);
  const hint = t("hint", { mb: maxMb });

  if (items.length === 0) {
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
          <span className="block font-medium">{t("drop")}</span>
          <span className="block text-muted-foreground text-sm">
            {t.rich("orPick", { u: (chunks) => <span className="font-medium text-foreground underline underline-offset-4">{chunks}</span> })}
          </span>
        </span>
        <span className="flex flex-wrap justify-center gap-1.5 pt-1">
          {Object.values(KIND).map((k) => (
            <span key={k.label} className={cn("rounded-full px-2.5 py-1 font-medium text-xs", k.tile)}>
              {kindLabel(k.label)}
            </span>
          ))}
        </span>
        <span className="text-muted-foreground text-xs">
          {t("limits", { mb: maxMb, room })}
        </span>
      </button>
    );
  }

  const total = items.reduce((n, f) => n + f.size, 0);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-40 flex-1 space-y-1.5">
          <p className="text-sm">
            <span className="font-semibold tabular-nums">
              {items.length} / {room}
            </span>{" "}
            <span className="text-muted-foreground">{t("count", { size: fileSize(total, tc, locale) })}</span>
          </p>
          <div className="h-1.5 max-w-64 overflow-hidden rounded-full bg-page">
            <div className="h-full rounded-full bg-whatsapp-dark transition-[width]" style={{ width: `${Math.min(100, (items.length / room) * 100)}%` }} />
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="font-medium text-muted-foreground text-sm hover:text-foreground disabled:opacity-50"
        >
          {t("clear")}
        </button>
      </div>

      <ul className="grid gap-2.5 sm:grid-cols-2">
        {shown.map((file) => {
          const k = KIND[file.kind];
          return (
            <li key={file.key} className="group flex min-w-0 items-center gap-3 rounded-2xl bg-page p-3">
              <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", k.tile)}>
                <k.icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-sm" title={file.name}>
                  {file.name}
                </span>
                <span className="flex items-center gap-1 truncate text-muted-foreground text-xs">
                  {file.from !== undefined && <IconMail className="size-3.5 shrink-0" aria-label={t("fromMail")} />}
                  {kindLabel(k.label)} · {fileSize(file.size, tc, locale)}
                  {file.from ? ` · ${file.from}` : ""}
                </span>
              </span>
              <button
                type="button"
                aria-label={t("remove", { name: file.name })}
                onClick={() => onRemove(file.key)}
                disabled={disabled}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-card hover:text-foreground"
              >
                <IconX className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>
      {items.length > LIST_SHOWN && (
        <button
          type="button"
          onClick={() => setUnfolded(!unfolded)}
          className="font-medium text-muted-foreground text-sm hover:text-foreground"
        >
          {unfolded ? t("fold") : t("more", { count: items.length - LIST_SHOWN })}
        </button>
      )}

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
            <span className="block font-medium text-sm">{t("add")}</span>
            <span className="block truncate text-muted-foreground text-xs">
              {t("room", { count: room - items.length, hint })}
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
