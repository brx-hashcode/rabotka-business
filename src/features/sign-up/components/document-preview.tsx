"use client";

import { useEffect, useState } from "react";
import { IconX } from "@tabler/icons-react";
import { Loader } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";

import type { UploadedDocument } from "./documents-step";

/**
 * A document as uploaded, to check it is the right one: the local copy when
 * the file was picked in this page, the upload's signed preview during
 * sign-up, or the API's own route in the space. PDFs in the browser's own
 * viewer, images as they are. Viewed here only — no link out.
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
            <DialogPrimitive.Close aria-label="Fermer" className="rounded-full p-2 hover:bg-page">
              <IconX className="size-5" />
            </DialogPrimitive.Close>
          </header>

          <div className="flex min-h-0 flex-1 items-center justify-center bg-page">
            {!src ? (
              <Message>L&apos;aperçu n&apos;est plus disponible. Le document est bien enregistré.</Message>
            ) : isPdf ? (
              <PdfFrame src={src} title={title} />
            ) : (
              // A local blob, a signed URL or the API route: nothing next/image could optimise.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={title} className="max-h-full max-w-full object-contain p-4" />
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * The API answers every response with `X-Frame-Options: DENY`, so its own
 * route (`/api/v1/...`) cannot be framed: the file is fetched (same origin,
 * the session rides along) and framed from a local `blob:` copy instead.
 * Local and signed URLs are framed as they are.
 */
function PdfFrame({ src, title }: Readonly<{ src: string; title: string }>) {
  const sameOrigin = src.startsWith("/");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!sameOrigin) return;
    let url: string | null = null;
    let cancelled = false;
    fetch(src, { credentials: "same-origin" })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
        setBlobUrl(url);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [src, sameOrigin]);

  if (!sameOrigin) return <iframe src={src} title={title} className="size-full" />;
  if (failed) return <Message>Le document n&apos;a pas pu être affiché. Réessayez dans un instant.</Message>;
  if (!blobUrl) return <Loader aria-label="Chargement" className="size-8 animate-spin text-muted-foreground" />;
  return <iframe src={blobUrl} title={title} className="size-full" />;
}

function Message({ children }: Readonly<{ children: React.ReactNode }>) {
  return <p className="px-6 text-center text-muted-foreground text-sm">{children}</p>;
}
