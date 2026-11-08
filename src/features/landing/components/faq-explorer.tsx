"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { IconArrowRight, IconPlus } from "@tabler/icons-react";

import { cn } from "#/lib/utils";

type Item = { q: string; a: string };

/** One ease for everything here: fast out, long soft landing. */
const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/**
 * The questions as something to browse. Wide screen: the list on the left, a
 * highlight gliding to the one chosen, its answer in a dark card on the right
 * (sliding in softly). Phone: an accordion whose answers open and close in
 * height, one at a time. Every answer is in the page either way.
 */
export function FaqExplorer({ items }: Readonly<{ items: Item[] }>) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<number | null>(0);
  const list = useRef<HTMLDivElement>(null);
  const [glide, setGlide] = useState<{ top: number; height: number } | null>(null);

  // The highlight follows the chosen question (and the layout, on resize).
  useLayoutEffect(() => {
    const host = list.current;
    if (!host) return;
    const place = () => {
      const el = host.querySelectorAll<HTMLElement>("[data-question]")[active];
      if (el) setGlide({ top: el.offsetTop, height: el.offsetHeight });
    };
    place();
    const sizer = new ResizeObserver(place);
    sizer.observe(host);
    return () => sizer.disconnect();
  }, [active]);

  const current = items[active];
  const count = String(items.length).padStart(2, "0");

  return (
    <>
      {/* Wide screen: list and answer side by side. */}
      <div className="hidden gap-10 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div ref={list} role="tablist" aria-orientation="vertical" className="relative space-y-1">
          {glide && (
            <span
              aria-hidden
              className={cn("absolute inset-x-0 rounded-2xl bg-page transition-all duration-500", EASE)}
              style={{ top: glide.top, height: glide.height }}
            />
          )}
          {items.map((item, i) => (
            <button
              key={item.q}
              type="button"
              role="tab"
              id={`faq-tab-${i}`}
              aria-selected={i === active}
              aria-controls="faq-panel"
              data-question
              onClick={() => setActive(i)}
              className={cn(
                "relative flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left transition-colors duration-300",
                i === active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "w-6 shrink-0 font-medium text-xs tabular-nums transition-colors duration-300",
                  i === active && "text-whatsapp-dark",
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 font-medium">{item.q}</span>
              <IconArrowRight
                className={cn(
                  "size-4 shrink-0 transition-all duration-500",
                  EASE,
                  i === active ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0",
                )}
              />
            </button>
          ))}
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <div
            id="faq-panel"
            role="tabpanel"
            aria-labelledby={`faq-tab-${active}`}
            className="relative flex min-h-[26rem] flex-col overflow-hidden rounded-[2rem] bg-[#0f2414] p-8 text-white xl:p-10"
          >
            {/* A soft lime glow in the corner. */}
            <span
              aria-hidden
              className="-top-24 -right-24 pointer-events-none absolute size-72 rounded-full bg-[radial-gradient(circle,rgba(203,255,165,0.22),transparent_70%)]"
            />
            <p className="relative font-medium text-[#cbffa5] text-sm tabular-nums">
              {String(active + 1).padStart(2, "0")} <span className="text-white/40">/ {count}</span>
            </p>
            {/* Keyed by the question: each change slides in again. */}
            <div
              key={active}
              className="relative mt-6 flex-1 space-y-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500"
            >
              <h3 className="font-semibold text-2xl leading-snug tracking-tight xl:text-3xl">{current.q}</h3>
              <p className="text-lg text-white/75 leading-relaxed">{current.a}</p>
            </div>
            <div className="relative mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white/[0.06] p-4 pl-5">
              <span className="text-sm text-white/70">Une autre question ?</span>
              <a
                href="#contact"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[#cbffa5] px-4 font-medium text-[#0f2414] text-sm transition-transform hover:translate-x-0.5"
              >
                Nous contacter
                <IconArrowRight className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Phone: one answer open at a time, opening and closing in height. */}
      <div className="space-y-2 lg:hidden">
        {items.map((item, i) => {
          const shown = open === i;
          return (
            <div key={item.q} className={cn("rounded-3xl transition-colors duration-500", EASE, shown && "bg-page")}>
              <button
                type="button"
                aria-expanded={shown}
                aria-controls={`faq-answer-${i}`}
                onClick={() => setOpen(shown ? null : i)}
                className="flex w-full items-center gap-4 px-4 py-4 text-left"
              >
                <span
                  className={cn(
                    "w-6 shrink-0 font-medium text-xs tabular-nums text-muted-foreground",
                    shown && "text-whatsapp-dark",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 font-medium">{item.q}</span>
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-500",
                    EASE,
                    shown ? "rotate-45 bg-ink text-white" : "bg-page",
                  )}
                >
                  <IconPlus className="size-4" />
                </span>
              </button>
              <div
                id={`faq-answer-${i}`}
                className={cn(
                  "grid transition-[grid-template-rows,opacity] duration-500",
                  EASE,
                  shown ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="overflow-hidden">
                  <p className="pr-6 pb-5 pl-14 text-muted-foreground">{item.a}</p>
                </div>
              </div>
            </div>
          );
        })}
        <a
          href="#contact"
          className="mt-4 flex items-center justify-between gap-4 rounded-3xl bg-[#0f2414] p-5 text-white"
        >
          <span className="text-sm text-white/75">Une autre question ?</span>
          <span className="inline-flex items-center gap-2 font-medium text-[#cbffa5] text-sm">
            Nous contacter
            <IconArrowRight className="size-4" />
          </span>
        </a>
      </div>
    </>
  );
}
