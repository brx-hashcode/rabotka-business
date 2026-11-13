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
 * motion, for those who reduce it; redrawn in place when the line wraps
 * differently (resize).
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
    const timer = window.setTimeout(() => mark.show(), still ? 0 : delay);
    // rough-notation places the mark once; a reflow moves the words.
    let width = el.getBoundingClientRect().width;
    const resize = new ResizeObserver(() => {
      const next = el.getBoundingClientRect().width;
      if (next === width || !mark.isShowing()) return;
      width = next;
      mark.hide();
      mark.show();
    });
    resize.observe(document.body);
    return () => {
      window.clearTimeout(timer);
      resize.disconnect();
      mark.remove();
    };
  }, [action, color, delay, strokeWidth]);

  return (
    <span ref={ref} className="relative inline">
      {children}
    </span>
  );
}
