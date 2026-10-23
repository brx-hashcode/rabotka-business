"use client";

import { IconExternalLink, IconX } from "@tabler/icons-react";
import { Dialog as DialogPrimitive } from "radix-ui";

import type { UploadedDocument } from "./documents-step";

/**
 * A document as uploaded, to check it is the right one. The local copy when
 * the file was picked in this page; otherwise the upload's signed preview,
 * which lives an hour. PDFs in the browser's own viewer, images as they are.
 */
export function DocumentPreviewDialog({
  title,
  doc,
  src,
  onOpenChange,
}: Readonly<{
  title: string;
  doc: UploadedDocument | null;
  src: string | undefined;
  onOpenChange: (open: boolean) => void;
}>) {
  const isPdf = doc?.mimeType === "application/pdf" || doc?.fileName.toLowerCase().endsWith(".pdf");

  return (
    <DialogPrimitive.Root open={!!doc} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/60" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 fixed inset-3 z-50 flex flex-col overflow-hidden rounded-3xl bg-card shadow-soft outline-none sm:inset-x-[8vw] sm:inset-y-[6vh]"
        >
          <header className="flex items-center gap-4 px-5 py-4">
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="truncate font-semibold">{title}</DialogPrimitive.Title>
              <p className="truncate text-muted-foreground text-sm">{doc?.fileName}</p>
            </div>
            {src && (
              <a
                href={src}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-page px-4 py-2 font-medium text-sm hover:bg-page/70"
              >
                <IconExternalLink className="size-4" />
                Ouvrir
              </a>
            )}
            <DialogPrimitive.Close aria-label="Fermer" className="rounded-full p-2 hover:bg-page">
              <IconX className="size-5" />
            </DialogPrimitive.Close>
          </header>

          <div className="flex min-h-0 flex-1 items-center justify-center bg-page">
            {!src ? (
              <p className="px-6 text-center text-muted-foreground text-sm">
                L&apos;aperçu n&apos;est plus disponible. Le document est bien enregistré.
              </p>
            ) : isPdf ? (
              <iframe src={src} title={title} className="size-full" />
            ) : (
              // A local blob or a signed URL: nothing next/image could optimise.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={title} className="max-h-full max-w-full object-contain p-4" />
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
