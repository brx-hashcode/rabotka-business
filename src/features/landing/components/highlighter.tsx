"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { annotate } from "rough-notation";

type Props = {
  children: ReactNode;
  /** A hand-drawn line under the words, or a marker stroke behind them. */
  action: "underline" | "highlight";
  color: string;
  /** Wait before drawing, in ms: a second mark comes after the first. */
  delay?: number;
  strokeWidth?: number;
};

/**
 * A few words marked by hand, drawn once on arrival. Already drawn, without
 * motion, for those who reduce it; redrawn in place whenever the words move
 * (resize, a font arriving, an entrance animation ending).
 */
export function Highlighter({ children, action, color, delay = 0, strokeWidth = 2 }: Readonly<Props>) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mark = annotate(el, {
      type: action,
      color,
      strokeWidth,
      multiline: true,
      // The underline hugs the baseline: the box ends below the descenders.
      padding: action === "highlight" ? 2 : -5,
      iterations: action === "highlight" ? 1 : 2,
      animate: !still,
      animationDuration: 800,
    });
    /**
     * Where the words are, seen from the drawing: rough-notation measures them
     * once, when it draws. Drawn while the hero is still sliding in, or before
     * the title's font has loaded, the mark stayed where the words had been.
     */
    const place = () => {
      // Its drawing sits beside the words: before them for a marker stroke, after for a line.
      const svg = action === "highlight" ? el.previousElementSibling : el.nextElementSibling;
      const origin = svg?.classList.contains("rough-annotation") ? svg.getBoundingClientRect() : undefined;
      return [...el.getClientRects()]
        .map((r) => [r.left - (origin?.left ?? 0), r.top - (origin?.top ?? 0), r.width, r.height].map(Math.round).join(","))
        .join(";");
    };
    let drawn = "";
    const draw = () => {
      mark.show();
      drawn = place();
    };
    /** Redrawn, without the animation again, when the words are no longer under the mark. */
    const sync = () => {
      if (!mark.isShowing() || place() === drawn) return;
      mark.animate = false;
      mark.hide();
      draw();
    };

    const timers = [window.setTimeout(draw, still ? 0 : delay)];
    // Once the drawing is done (it measures again when asked mid-stroke), and once everything has settled.
    for (const after of [1000, 2500]) timers.push(window.setTimeout(sync, (still ? 0 : delay) + after));
    void document.fonts?.ready.then(sync);
    const resize = new ResizeObserver(sync);
    resize.observe(document.body);
    if (el.parentElement) resize.observe(el.parentElement);
    // An entrance animation ending anywhere above moves the words without resizing anything.
    document.addEventListener("animationend", sync, true);
    document.addEventListener("transitionend", sync, true);
    window.addEventListener("load", sync);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      resize.disconnect();
      document.removeEventListener("animationend", sync, true);
      document.removeEventListener("transitionend", sync, true);
      window.removeEventListener("load", sync);
      mark.remove();
    };
  }, [action, color, delay, strokeWidth]);

  return (
    <span ref={ref} className="relative inline">
      {children}
    </span>
  );
}
