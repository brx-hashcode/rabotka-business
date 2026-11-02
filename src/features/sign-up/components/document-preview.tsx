"use client";

import { PreviewSheet } from "#/components/preview-sheet";
import type { UploadedDocument } from "./documents-step";

/**
 * A document as uploaded, to check it is the right one: the local copy when
 * the file was picked in this page, the upload's signed preview during
 * sign-up, or the API's own route in the space — in the side panel.
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
  const isPdf = doc?.mimeType === "application/pdf" || !!doc?.fileName.toLowerCase().endsWith(".pdf");
  return (
    <PreviewSheet
      open={!!doc}
      onOpenChange={onOpenChange}
      title={title}
      subtitle={doc?.fileName}
      src={src}
      kind={isPdf ? "pdf" : "image"}
      fileName={doc?.fileName}
      unavailable="L'aperçu n'est plus disponible. Le document est bien enregistré."
    />
  );
}
