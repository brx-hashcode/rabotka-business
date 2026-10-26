"use client";

import { useEffect, useRef, useState } from "react";
import { IconDownload, IconPrinter, IconX } from "@tabler/icons-react";
import { Loader } from "lucide-react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { toast } from "sonner";

import { cn } from "#/lib/utils";


export function PreviewSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  src,
  kind,
  fileName,
  unavailable = "L'aperçu n'est plus disponible.",
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  src: string | undefined;
  kind: "pdf" | "image";
  fileName?: string;
  unavailable?: string;
}>) {
  const file = useBlobUrl(open ? src : undefined, kind);
  const frame = useRef<HTMLIFrameElement>(null);

  function download() {
    if (!file.url) return;
    const a = document.createElement("a");
    a.href = file.url;
    a.download = fileName ?? title;
    a.click();
  }

  function print() {
    if (kind === "pdf") {
      frame.current?.contentWindow?.focus();
      frame.current?.contentWindow?.print();
      return;
    }
    const w = window.open(file.url ?? "", "_blank");
    if (!w) toast.error("L'impression n'a pas pu s'ouvrir.");
    else w.addEventListener("load", () => w.print());
  }

  return (
    <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <SheetPrimitive.Portal>
        <SheetPrimitive.Overlay className="data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50" />
        <SheetPrimitive.Content
          aria-describedby={undefined}
          className="data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-card shadow-soft outline-none data-[state=closed]:duration-300 data-[state=open]:duration-500 sm:w-[min(56rem,92vw)] sm:rounded-l-3xl"
        >
          <header className="flex items-center gap-3 px-5 py-4 sm:px-6">
            <div className="min-w-0 flex-1">
              <SheetPrimitive.Title className="truncate font-semibold text-lg">{title}</SheetPrimitive.Title>
              {subtitle && <p className="truncate text-muted-foreground text-sm">{subtitle}</p>}
            </div>
            {file.url && (
              <>
                <button
                  type="button"
                  onClick={download}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-page px-4 font-medium text-sm hover:bg-page/70"
                >
                  <IconDownload className="size-4" />
                  <span className="hidden sm:inline">Télécharger</span>
                </button>
                <button
                  type="button"
                  onClick={print}
                  aria-label="Imprimer"
                  title="Imprimer"
                  className="flex size-10 items-center justify-center rounded-full bg-page hover:bg-page/70"
                >
                  <IconPrinter className="size-4" />
                </button>
              </>
            )}
            <SheetPrimitive.Close aria-label="Fermer" className="flex size-10 items-center justify-center rounded-full hover:bg-page">
              <IconX className="size-5" />
            </SheetPrimitive.Close>
          </header>

          <div className="flex min-h-0 flex-1 items-center justify-center bg-page sm:mx-3 sm:mb-3 sm:rounded-2xl">
            {!src ? (
              <Message>{unavailable}</Message>
            ) : file.failed ? (
              <Message>Le fichier n&apos;a pas pu être affiché. Réessayez dans un instant.</Message>
            ) : !file.url ? (
              <Loader aria-label="Chargement" className="size-8 animate-spin text-muted-foreground" />
            ) : kind === "pdf" ? (
              <iframe ref={frame} src={file.url} title={title} className={cn("size-full sm:rounded-2xl")} />
            ) : (
              // A local blob, a signed URL or the API route: nothing next/image could optimise.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={file.url} alt={title} className="max-h-full max-w-full object-contain p-4" />
            )}
          </div>
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}

/** The file as a URL the panel can frame and save: API routes become a local copy. */
function useBlobUrl(src: string | undefined, kind: "pdf" | "image") {
  const sameOrigin = !!src?.startsWith("/");
  const [state, setState] = useState<{ for?: string; url: string | null; failed: boolean }>({ url: null, failed: false });

  useEffect(() => {
    if (!src || !sameOrigin) return;
    let url: string | null = null;
    let cancelled = false;
    fetch(src, { credentials: "same-origin" })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(kind === "pdf" ? new Blob([blob], { type: "application/pdf" }) : blob);
        setState({ for: src, url, failed: false });
      })
      .catch(() => !cancelled && setState({ for: src, url: null, failed: true }));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [src, sameOrigin, kind]);

  if (!src) return { url: null, failed: false };
  if (!sameOrigin) return { url: src, failed: false };
  // A copy fetched for an earlier file is not this one's.
  return state.for === src ? state : { url: null, failed: false };
}

function Message({ children }: Readonly<{ children: React.ReactNode }>) {
  return <p className="px-6 text-center text-muted-foreground text-sm">{children}</p>;
}
