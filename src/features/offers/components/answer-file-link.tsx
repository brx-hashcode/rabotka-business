"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import dynamic from "next/dynamic";
import { IconFileText, IconFileTypeDocx, IconFileTypePdf, IconPhoto } from "@tabler/icons-react";

import { PreviewSheet } from "#/components/preview-sheet";

const PdfThumb = dynamic(() => import("#/components/pdf-thumb"), { ssr: false });

type FileType = "photo" | "pdf" | "word" | "file";

/** What the name says the file is, for the tile; the drawer reads the file's own type. */
function fileTypeOf(name: string): FileType {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"].includes(ext)) return "photo";
  if (ext === "pdf") return "pdf";
  if (ext === "docx" || ext === "doc") return "word";
  return "file";
}

const ICON = { photo: IconPhoto, pdf: IconFileTypePdf, word: IconFileTypeDocx, file: IconFileText } as const;

/**
 * A « Fichier » answer: a tile with the file (a photo shows itself, a PDF its
 * first page; a Word file or anything else its icon), opened in
 * the preview drawer (same-origin, the session cookie goes with it).
 */
export function AnswerFileLink({ fileId, name, label }: Readonly<{ fileId: string; name: string; label: string }>) {
  const t = useTranslations("offers.answerFile");
  const [open, setOpen] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const src = `/api/v1/business/me/answer-files/${encodeURIComponent(fileId)}`;
  const type = fileTypeOf(name);
  const Icon = ICON[type];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group mt-1.5 flex w-full max-w-sm items-center gap-3 rounded-xl bg-page p-2 pr-2.5 text-left transition-colors hover:bg-page/70"
      >
        <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card text-muted-foreground">
          {type === "photo" && !thumbFailed ? (
            // Same-origin: the session cookie opens it, as the drawer does.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" loading="lazy" onError={() => setThumbFailed(true)} className="size-full object-cover" />
          ) : type === "pdf" && !thumbFailed ? (
            // The top of the first page, as wide as the tile.
            <span className="flex size-full items-start justify-center bg-white">
              <PdfThumb file={src} width={44} onError={() => setThumbFailed(true)} />
            </span>
          ) : (
            <Icon className="size-5" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-sm">{name}</span>
          <span className="block font-normal text-muted-foreground text-xs">{t(type)}</span>
        </span>
        <span className="inline-flex h-8 shrink-0 items-center rounded-full bg-card px-3.5 font-medium text-sm group-hover:bg-card/70">
          {t("see")}
        </span>
      </button>
      <PreviewSheet open={open} onOpenChange={setOpen} title={label} subtitle={name} src={src} fileName={name} />
    </>
  );
}
