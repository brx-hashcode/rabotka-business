"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { IconArrowRight, IconPlus } from "@tabler/icons-react";

import { cn } from "#/lib/utils";

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/**
 * The FAQ as one centred accordion, a handful of questions, one open at a
 * time. Each answer slides open (grid rows 0fr → 1fr) and fades in; all of
 * them stay in the HTML, so search engines read every one.
 */
export function FaqAccordion({ items }: Readonly<{ items: { q: string; a: string }[] }>) {
  const [open, setOpen] = useState<number | null>(0);
  const id = useId();

  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="mx-auto w-full max-w-3xl space-y-10 px-4 sm:px-6">
        <div className="space-y-3 text-center">
          <p className="font-medium text-sm text-whatsapp-dark">Questions fréquentes</p>
          <h2 className="font-semibold text-3xl tracking-tight sm:text-4xl">Tout savoir avant de commencer</h2>
        </div>
        <div className="space-y-2">
          {items.map((item, i) => {
            const shown = open === i;
            return (
              <div
                key={item.q}
                className="rounded-3xl bg-card"
              >
                <h3>
                  <button
                    type="button"
                    id={`${id}-q${i}`}
                    aria-expanded={shown}
                    aria-controls={`${id}-a${i}`}
                    onClick={() => setOpen(shown ? null : i)}
                    className="flex w-full items-center gap-4 rounded-3xl p-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-whatsapp/40"
                  >
                    <span className="flex-1 font-semibold text-[17px] leading-snug">{item.q}</span>
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full transition-all duration-500",
                        EASE,
                        shown ? "rotate-45 bg-ink text-white" : "bg-page",
                      )}
                    >
                      <IconPlus className="size-4" />
                    </span>
                  </button>
                </h3>
                <div
                  id={`${id}-a${i}`}
                  role="region"
                  aria-labelledby={`${id}-q${i}`}
                  className={cn(
                    "grid transition-[grid-template-rows] duration-500 motion-reduce:transition-none",
                    EASE,
                    shown ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="overflow-hidden" inert={!shown}>
                    <p
                      className={cn(
                        "px-5 pb-6 text-muted-foreground leading-relaxed transition-all duration-500 motion-reduce:transition-none",
                        EASE,
                        shown ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
                      )}
                    >
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-center text-muted-foreground text-sm">
          Une autre question ?{" "}
          <Link href="/contact" className="inline-flex items-center gap-1 font-medium text-foreground hover:underline">
            Nous contacter
            <IconArrowRight className="size-4" />
          </Link>
        </p>
      </div>
    </section>
  );
}
