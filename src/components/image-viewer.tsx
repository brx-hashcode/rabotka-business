"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IconChevronLeft, IconChevronRight, IconX } from "@tabler/icons-react";

import { cn } from "#/lib/utils";
import { SafeImage } from "./safe-image";

/**
 * Images, large, one at a time, inside the space (a realisation's, a claim's). Portalled
 * to <body>: inside the dialog (a transformed box) a `fixed` layer is
 * confined to that box and scrolls with it. The dialog ignores clicks
 * on it (`data-image-viewer`, see CandidateDialog), and Escape — caught before
 * the dialog's own handler — closes the image only.
 */
export function ImageViewer({ images, index, onClose }: Readonly<{ images: string[]; index: number; onClose: () => void }>) {
  const [i, setI] = useState(index);
  const many = images.length > 1;
  const step = (d: number) => setI((x) => (x + d + images.length) % images.length);
  const nav =
    "absolute top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#0f2414] hover:bg-white";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") setI((x) => (x + 1) % images.length);
      else if (e.key === "ArrowLeft") setI((x) => (x - 1 + images.length) % images.length);
    };
    globalThis.addEventListener("keydown", onKey, true);
    return () => globalThis.removeEventListener("keydown", onKey, true);
  }, [images.length, onClose]);

  return createPortal(
    <div
      data-image-viewer
      role="dialog"
      aria-modal
      aria-label={`Image ${i + 1} sur ${images.length}`}
      // A modal dialog sets pointer-events: none on <body>; this layer sits there.
      style={{ pointerEvents: "auto" }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-10"
    >
      <button type="button" aria-label="Fermer" onClick={onClose} className="absolute inset-0 cursor-default" />
      <SafeImage
        key={images[i]}
        src={images[i]}
        eager
        className="relative max-h-full max-w-full rounded-2xl object-contain"
        fallbackClassName="relative h-64 w-80 max-w-full rounded-2xl bg-white/10 text-white/70"
      />
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full bg-white/90 text-[#0f2414]"
      >
        <IconX className="size-5" />
      </button>
      {many && (
        <>
          <button type="button" aria-label="Image précédente" className={cn(nav, "left-4")} onClick={() => step(-1)}>
            <IconChevronLeft className="size-5" />
          </button>
          <button type="button" aria-label="Image suivante" className={cn(nav, "right-4")} onClick={() => step(1)}>
            <IconChevronRight className="size-5" />
          </button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 font-medium text-[#0f2414] text-sm">
            {i + 1} / {images.length}
          </p>
        </>
      )}
    </div>,
    document.body,
  );
}
