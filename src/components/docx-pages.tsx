"use client";

import { useEffect, useRef } from "react";
import { renderAsync } from "docx-preview";

/**
 * A Word file (.docx) drawn in the page, from the local copy the preview
 * panel already fetched. Rendered in the browser: the CV is never sent to
 * an outside viewer. Pages keep their layout; `zoom` scales them.
 */
export default function DocxPages({
  file,
  zoom,
  onError,
}: Readonly<{ file: string; zoom: number; onError: () => void }>) {
  const body = useRef<HTMLDivElement>(null);
  const styles = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const blob = await (await fetch(file)).blob();
        if (cancelled || !body.current) return;
        body.current.innerHTML = "";
        await renderAsync(blob, body.current, styles.current ?? undefined, {
          className: "docx",
          inWrapper: true,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          renderHeaders: true,
          renderFooters: true,
        });
      } catch {
        if (!cancelled) onError();
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per file
  }, [file]);

  return (
    <div className="docx-preview">
      {/* The library's grey frame becomes the panel's own background; pages stay white. */}
      <style>{`
        .docx-preview .docx-wrapper { background: transparent; padding: 0; }
        .docx-preview .docx-wrapper > section.docx { margin: 0 auto 1.5rem; box-shadow: 0 8px 24px rgba(0,0,0,.12); border-radius: 4px; }
      `}</style>
      <div ref={styles} />
      <div ref={body} style={{ zoom }} />
    </div>
  );
}
