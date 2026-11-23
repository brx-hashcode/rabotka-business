"use client";

import { Document, Page, pdfjs } from "react-pdf";

// The same worker as the preview drawer's pages.
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * A PDF's first page, small, for a file tile: no text or link layers. Loaded
 * only in the browser (next/dynamic, ssr: false): pdf.js needs `window`.
 */
export default function PdfThumb({ file, width, onError }: Readonly<{ file: string; width: number; onError: () => void }>) {
  return (
    <Document file={file} onLoadError={onError} loading={null} error={null}>
      <Page
        pageNumber={1}
        width={width}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        onRenderError={onError}
        loading={null}
        className="bg-white"
      />
    </Document>
  );
}
