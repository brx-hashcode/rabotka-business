"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// The admin's worker, from the CDN at the exact version react-pdf bundles.
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * A PDF drawn page after page, at the width of its column times `zoom` — no
 * browser viewer around it, as in the admin. Loaded only in the browser
 * (next/dynamic, ssr: false): pdf.js needs `window`.
 */
export default function PdfPages({
  file,
  zoom,
  onPages,
  onError,
}: Readonly<{ file: string; zoom: number; onPages: (n: number) => void; onError: () => void }>) {
  const column = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [pages, setPages] = useState(0);

  useEffect(() => {
    const el = column.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={column} className="w-full">
      <Document
        file={file}
        onLoadSuccess={({ numPages }) => {
          setPages(numPages);
          onPages(numPages);
        }}
        onLoadError={onError}
        loading={
          <div className="flex justify-center py-24">
            <Loader aria-label="Chargement" className="size-8 animate-spin text-muted-foreground" />
          </div>
        }
        error={<span />}
        className="flex flex-col items-center gap-4"
      >
        {width > 0 &&
          Array.from({ length: pages }, (_, i) => (
            <Page
              key={i}
              pageNumber={i + 1}
              width={Math.max(240, width * zoom)}
              className="overflow-hidden rounded-xl bg-white shadow-soft"
              loading={<div className="aspect-[1/1.414] bg-white" style={{ width: width * zoom }} />}
            />
          ))}
      </Document>
    </div>
  );
}
