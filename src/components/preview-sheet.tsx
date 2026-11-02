"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { IconChevronLeft, IconChevronRight, IconDownload, IconMinus, IconPlus, IconPrinter, IconX } from "@tabler/icons-react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { toast } from "sonner";
import { cn } from "#/lib/utils";
import { DocumentPageSkeleton } from "./page-skeletons";

const PdfPages = dynamic(() => import("./pdf-pages"), { ssr: false });

const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function PreviewSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  src,
  kind,
  fileName,
  unavailable = "L'aperçu n'est plus disponible.",
  nav,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  /** Same-origin API path, signed URL or `blob:`; none: nothing to show. */
  src: string | undefined;
  kind: "pdf" | "image";
  /** The name a download is saved under. */
  fileName?: string;
  unavailable?: string;
  /** Several files in one panel (a claim's photos): arrows, keys and « 1 / 3 ». */
  nav?: { label: string; onPrev: () => void; onNext: () => void };
}>) {
  const file = useBlobUrl(open ? src : undefined, kind);
  const [zoom, setZoom] = useState(1);
  const [pages, setPages] = useState(0);
  const [drawFailed, setDrawFailed] = useState(false);
  const failed = file.failed || drawFailed;

  function download() {
    if (!file.url) return;
    const a = document.createElement("a");
    a.href = file.url;
    a.download = fileName ?? title;
    a.click();
  }

  /** The browser's print dialog for the file alone, from a hidden frame. */
  function print() {
    if (!file.url) return;
    const frame = document.createElement("iframe");
    frame.setAttribute("style", "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden");
    frame.src = file.url;
    frame.onload = () => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } catch {
        toast.error("L'impression n'a pas pu s'ouvrir.");
      }
      setTimeout(() => frame.remove(), 60_000);
    };
    document.body.appendChild(frame);
  }

  useEffect(() => {
    if (!open || !nav) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") nav.onPrev();
      else if (e.key === "ArrowRight") nav.onNext();
    };
    globalThis.addEventListener("keydown", onKey);
    return () => globalThis.removeEventListener("keydown", onKey);
  }, [open, nav]);

  const step = (d: number) => setZoom((z) => ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, ZOOMS.indexOf(z) + d))] ?? 1);

  return (
    <SheetPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setZoom(1);
          setPages(0);
          setDrawFailed(false);
        }
      }}
    >
      <SheetPrimitive.Portal>
        <SheetPrimitive.Overlay data-preview-sheet className="data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50" />
        <SheetPrimitive.Content
          data-preview-sheet
          aria-describedby={undefined}
          className="data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-card shadow-soft outline-none data-[state=closed]:duration-300 data-[state=open]:duration-500 sm:w-[min(56rem,92vw)]"
        >
          <header className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6">
            <div className="min-w-0 flex-1">
              <SheetPrimitive.Title className="truncate font-semibold text-lg">{title}</SheetPrimitive.Title>
              {subtitle && <p className="truncate text-muted-foreground text-sm">{subtitle}</p>}
            </div>
            {nav && (
              <div className="flex items-center rounded-full bg-page p-1">
                <button
                  type="button"
                  onClick={nav.onPrev}
                  aria-label="Précédente"
                  className="flex size-8 items-center justify-center rounded-full hover:bg-card"
                >
                  <IconChevronLeft className="size-4" />
                </button>
                <span className="min-w-12 text-center font-medium text-xs tabular-nums">{nav.label}</span>
                <button
                  type="button"
                  onClick={nav.onNext}
                  aria-label="Suivante"
                  className="flex size-8 items-center justify-center rounded-full hover:bg-card"
                >
                  <IconChevronRight className="size-4" />
                </button>
              </div>
            )}
            {file.url && !failed && (
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-full bg-page p-1">
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    disabled={zoom === ZOOMS[0]}
                    aria-label="Réduire"
                    className="flex size-8 items-center justify-center rounded-full hover:bg-card disabled:opacity-40"
                  >
                    <IconMinus className="size-4" />
                  </button>
                  <span className="w-12 text-center font-medium text-xs tabular-nums">{Math.round(zoom * 100)} %</span>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    disabled={zoom === ZOOMS.at(-1)}
                    aria-label="Agrandir"
                    className="flex size-8 items-center justify-center rounded-full hover:bg-card disabled:opacity-40"
                  >
                    <IconPlus className="size-4" />
                  </button>
                </div>
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
              </div>
            )}
            <SheetPrimitive.Close aria-label="Fermer" className="flex size-10 items-center justify-center rounded-full hover:bg-page">
              <IconX className="size-5" />
            </SheetPrimitive.Close>
          </header>

          <div className="relative min-h-0 flex-1 overflow-auto bg-page">
            {!src ? (
              <Message>{unavailable}</Message>
            ) : failed ? (
              <Message>Le fichier n&apos;a pas pu être affiché. Réessayez dans un instant.</Message>
            ) : !file.url ? (
              <div className="px-4 py-6 sm:px-8">
                <DocumentPageSkeleton />
              </div>
            ) : kind === "pdf" ? (
              <div className="px-4 py-6 sm:px-8">
                <PdfPages file={file.url} zoom={zoom} onPages={setPages} onError={() => setDrawFailed(true)} />
                {pages > 1 && <p className="mt-4 text-center text-muted-foreground text-xs">{pages} pages</p>}
              </div>
            ) : (
              // At 100 % the photo fits the panel; zoomed in, it scrolls.
              <div className={cn("flex items-center justify-center p-6", zoom === 1 ? "h-full" : "min-h-full")}>
                {/* A local blob, a signed URL or the API route: nothing next/image could optimise. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={file.url}
                  alt={title}
                  style={zoom === 1 ? undefined : { width: `${zoom * 100}%`, maxWidth: "none" }}
                  className="max-h-full max-w-full rounded-xl object-contain shadow-soft"
                />
              </div>
            )}
          </div>
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}

/** The file as a URL the panel can draw and save: API routes become a local copy. */
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
  return <p className="flex h-full items-center justify-center px-6 text-center text-muted-foreground text-sm">{children}</p>;
}
