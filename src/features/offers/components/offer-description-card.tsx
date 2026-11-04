"use client";

import { useEffect, useRef, useState } from "react";
import { IconChevronDown, IconChevronUp, IconInfoCircle } from "@tabler/icons-react";

import { DescriptionText } from "#/features/careers/components/description-text";
import { cn } from "#/lib/utils";

/**
 * The offer's text, short by default so the column stays level with the page
 * beside it: a few lines, and the rest behind « Voir plus ». The button only
 * shows when there is something more to see.
 */
export function OfferDescriptionCard({ description, note }: Readonly<{ description: string; note: string | null }>) {
  const [open, setOpen] = useState(false);
  const [clipped, setClipped] = useState(false);
  const text = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = text.current;
    if (!el || open) return;
    const measure = () => setClipped(el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, description]);

  const more = open || clipped || !!note;

  return (
    <section className="space-y-3 rounded-3xl bg-card p-6">
      <h2 className="font-semibold text-lg">Description</h2>
      {/* Six lines high when closed: line-clamp only cuts a single block. */}
      <div ref={text} className={cn(!open && "max-h-[9.75rem] overflow-hidden")}>
        <DescriptionText text={description} className="text-muted-foreground" />
      </div>
      {open && note && (
        <div className="space-y-2 rounded-2xl bg-page p-4">
          <h3 className="flex items-center gap-1.5 font-medium text-sm">
            <IconInfoCircle className="size-4" />
            Note pour les candidats
          </h3>
          <p className="whitespace-pre-line text-muted-foreground text-sm leading-relaxed">{note}</p>
        </div>
      )}
      {more && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1 font-medium text-sm text-whatsapp-dark hover:underline"
        >
          {open ? "Voir moins" : "Voir plus"}
          {open ? <IconChevronUp className="size-4" /> : <IconChevronDown className="size-4" />}
        </button>
      )}
    </section>
  );
}
