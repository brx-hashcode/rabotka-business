"use client";

import { useState } from "react";

import { PreviewSheet } from "./preview-sheet";

/**
 * Photos in the side panel documents open in, one after the other — as the
 * admin shows a claim's attachments, rather than a full-screen lightbox.
 */
export function ImageGallerySheet({
  images,
  index,
  title,
  onClose,
}: Readonly<{ images: string[]; index: number; title: string; onClose: () => void }>) {
  const [i, setI] = useState(index);
  const many = images.length > 1;
  const go = (d: number) => setI((x) => (x + d + images.length) % images.length);
  return (
    <PreviewSheet
      open
      onOpenChange={(o) => !o && onClose()}
      title={title}
      subtitle={many ? undefined : "Photo"}
      src={images[i]}
      kind="image"
      fileName={`photo-${i + 1}`}
      nav={many ? { label: `${i + 1} / ${images.length}`, onPrev: () => go(-1), onNext: () => go(1) } : undefined}
    />
  );
}
